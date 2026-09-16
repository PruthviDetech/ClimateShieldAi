import {
  EarlyWarning,
  EarlyWarningKind,
  EnvironmentalMetrics,
  HourlyForecast,
  UserProfile,
} from '../types/climate';

/**
 * ============================================================
 *  EARLY WARNING ENGINE (Step 8) — "Outlook 24"
 * ============================================================
 *
 * Scans the personalized 24-hour risk forecast (built from LIVE
 * Open-Meteo weather + air-quality data for the selected location)
 * and detects upcoming periods where:
 *
 *   • the ClimateShield Risk Index becomes HIGH or SEVERE
 *   • temperature / heat becomes dangerous
 *   • PM2.5 / AQI becomes significantly elevated
 *   • UV becomes high
 *   • multiple environmental risks coincide (compound)
 *
 * Everything is derived from live data + the user's personal risk
 * profile — no fake/static warning data. Output is experimental
 * environmental alerting, NOT official medical or government warnings.
 *
 * Profile influence: sensitive profiles (high heat/air sensitivity,
 * vulnerability factors) lower the effective trigger thresholds so
 * warnings appear earlier; resilient profiles raise them slightly.
 */

export const NO_WARNING_MESSAGE = 'Conditions currently look relatively safe.';

/* ---------------- Profile-aware thresholds ---------------- */

export interface WarningThresholds {
  /** Index score that counts as "becomes High or Severe". */
  riskHigh: number; // default 60 = start of the HIGH band
  /** Feels-like °C considered dangerous heat. */
  heatFeelsLike: number;
  /** Wet-bulb °C considered dangerous heat stress. */
  heatWetBulb: number;
  /** US AQI considered significantly elevated. */
  aqiElevated: number;
  /** PM2.5 µg/m³ considered significantly elevated. */
  pm25Elevated: number;
  /** UV index considered high. */
  uvHigh: number;
}

const DEFAULT_THRESHOLDS: WarningThresholds = {
  riskHigh: 60,
  heatFeelsLike: 36,
  heatWetBulb: 28, // classic WBGT caution line
  aqiElevated: 100, // US AQI: upper edge of "Moderate"
  pm25Elevated: 35.4, // US EPA breakpoint boundary
  uvHigh: 6,
};

/** Sensitivity score → threshold multiplier (lower = triggers sooner). */
const SENSITIVE_SHIFT = 0.88; // ~12% earlier triggering
const RESILIENT_SHIFT = 1.08; // triggers later

const NEUTRAL_PROFILE: UserProfile = {
  ageGroup: 'adult',
  outdoorActivityLevel: 'moderate',
  sensitivityToHeat: 'medium',
  sensitivityToAirPollution: 'medium',
  vulnerabilityFactors: [],
};

/** Self-reported profile → raw sensitivity score (higher = more sensitive). */
const profileSensitivity = (profile: UserProfile): number => {
  let sensitivity = 0;

  switch (profile.sensitivityToHeat) {
    case 'high': sensitivity += 1.5; break;
    case 'medium': sensitivity += 0.5; break;
    case 'low': sensitivity -= 0.5; break;
  }
  switch (profile.sensitivityToAirPollution) {
    case 'high': sensitivity += 1.5; break;
    case 'medium': sensitivity += 0.5; break;
    case 'low': sensitivity -= 0.5; break;
  }
  if (profile.ageGroup === 'child' || profile.ageGroup === 'senior') sensitivity += 1;
  if (profile.outdoorActivityLevel === 'high') sensitivity += 0.5;
  sensitivity += profile.vulnerabilityFactors.length * 0.75;

  return sensitivity;
};

/** Public: warning thresholds adjusted by the user's personal risk profile. */
export const getWarningThresholds = (profile: UserProfile): WarningThresholds => {
  const sensitivity = profileSensitivity(profile);
  const shift = sensitivity >= 1.5 ? SENSITIVE_SHIFT : sensitivity <= -0.5 ? RESILIENT_SHIFT : 1;
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return {
    riskHigh: r1(DEFAULT_THRESHOLDS.riskHigh * shift),
    heatFeelsLike: r1(DEFAULT_THRESHOLDS.heatFeelsLike * shift),
    heatWetBulb: r1(DEFAULT_THRESHOLDS.heatWetBulb * shift),
    aqiElevated: Math.round(DEFAULT_THRESHOLDS.aqiElevated * shift),
    pm25Elevated: r1(DEFAULT_THRESHOLDS.pm25Elevated * shift),
    uvHigh: r1(DEFAULT_THRESHOLDS.uvHigh * shift),
  };
};

/* ---------------- Per-hour hazard detection ---------------- */

/** Severity: 0 = none, 1 = approaching (WATCH), 2 = exceeded (WARNING), 3 = well beyond (CRITICAL). */
interface HourFlag {
  kind: EarlyWarningKind;
  sev: number;
  /** For COMPOUND flags: the kinds coinciding this hour. */
  contrib?: EarlyWarningKind[];
}

/** Simplified Stull wet-bulb estimate (°C) from air temp + relative humidity. */
const wetBulbApprox = (tempC: number, rhPercent: number): number => {
  const rh = Math.min(100, Math.max(0, rhPercent));
  return (
    tempC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(tempC + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035
  );
};

const detectHourFlags = (h: HourlyForecast, t: WarningThresholds): HourFlag[] => {
  const flags: HourFlag[] = [];

  // 1) Composite risk index becomes HIGH/SEVERE.
  if (h.riskScore >= t.riskHigh + 20) flags.push({ kind: 'RISK_INDEX', sev: 3 });
  else if (h.riskScore >= t.riskHigh) flags.push({ kind: 'RISK_INDEX', sev: 2 });
  else if (h.riskScore >= t.riskHigh - 10) flags.push({ kind: 'RISK_INDEX', sev: 1 });

  // 2) Dangerous heat (feels-like + wet-bulb stress).
  const wb = wetBulbApprox(h.temp, h.humidity);
  const heatHit = h.feelsLike >= t.heatFeelsLike || wb >= t.heatWetBulb;
  const heatCritical = h.feelsLike >= t.heatFeelsLike + 3 || wb >= t.heatWetBulb + 2;
  const heatWatch = h.feelsLike >= t.heatFeelsLike - 3 || wb >= t.heatWetBulb - 1;
  if (heatCritical) flags.push({ kind: 'HEAT', sev: 3 });
  else if (heatHit) flags.push({ kind: 'HEAT', sev: 2 });
  else if (heatWatch) flags.push({ kind: 'HEAT', sev: 1 });

  // 3) Significantly elevated PM2.5 / AQI.
  const airHit = h.aqi >= t.aqiElevated || h.pm25 >= t.pm25Elevated;
  const airCritical = h.aqi >= t.aqiElevated + 50 || h.pm25 >= t.pm25Elevated * 2;
  const airWatch = h.aqi >= t.aqiElevated - 25;
  if (airCritical) flags.push({ kind: 'AIR_QUALITY', sev: 3 });
  else if (airHit) flags.push({ kind: 'AIR_QUALITY', sev: 2 });
  else if (airWatch) flags.push({ kind: 'AIR_QUALITY', sev: 1 });

  // 4) High UV.
  if (h.uv >= t.uvHigh + 5) flags.push({ kind: 'UV', sev: 3 });
  else if (h.uv >= t.uvHigh) flags.push({ kind: 'UV', sev: 2 });
  else if (h.uv >= t.uvHigh - 1.5) flags.push({ kind: 'UV', sev: 1 });

  // 5) Compound: two or more substantive (sev ≥ 2) hazards in the same hour.
  const substantive = flags.filter((f) => f.sev >= 2);
  if (substantive.length >= 2) {
    flags.push({
      kind: 'COMPOUND',
      sev: Math.min(3, Math.max(...substantive.map((f) => f.sev))),
      contrib: substantive.map((f) => f.kind),
    });
    // Suppress WATCH-level individual flags in compound hours to cut noise.
    return flags.filter((f) => f.kind === 'COMPOUND' || f.sev >= 2);
  }

  return flags;
};

/* ---------------- Grouping consecutive hours into warning windows ---------------- */

interface HourGroup {
  kind: EarlyWarningKind;
  hours: HourlyForecast[];
  maxSev: number;
  contrib: EarlyWarningKind[]; // union of contributing kinds within the group
}

const groupHourFlags = (hourly: HourlyForecast[], thresholds: WarningThresholds): HourGroup[] => {
  const open = new Map<EarlyWarningKind, HourGroup>();
  const closed: HourGroup[] = [];

  for (const h of hourly) {
    const flags = detectHourFlags(h, thresholds);
    const active = new Set(flags.map((f) => f.kind));

    // Close groups whose kind is no longer active this hour.
    for (const [kind, group] of open) {
      if (!active.has(kind)) {
        closed.push(group);
        open.delete(kind);
      }
    }

    for (const f of flags) {
      const group = open.get(f.kind);
      if (group) {
        group.hours.push(h);
        group.maxSev = Math.max(group.maxSev, f.sev);
        if (f.contrib) {
          for (const k of f.contrib) if (!group.contrib.includes(k)) group.contrib.push(k);
        }
      } else {
        open.set(f.kind, {
          kind: f.kind,
          hours: [h],
          maxSev: f.sev,
          contrib: f.contrib ? [...f.contrib] : [f.kind],
        });
      }
    }
  }
  closed.push(...open.values());

  // Qualification: real warnings (maxSev ≥ 2) always qualify; WATCH-level
  // (maxSev = 1) only qualifies when it persists across 2+ consecutive hours
  // (a single borderline hour is noise).
  return closed.filter((g) => g.maxSev >= 2 || g.hours.length >= 2);
};

/* ---------------- Presentation ---------------- */

const LEVELS: Record<number, EarlyWarning['level']> = {
  1: 'WATCH',
  2: 'WARNING',
  3: 'CRITICAL',
};

const CAUSES: Record<EarlyWarningKind, string> = {
  RISK_INDEX: 'Elevated ClimateShield Risk Index',
  HEAT: 'Dangerous heat',
  AIR_QUALITY: 'Elevated air pollution (PM2.5 / AQI)',
  UV: 'High UV radiation',
  COMPOUND: 'Multiple environmental risks coinciding',
};

const ACTIONS: Record<EarlyWarningKind, string> = {
  RISK_INDEX: 'Limit prolonged outdoor exertion during this window and keep hydration within reach.',
  HEAT: 'Stay in shade or indoors, hydrate steadily, and postpone strenuous activity until it passes.',
  AIR_QUALITY: 'Reduce outdoor exertion; keep windows closed during the peak and use filtration if available.',
  UV: 'Use SPF 30+ sunscreen, wear sunglasses and a hat, and seek shade.',
  COMPOUND: 'Plan indoor or low-exertion activity for this window and apply the heat, air-quality and sun precautions that apply.',
};

const causeFor = (group: HourGroup): string => {
  if (group.kind !== 'COMPOUND') return CAUSES[group.kind];
  const labels = group.contrib.map((k) => CAUSES[k] ?? k);
  return `Coinciding risks: ${labels.slice(0, 3).join(' + ')}`;
};

const explanationFor = (
  group: HourGroup,
  worst: HourlyForecast,
  thresholds: WarningThresholds,
  profileShifted: boolean,
): string => {
  const bits: string[] = [];
  bits.push(`Index peaks at ${worst.riskScore}/100 (${worst.riskLevel.toLowerCase()})`);
  if (group.kind === 'HEAT' || (group.kind === 'COMPOUND' && group.contrib.includes('HEAT'))) {
    bits.push(`feels-like around ${worst.feelsLike}°C`);
  }
  if (group.kind === 'AIR_QUALITY' || (group.kind === 'COMPOUND' && group.contrib.includes('AIR_QUALITY'))) {
    bits.push(`US AQI near ${worst.aqi} (PM2.5 ${worst.pm25} µg/m³)`);
  }
  if (group.kind === 'UV' || (group.kind === 'COMPOUND' && group.contrib.includes('UV'))) {
    bits.push(`UV index near ${worst.uv}`);
  }
  if (group.kind === 'RISK_INDEX' && worst.topFactor) {
    bits.push(`driven mainly by ${worst.topFactor.toLowerCase()}`);
  }
  let text = `${bits.join(', ')}.`;
  if (profileShifted) {
    text += ' Your personal risk profile lowers the warning threshold for this alert.';
  }
  return text;
};

/**
 * Derive the 24h early-warning outlook from live, personalized forecast data.
 * Returns warnings in chronological order; `isPeakPeriod` marks the single
 * highest-risk upcoming period across all warnings. Empty array = all clear.
 */
export const deriveEarlyWarnings = (
  hourly: HourlyForecast[],
  _metrics: EnvironmentalMetrics,
  profile: UserProfile = NEUTRAL_PROFILE,
): EarlyWarning[] => {
  if (hourly.length === 0) return [];

  const thresholds = getWarningThresholds(profile);
  const profileShifted = thresholds.riskHigh !== DEFAULT_THRESHOLDS.riskHigh;
  const groups = groupHourFlags(hourly, thresholds);

  const warnings: EarlyWarning[] = groups.map((group) => {
    const worst = group.hours.reduce((a, b) => (b.riskScore > a.riskScore ? b : a));
    const first = group.hours[0];
    const last = group.hours[group.hours.length - 1];
    const kind: EarlyWarningKind = group.kind;
    return {
      id: `ew-${kind.toLowerCase()}-${first.time}`,
      kind,
      level: LEVELS[group.maxSev] ?? 'WATCH',
      windowLabel: first.time === last.time ? first.time : `${first.time} – ${last.time}`,
      startHour: first.time,
      cause: causeFor(group),
      riskScore: worst.riskScore,
      riskLevel: worst.riskLevel,
      explanation: explanationFor(group, worst, thresholds, profileShifted),
      action: ACTIONS[kind],
      peakValues: {
        temp: worst.temp,
        feelsLike: worst.feelsLike,
        pm25: worst.pm25,
        aqi: worst.aqi,
        uv: worst.uv,
      },
      isPeakPeriod: false, // assigned below
      contributingKinds: kind === 'COMPOUND' ? group.contrib : undefined,
    };
  });

  // Highlight the single highest-risk upcoming period.
  const peak = warnings.reduce<EarlyWarning | null>(
    (best, w) => (!best || w.riskScore > best.riskScore ? w : best),
    null,
  );
  if (peak) peak.isPeakPeriod = true;

  // Chronological order; compound warnings after their constituent kinds.
  return warnings.sort((a, b) => a.startHour.localeCompare(b.startHour));
};
