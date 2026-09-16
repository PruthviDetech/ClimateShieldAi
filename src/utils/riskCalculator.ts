import { EnvironmentalMetrics, PersonaProfile, RiskLevel } from '../types/climate';
import { getRiskLevelFromScore } from './formatters';

/**
 * ============================================================
 *  CLIMATESHIELD RISK INDEX (CSRI) — v3.0 "Transparent"
 * ============================================================
 *
 * An EXPERIMENTAL environmental risk index (0-100) computed
 * entirely from LIVE Open-Meteo telemetry for the selected
 * location. It is NOT an official medical, governmental, or
 * regulatory classification (not AQI, not NWS heat index
 * categories, not WHO advisories).
 *
 * DESIGN PRINCIPLES
 * 1. Transparency    — every component, weight and threshold is
 *                      declared in the registry below and is
 *                      surfaced in the UI ("Why is my risk high?").
 * 2. Modularity      — each component is an isolated pure
 *                      function (metrics -> 0-100), so individual
 *                      scorers can later be swapped for trained
 *                      ML models without touching the aggregation.
 * 3. Live data only  — no hardcoded city values anywhere in the
 *                      calculation path.
 *
 * FORMULA
 *   CSRI = round( Σ (componentScore_i × weight_i) × personaFactor )
 *   Bands: LOW < 40 | MODERATE 40-59 | HIGH 60-79 | SEVERE >= 80
 *
 * To add an ML model later: implement another scorer with the
 * same `(metrics) => number` signature and register it in
 * CSRI_COMPONENTS. The narrative, drivers and UI update
 * automatically.
 */

/** Version surfaced in the UI so users know which model produced a score. */
export const CSRI_VERSION = 'CSRI v3.0';

export interface CSRIComponentResult {
  /** Registry key, e.g. 'thermal'. Stable id used by the UI. */
  key: string;
  /** Human-readable factor name shown in driver lists. */
  label: string;
  /** Raw 0-100 component score from the scorer. */
  score: number;
  /** Share of the composite index (0-100) after weighting. */
  weightedContribution: number;
  /** Percentage share of the total weighted sum, for display. */
  contributionPercent: number;
}

export interface CSRIResult {
  /** Final 0-100 index (persona-adjusted). */
  score: number;
  /** Band label for the score. */
  level: RiskLevel;
  /** Per-component results, sorted heaviest-first by the caller if desired. */
  components: CSRIComponentResult[];
  /** Weighted composite before persona scaling (0-100). */
  compositeBase: number;
  /** Persona multiplier applied (1.0 = general population). */
  personaFactor: number;
  /** Plain-language explanation of why the score is what it is. */
  narrative: string;
  /** Version string of the engine that produced this result. */
  version: string;
}

/* ------------------------------------------------------------------ */
/* Component scorers — pure functions of LIVE metrics.                */
/* Each returns 0 (negligible risk) .. 100 (maximum risk).            */
/* ------------------------------------------------------------------ */

/** Thermal stress from apparent temperature and wet-bulb globe temperature. */
export const scoreThermal = (metrics: EnvironmentalMetrics): number => {
  const feelsLike = metrics.temperature.feelsLike;
  const wbgt = metrics.wetBulb.tempC;
  if (feelsLike > 25) {
    // Linear ramp above 25°C feels-like, amplified by wet-bulb load above 25°C.
    return clamp100((feelsLike - 22) * 4.5 + (wbgt > 25 ? (wbgt - 25) * 8 : 0));
  }
  if (feelsLike < 5) {
    // Cold stress: risk grows as apparent temperature drops below 10°C.
    return clamp100((10 - feelsLike) * 5);
  }
  // 5-25°C band: near-optimal thermal comfort.
  return 15;
};

/** Air-quality stress from US EPA AQI and PM2.5 concentration. */
export const scoreAirQuality = (metrics: EnvironmentalMetrics): number =>
  clamp100((metrics.airQuality.aqi / 300) * 80 + (metrics.airQuality.pm25 / 150) * 20);

/** Solar UV phototoxic stress. */
export const scoreUv = (metrics: EnvironmentalMetrics): number =>
  clamp100((metrics.uv.index / 12) * 100);

/** Atmospheric stagnation: low wind traps pollutants near the surface. */
export const scoreWindDispersion = (metrics: EnvironmentalMetrics): number => {
  const windSpeed = metrics.wind.speedKmh;
  if (windSpeed < 10) return 80;   // stagnant — poor dispersion
  if (windSpeed < 18) return 50;   // moderate mixing
  return 15;                       // well-mixed boundary layer
};

/** Precipitation-related stress: downpour flood risk plus washout-modulated humidity load. */
export const scorePrecipitation = (metrics: EnvironmentalMetrics): number => {
  const rainProb = metrics.rain.probability;
  const volume = metrics.rain.volumeMm;
  // Heavy imminent rain (probability + volume) drives flash-flood-style stress.
  const eventStress = clamp100((rainProb / 100) * 60 + Math.min(volume, 25) * 1.6);
  // Very dry conditions contribute a small dust/allergen component instead.
  const dryStress = rainProb < 10 && volume === 0 ? 12 : 0;
  return clamp100(Math.max(eventStress, dryStress));
};

/* ------------------------------------------------------------------ */
/* Weights registry — the single source of truth for the formula.     */
/* Weights sum to 1.0.                                                */
/* ------------------------------------------------------------------ */

export interface CSRIComponentDef {
  key: string;
  label: string;
  weight: number;
  score: (metrics: EnvironmentalMetrics) => number;
}

export const CSRI_COMPONENTS: CSRIComponentDef[] = [
  { key: 'air',    label: 'Air Quality (PM2.5 / AQI)',           weight: 0.38, score: scoreAirQuality },
  { key: 'thermal',label: 'Thermal & Wet-Bulb Stress',           weight: 0.30, score: scoreThermal },
  { key: 'uv',     label: 'Solar UV Radiation',                  weight: 0.16, score: scoreUv },
  { key: 'wind',   label: 'Atmospheric Stagnation (Wind)',       weight: 0.10, score: scoreWindDispersion },
  { key: 'rain',   label: 'Precipitation & Flood Stress',        weight: 0.06, score: scorePrecipitation },
];

/* ------------------------------------------------------------------ */
/* Aggregation                                                        */
/* ------------------------------------------------------------------ */

const clamp100 = (value: number): number => Math.min(100, Math.max(0, value));

/** Neutral persona used when none is supplied (per-hour / per-day risk). */
export const DEFAULT_PERSONA: PersonaProfile = {
  id: 'general',
  name: 'General Population',
  label: 'Standard Adult (18-64)',
  ageGroup: '18 - 64 years',
  vulnerabilityFactor: 1.0,
  keySensitivities: [],
  customAdvice: [],
  recommendedMaxExposureMins: 120,
};

/**
 * Compute the transparent ClimateShield Risk Index for the given
 * live metrics and (optionally) a vulnerability persona.
 */
export function calculateClimateShieldRisk(
  metrics: EnvironmentalMetrics,
  persona?: PersonaProfile,
): CSRIResult {
  const personaFactor = persona?.vulnerabilityFactor ?? 1.0;

  const components: CSRIComponentResult[] = CSRI_COMPONENTS.map((def) => {
    const raw = clamp100(def.score(metrics));
    const weighted = raw * def.weight;
    return {
      key: def.key,
      label: def.label,
      score: Math.round(raw),
      weightedContribution: weighted,
      contributionPercent: 0, // filled after totals are known
    };
  });

  const totalWeighted = components.reduce((sum, c) => sum + c.weightedContribution, 0);
  const compositeBase = clamp100(totalWeighted);

  // contributionPercent = share of the weighted composite (normalizes to ~100%).
  components.forEach((c) => {
    c.contributionPercent = totalWeighted > 0 ? Math.round((c.weightedContribution / totalWeighted) * 100) : 0;
  });

  const score = Math.min(100, Math.round(compositeBase * personaFactor));
  const level = getRiskLevelFromScore(score);

  return {
    score,
    level,
    components: components.sort((a, b) => b.weightedContribution - a.weightedContribution),
    compositeBase: Math.round(compositeBase),
    personaFactor,
    narrative: buildNarrative(score, level, components, metrics, personaFactor),
    version: CSRI_VERSION,
  };
}

/* ------------------------------------------------------------------ */
/* Narrative generator — answers "Why is my risk high/low?"           */
/* ------------------------------------------------------------------ */

const LOW_WORDS = 'favorable';
const HIGH_WORDS = 'elevated';

function buildNarrative(
  score: number,
  level: RiskLevel,
  components: CSRIComponentResult[],
  metrics: EnvironmentalMetrics,
  personaFactor: number,
): string {
  const top = components[0];
  const second = components[1];
  const posture = score >= 60 ? HIGH_WORDS : score >= 40 ? 'moderate' : LOW_WORDS;

  const parts: string[] = [];
  parts.push(
    `The index is ${score}/100 (${level}) — ${posture} for the selected location at this moment.`
  );

  if (top) {
    parts.push(
      `The largest contributor is ${top.label.toLowerCase()} at ${top.contributionPercent}% of the composite` +
      ` (component score ${top.score}/100).`
    );
  }
  if (second && second.contributionPercent > 0) {
    parts.push(
      `It is followed by ${second.label.toLowerCase()} at ${second.contributionPercent}%.`
    );
  }

  // Live evidence clauses.
  const evidence: string[] = [];
  if (metrics.airQuality.aqi > 100) evidence.push(`US AQI ${metrics.airQuality.aqi} with PM2.5 at ${metrics.airQuality.pm25} µg/m³`);
  else evidence.push(`US AQI ${metrics.airQuality.aqi} with PM2.5 at ${metrics.airQuality.pm25} µg/m³ (within moderate range)`);
  evidence.push(`feels-like ${metrics.temperature.feelsLike}°C and wet-bulb ${metrics.wetBulb.tempC}°C`);
  evidence.push(`UV index ${metrics.uv.index}`);
  evidence.push(`wind ${metrics.wind.speedKmh} km/h (${metrics.wind.dispersionCapacity.toLowerCase()} dispersion)`);
  parts.push(`Live inputs: ${evidence.join('; ')}.`);

  if (personaFactor !== 1.0) {
    parts.push(
      `Your ${personaFactor > 1 ? 'selected vulnerability profile increases' : 'selected profile lowers'} the composite by a ×${personaFactor.toFixed(2)} factor.`
    );
  }

  return parts.join(' ');
}

/* ------------------------------------------------------------------ */
/* Back-compat shim                                                   */
/* ------------------------------------------------------------------ */

/**
 * @deprecated Legacy shape used by older callers. Prefer CSRIResult.
 */
export interface LegacyRiskBreakdown {
  thermalScore: number;
  airQualityScore: number;
  uvScore: number;
  windDispersionScore: number;
  compositeBase: number;
  adjustedScore: number;
}

/** Legacy adapter: returns the v2-style flat breakdown from a CSRI result. */
export const toLegacyBreakdown = (result: CSRIResult): LegacyRiskBreakdown => {
  const find = (key: string) => result.components.find((c) => c.key === key)?.score ?? 0;
  return {
    thermalScore: find('thermal'),
    airQualityScore: find('air'),
    uvScore: find('uv'),
    windDispersionScore: find('wind'),
    compositeBase: result.compositeBase,
    adjustedScore: result.score,
  };
};
