import {
  OutdoorActivityLevel,
  PersonaProfile,
  SensitivityLevel,
  UserProfile,
  VulnerabilityFactor,
} from '../types/climate';
import {
  CSRI_COMPONENTS,
  CSRIResult,
  scoreThermal,
  scoreAirQuality,
  scoreUv,
  scoreWindDispersion,
  scorePrecipitation,
} from './riskCalculator';
import { EnvironmentalMetrics } from '../types/climate';

/**
 * ============================================================
 *  PERSONAL RISK PROFILE ENGINE (Step 6)
 * ============================================================
 *
 * Converts a user's self-reported profile (age group, outdoor
 * activity level, heat/air sensitivities, optional vulnerability
 * factors) into per-component adjustments to the transparent
 * CSRI v3.0 index. Replaces the old single global persona
 * multiplier with targeted, explainable modulation:
 *
 *   personalScore = clamp( Σ (componentScore × personalMultipliers × weight) )
 *
 * Every adjustment is attributed, so the UI can show exactly
 * which profile factors increased the risk and by how much.
 *
 * Non-medical: inputs are user-declared context, not clinical
 * data. No diagnosis is performed or implied.
 */

/** Per-component personalization multipliers (default 1.0 = no change). */
export interface PersonalMultipliers {
  air: number;
  thermal: number;
  uv: number;
  wind: number;
  rain: number;
}

export const NEUTRAL_MULTIPLIERS: PersonalMultipliers = {
  air: 1, thermal: 1, uv: 1, wind: 1, rain: 1,
};

/** A single attributed risk change caused by one profile factor. */
export interface PersonalFactorImpact {
  /** Profile source, e.g. 'High sensitivity to air pollution'. */
  factor: string;
  /** Which CSRI component it modulated. */
  componentKey: string;
  /** Component label for display. */
  componentLabel: string;
  /** Points added to the final 0-100 score (positive = increased risk). */
  pointsAdded: number;
  /** Short human-readable description. */
  detail: string;
}

export interface PersonalizedRiskResult extends CSRIResult {
  /** The profile these results were computed for. */
  profile: UserProfile;
  /** Multipliers applied per component. */
  multipliers: PersonalMultipliers;
  /** Neutral (general-population) score for comparison. */
  baselineScore: number;
  /** Delta vs baseline (positive = profile increases personal risk). */
  profileDelta: number;
  /** Attributed per-factor impacts, sorted by absolute points added. */
  factorImpacts: PersonalFactorImpact[];
  /** Profile-specific safety recommendations (non-medical). */
  personalRecommendations: PersonalRecommendation[];
}

export interface PersonalRecommendation {
  id: string;
  /** Which profile aspect triggered it. */
  source: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/* ------------------------------------------------------------------ */
/* Factor → multiplier mapping                                        */
/* ------------------------------------------------------------------ */

const AGE_MULTIPLIERS: Record<UserProfile['ageGroup'], PersonalMultipliers> = {
  child:  { air: 1.25, thermal: 1.15, uv: 1.1,  wind: 1.0, rain: 1.0 },
  teen:   { air: 1.1,  thermal: 1.0,  uv: 1.05, wind: 1.0, rain: 1.0 },
  adult:  { air: 1.0,  thermal: 1.0,  uv: 1.0,  wind: 1.0, rain: 1.0 },
  senior: { air: 1.2,  thermal: 1.3,  uv: 1.0,  wind: 1.0, rain: 1.1 },
};

const ACTIVITY_MULTIPLIERS: Record<OutdoorActivityLevel, PersonalMultipliers> = {
  low:      { air: 0.95, thermal: 0.95, uv: 0.9,  wind: 1.0, rain: 1.0 },
  moderate: { air: 1.0,  thermal: 1.0,  uv: 1.0,  wind: 1.0, rain: 1.0 },
  high:     { air: 1.2,  thermal: 1.15, uv: 1.2,  wind: 1.0, rain: 1.05 },
};

const HEAT_SENSITIVITY_MULTIPLIERS: Record<SensitivityLevel, PersonalMultipliers> = {
  low:    { air: 1.0, thermal: 0.85, uv: 1.0, wind: 1.0, rain: 1.0 },
  medium: { air: 1.0, thermal: 1.0,  uv: 1.0, wind: 1.0, rain: 1.0 },
  high:   { air: 1.0, thermal: 1.35, uv: 1.1, wind: 1.0, rain: 1.0 },
};

const AIR_SENSITIVITY_MULTIPLIERS: Record<SensitivityLevel, PersonalMultipliers> = {
  low:    { air: 0.85, thermal: 1.0, uv: 1.0, wind: 1.0, rain: 1.0 },
  medium: { air: 1.0,  thermal: 1.0, uv: 1.0, wind: 1.0, rain: 1.0 },
  high:   { air: 1.4,  thermal: 1.0, uv: 1.0, wind: 1.0, rain: 1.0 },
};

/** Optional vulnerability factors and the components they modulate. */
export const VULNERABILITY_FACTORS: Array<{
  id: VulnerabilityFactor['id'];
  label: string;
  description: string;
  multipliers: PersonalMultipliers;
}> = [
  {
    id: 'respiratory',
    label: 'Breathing sensitivity (e.g. asthma)',
    description: 'Air pollution contributes more to your personal risk.',
    multipliers: { air: 1.45, thermal: 1.0, uv: 1.0, wind: 1.0, rain: 1.0 },
  },
  {
    id: 'cardiovascular',
    label: 'Heart or circulation sensitivity',
    description: 'Heat stress contributes more to your personal risk.',
    multipliers: { air: 1.0, thermal: 1.25, uv: 1.0, wind: 1.0, rain: 1.0 },
  },
  {
    id: 'heat_intolerance',
    label: 'Heat intolerance',
    description: 'Heat and solar UV contribute more to your personal risk.',
    multipliers: { air: 1.0, thermal: 1.3, uv: 1.15, wind: 1.0, rain: 1.0 },
  },
  {
    id: 'outdoor_worker',
    label: 'Spend long hours outdoors',
    description: 'Exposure-related components contribute more to your personal risk.',
    multipliers: { air: 1.2, thermal: 1.2, uv: 1.25, wind: 1.0, rain: 1.1 },
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy',
    description: 'Heat and air pollution contribute more to your personal risk.',
    multipliers: { air: 1.2, thermal: 1.2, uv: 1.0, wind: 1.0, rain: 1.0 },
  },
];

/** Compose the per-component multipliers for a profile. */
export const getPersonalMultipliers = (profile: UserProfile): PersonalMultipliers => {
  const compose = (list: PersonalMultipliers[]): PersonalMultipliers =>
    list.reduce<PersonalMultipliers>(
      (acc, m) => ({
        air: acc.air * m.air,
        thermal: acc.thermal * m.thermal,
        uv: acc.uv * m.uv,
        wind: acc.wind * m.wind,
        rain: acc.rain * m.rain,
      }),
      { ...NEUTRAL_MULTIPLIERS },
    );

  const age = AGE_MULTIPLIERS[profile.ageGroup];
  const activity = ACTIVITY_MULTIPLIERS[profile.outdoorActivityLevel];
  const heat = HEAT_SENSITIVITY_MULTIPLIERS[profile.sensitivityToHeat];
  const air = AIR_SENSITIVITY_MULTIPLIERS[profile.sensitivityToAirPollution];
  const factors = profile.vulnerabilityFactors.map(
    (f) => VULNERABILITY_FACTORS.find((v) => v.id === f.id)?.multipliers ?? NEUTRAL_MULTIPLIERS,
  );

  return compose([age, activity, heat, air, ...factors]);
};

/** The five CSRI component scorers, keyed by registry key. */
const SCORERS: Record<string, (m: EnvironmentalMetrics) => number> = {
  air: scoreAirQuality,
  thermal: scoreThermal,
  uv: scoreUv,
  wind: scoreWindDispersion,
  rain: scorePrecipitation,
};

/**
 * Compute the personalized ClimateShield Risk Index.
 * Same aggregation as CSRI v3.0, but each component score is
 * scaled by the profile's personal multiplier for that component.
 */
export function calculatePersonalRisk(
  metrics: EnvironmentalMetrics,
  profile: UserProfile,
): PersonalizedRiskResult {
  const multipliers = getPersonalMultipliers(profile);

  const baselineComponents = CSRI_COMPONENTS.map((def) => {
    const scorer = SCORERS[def.key];
    const raw = Math.min(100, Math.max(0, scorer(metrics)));
    return { key: def.key, label: def.label, weight: def.weight, raw };
  });

  const totalBaseline = baselineComponents.reduce((s, c) => s + c.raw * c.weight, 0);
  const baselineScore = Math.round(Math.min(100, Math.max(0, totalBaseline)));

  const components = baselineComponents.map((c) => {
    const mult = multipliers[c.key as keyof PersonalMultipliers] ?? 1;
    const personalRaw = Math.min(100, Math.max(0, c.raw * mult));
    return { ...c, mult, personalRaw };
  });

  const totalPersonal = components.reduce((s, c) => s + c.personalRaw * c.weight, 0);
  const score = Math.round(Math.min(100, Math.max(0, totalPersonal)));

  // Attribute the delta to individual factors: proportional split of each
  // component's weighted increase across the profile features that raised it.
  const rawImpacts: PersonalFactorImpact[] = [];

  const pushImpact = (
    factor: string,
    componentKey: string,
    componentLabel: string,
    weightedDelta: number,
    detail: string,
  ) => {
    if (weightedDelta <= 0.05) return; // ignore negligible
    rawImpacts.push({
      factor,
      componentKey,
      componentLabel,
      pointsAdded: Math.round(weightedDelta),
      detail,
    });
  };

  const describe = (componentKey: string, m: EnvironmentalMetrics): string => {
    switch (componentKey) {
      case 'air':
        return `live US AQI ${m.airQuality.aqi}, PM2.5 ${m.airQuality.pm25} µg/m³`;
      case 'thermal':
        return `live feels-like ${m.temperature.feelsLike}°C, wet-bulb ${m.wetBulb.tempC}°C`;
      case 'uv':
        return `live UV index ${m.uv.index}`;
      case 'wind':
        return `live wind ${m.wind.speedKmh} km/h`;
      case 'rain':
        return `live rain probability ${m.rain.probability}%`;
      default:
        return 'live conditions';
    }
  };

  // Per-feature deltas (age, activity, heat, air, each vulnerability factor),
  // applied multiplicatively in the same order as getPersonalMultipliers so
  // the attribution sums to (approximately) the real profile delta.
  const featureMultipliers: Array<{ factor: string; m: PersonalMultipliers }> = [
    { factor: `Age group: ${profile.ageGroup}`, m: AGE_MULTIPLIERS[profile.ageGroup] },
    { factor: `Activity level: ${profile.outdoorActivityLevel}`, m: ACTIVITY_MULTIPLIERS[profile.outdoorActivityLevel] },
    { factor: `Heat sensitivity: ${profile.sensitivityToHeat}`, m: HEAT_SENSITIVITY_MULTIPLIERS[profile.sensitivityToHeat] },
    { factor: `Air pollution sensitivity: ${profile.sensitivityToAirPollution}`, m: AIR_SENSITIVITY_MULTIPLIERS[profile.sensitivityToAirPollution] },
    ...profile.vulnerabilityFactors.map((f) => {
      const def = VULNERABILITY_FACTORS.find((v) => v.id === f.id);
      return { factor: def?.label ?? f.id, m: def?.multipliers ?? NEUTRAL_MULTIPLIERS };
    }),
  ];

  // Simulate the multiplicative composition feature-by-feature to attribute deltas.
  let runningAir = 1, runningThermal = 1, runningUv = 1, runningWind = 1, runningRain = 1;
  let prevScoreRaw = totalBaseline;
  for (const feature of featureMultipliers) {
    runningAir *= feature.m.air;
    runningThermal *= feature.m.thermal;
    runningUv *= feature.m.uv;
    runningWind *= feature.m.wind;
    runningRain *= feature.m.rain;

    const runningTotal = baselineComponents.reduce((s, c) => {
      const mult =
        c.key === 'air' ? runningAir :
        c.key === 'thermal' ? runningThermal :
        c.key === 'uv' ? runningUv :
        c.key === 'wind' ? runningWind : runningRain;
      return s + Math.min(100, c.raw * mult) * c.weight;
    }, 0);

    const featureDelta = runningTotal - prevScoreRaw;
    if (featureDelta > 0.05) {
      // Assign this feature's delta to its strongest affected component.
      const strongest = baselineComponents.reduce((best, c) => {
        const mult = feature.m[c.key as keyof PersonalMultipliers] ?? 1;
        const weightedEffect = (mult - 1) * c.raw * c.weight;
        const bestMult = best ? (feature.m[best.key as keyof PersonalMultipliers] ?? 1) : 1;
        const bestEffect = (bestMult - 1) * best.raw * best.weight;
        return weightedEffect > bestEffect ? c : best;
      }, baselineComponents[0]);
      if (strongest && (feature.m[strongest.key as keyof PersonalMultipliers] ?? 1) > 1) {
        pushImpact(
          feature.factor,
          strongest.key,
          strongest.label,
          featureDelta,
          describe(strongest.key, metrics),
        );
      }
    }
    prevScoreRaw = runningTotal;
  }

  rawImpacts.sort((a, b) => b.pointsAdded - a.pointsAdded);

  const level = getBand(score);
  const top = [...components].sort((a, b) => b.personalRaw * b.weight - a.personalRaw * a.weight)[0];

  const narrative = buildPersonalNarrative(score, level, baselineScore, components, metrics, profile, rawImpacts);

  return {
    score,
    level,
    components: components.map((c) => ({
      key: c.key,
      label: c.label,
      score: Math.round(c.personalRaw),
      weightedContribution: c.personalRaw * c.weight,
      contributionPercent: totalPersonal > 0 ? Math.round((c.personalRaw * c.weight / totalPersonal) * 100) : 0,
    })).sort((a, b) => b.weightedContribution - a.weightedContribution),
    compositeBase: Math.round(totalPersonal),
    personaFactor: 1,
    narrative,
    version: 'CSRI v3.1-personal',
    profile,
    multipliers,
    baselineScore,
    profileDelta: score - baselineScore,
    factorImpacts: rawImpacts,
    personalRecommendations: buildPersonalRecommendations(metrics, profile, components, score),
  };
}

const getBand = (score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' => {
  if (score < 40) return 'LOW';
  if (score < 60) return 'MODERATE';
  if (score < 80) return 'HIGH';
  return 'SEVERE';
};

function buildPersonalNarrative(
  score: number,
  level: string,
  baselineScore: number,
  components: Array<{ key: string; label: string; personalRaw: number; weight: number }>,
  metrics: EnvironmentalMetrics,
  profile: UserProfile,
  impacts: PersonalFactorImpact[],
): string {
  const posture = score >= 60 ? 'elevated' : score >= 40 ? 'moderate' : 'favorable';
  const parts: string[] = [];
  parts.push(
    `Your personal index is ${score}/100 (${level}) — ${posture} for your profile at this location right now.`
  );

  if (score !== baselineScore) {
    const direction = score > baselineScore ? 'higher' : 'lower';
    parts.push(
      `That is ${Math.abs(score - baselineScore)} points ${direction} than the general-population index of ${baselineScore}, based on your profile.`
    );
  }

  if (top2(components).length > 0) {
    const [first, second] = top2(components);
    parts.push(
      `The dominant personal factor is ${first.label.toLowerCase()} (${Math.round(first.personalRaw * first.weight)} weighted points${second ? `, ahead of ${second.label.toLowerCase()}` : ''}).`
    );
  }

  if (impacts.length > 0) {
    parts.push(
      `Profile factors raising your risk: ${impacts.slice(0, 3).map((i) => `${i.factor.toLowerCase()} (+${i.pointsAdded})`).join(', ')}.`
    );
  } else {
    parts.push('No profile factor currently raises your index above the general-population baseline.');
  }

  return parts.join(' ');
}

const top2 = <T,>(arr: T[]): T[] => arr.slice(0, 2);

/**
 * Profile-aware safety recommendations. Strictly general-purpose
 * environmental-precaution guidance — no medical advice or diagnosis.
 */
export function buildPersonalRecommendations(
  metrics: EnvironmentalMetrics,
  profile: UserProfile,
  components: Array<{ key: string; personalRaw: number; weight: number }>,
  score: number,
): PersonalRecommendation[] {
  const recs: PersonalRecommendation[] = [];
  const has = (id: VulnerabilityFactor['id']) => profile.vulnerabilityFactors.some((f) => f.id === id);
  const comp = (key: string) => components.find((c) => c.key === key)?.personalRaw ?? 0;

  // Heat-driven
  if (profile.sensitivityToHeat === 'high' && comp('thermal') >= 30) {
    recs.push({
      id: 'heat-sensitivity',
      source: 'High heat sensitivity',
      title: 'Plan around the heat of the day',
      description: `With feels-like at ${metrics.temperature.feelsLike}°C, schedule outdoor time for early morning or evening and use shade during midday hours.`,
      priority: 'high',
    });
  }
  if (has('heat_intolerance') || has('cardiovascular')) {
    recs.push({
      id: 'heat-vuln',
      source: 'Declared heat-related vulnerability',
      title: 'Keep cool and hydrated on hot days',
      description: 'On warm days, favor cool indoor breaks, light clothing and regular water intake during outdoor time.',
      priority: comp('thermal') >= 50 ? 'high' : 'medium',
    });
  }

  // Air-quality-driven
  if (profile.sensitivityToAirPollution === 'high' && comp('air') >= 30) {
    recs.push({
      id: 'air-sensitivity',
      source: 'High air pollution sensitivity',
      title: 'Limit exposure during pollution peaks',
      description: `Current US AQI is ${metrics.airQuality.aqi}. Consider shortening outdoor exertion when AQI is elevated and checking trends before longer outings.`,
      priority: 'high',
    });
  }
  if (has('respiratory')) {
    recs.push({
      id: 'air-vuln',
      source: 'Declared breathing sensitivity',
      title: 'Reduce strenuous outdoor effort in poor air',
      description: 'When AQI is high, choose indoor alternatives for intense activity and keep any personal relief items accessible as you normally would.',
      priority: comp('air') >= 50 ? 'high' : 'medium',
    });
  }

  // UV-driven
  if (profile.outdoorActivityLevel === 'high' || has('outdoor_worker')) {
    recs.push({
      id: 'uv-outdoor',
      source: 'High outdoor exposure',
      title: 'Sun protection during outdoor hours',
      description: `UV index is ${metrics.uv.index}. Use shade, protective clothing and sunscreen during extended daytime outdoor activity.`,
      priority: comp('uv') >= 50 ? 'high' : 'medium',
    });
  }

  // Age-driven
  if (profile.ageGroup === 'senior' && comp('thermal') >= 30) {
    recs.push({
      id: 'age-senior',
      source: 'Age group 65+',
      title: 'Take it easy during heat peaks',
      description: 'Schedule errands and walks outside the hottest hours and keep living spaces comfortably cool.',
      priority: 'medium',
    });
  }
  if (profile.ageGroup === 'child') {
    recs.push({
      id: 'age-child',
      source: 'Age group: child',
      title: 'Supervise outdoor play windows',
      description: 'For children, favor morning or late-afternoon outdoor play and regular water breaks on warm or hazy days.',
      priority: 'medium',
    });
  }

  // General posture rec when nothing specific triggers
  if (recs.length === 0) {
    recs.push({
      id: 'general',
      source: 'General guidance',
      title: score >= 60 ? 'Take standard precautions today' : 'Conditions look manageable today',
      description:
        score >= 60
          ? 'Follow the general precaution tips shown for the top contributing factors and stay aware of changing conditions.'
          : 'Your profile and current conditions combine to a manageable index. Normal daily activity is a reasonable choice.',
      priority: 'low',
    });
  }

  return recs.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/* Back-compat: map legacy preset personas to profile presets         */
/* ------------------------------------------------------------------ */

/** Profile preset corresponding to a legacy PersonaProfile id. */
export const profileFromPersona = (persona: PersonaProfile | undefined): UserProfile | null => {
  if (!persona) return null;
  switch (persona.id) {
    case 'child':
      return {
        ageGroup: 'child',
        outdoorActivityLevel: 'moderate',
        sensitivityToHeat: 'medium',
        sensitivityToAirPollution: 'high',
        vulnerabilityFactors: [],
      };
    case 'elderly':
      return {
        ageGroup: 'senior',
        outdoorActivityLevel: 'low',
        sensitivityToHeat: 'high',
        sensitivityToAirPollution: 'medium',
        vulnerabilityFactors: [{ id: 'cardiovascular' }],
      };
    case 'asthma':
      return {
        ageGroup: 'adult',
        outdoorActivityLevel: 'moderate',
        sensitivityToHeat: 'medium',
        sensitivityToAirPollution: 'high',
        vulnerabilityFactors: [{ id: 'respiratory' }],
      };
    case 'worker':
      return {
        ageGroup: 'adult',
        outdoorActivityLevel: 'high',
        sensitivityToHeat: 'high',
        sensitivityToAirPollution: 'medium',
        vulnerabilityFactors: [{ id: 'outdoor_worker' }],
      };
    case 'athlete':
      return {
        ageGroup: 'adult',
        outdoorActivityLevel: 'high',
        sensitivityToHeat: 'medium',
        sensitivityToAirPollution: 'medium',
        vulnerabilityFactors: [],
      };
    case 'general':
    default:
      return {
        ageGroup: 'adult',
        outdoorActivityLevel: 'moderate',
        sensitivityToHeat: 'medium',
        sensitivityToAirPollution: 'medium',
        vulnerabilityFactors: [],
      };
  }
};

/** Human-readable label for a UserProfile (used in UI chips). */
export const describeProfile = (profile: UserProfile): string => {
  const age: Record<UserProfile['ageGroup'], string> = {
    child: 'Child', teen: 'Teen', adult: 'Adult', senior: 'Senior',
  };
  const act: Record<OutdoorActivityLevel, string> = {
    low: 'Low activity', moderate: 'Moderate activity', high: 'Active outdoor',
  };
  const sens = (s: SensitivityLevel) => (s === 'low' ? 'Low' : s === 'medium' ? 'Medium' : 'High');
  const extras = profile.vulnerabilityFactors.length
    ? ` +${profile.vulnerabilityFactors.length} factor${profile.vulnerabilityFactors.length > 1 ? 's' : ''}`
    : '';
  return `${age[profile.ageGroup]} · ${act[profile.outdoorActivityLevel]} · Heat ${sens(profile.sensitivityToHeat)} · Air ${sens(profile.sensitivityToAirPollution)}${extras}`;
};
