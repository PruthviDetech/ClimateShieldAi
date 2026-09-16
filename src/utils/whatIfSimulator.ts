import {
  EnvironmentalMetrics,
  RiskDriver,
  RiskLevel,
  UserProfile,
} from '../types/climate';
import { calculateClimateShieldRisk, CSRIResult, CSRI_COMPONENTS } from './riskCalculator';
import { calculatePersonalRisk } from './personalProfile';
import { deriveRiskDrivers } from './climateDerivation';

/**
 * ============================================================
 *  WHAT-IF CLIMATE SIMULATOR (Step 9) — experimental scenario tool
 * ============================================================
 *
 * Lets the user ask: "How would the risk change if these
 * conditions occurred?" Sliders adjust temperature, PM2.5,
 * humidity, UV, wind and precipitation on a TEMPORARY COPY of
 * the selected location's live data. Real/live data is never
 * modified. The personalized risk engine (Steps 5–6) recomputes
 * instantly on every change.
 *
 * NOT a prediction and NOT a medical assessment.
 */

export interface WhatIfOverrides {
  /** Air-temperature offset in °C (-10 … +15). */
  tempDelta: number;
  /** Absolute PM2.5 in µg/m³ (0 … 350). */
  pm25: number | null; // null = use live value
  /** Absolute relative humidity % (0 … 100). */
  humidity: number | null;
  /** Absolute UV index (0 … 13). */
  uvIndex: number | null;
  /** Absolute wind speed in km/h (0 … 80). */
  windKmh: number | null;
  /** Precipitation probability % (0 … 100). */
  rainProbability: number | null;
}

export type ScenarioId = 'reset' | 'heatwave' | 'pm25-double' | 'high-uv' | 'high-humidity' | 'extreme';

export interface ScenarioPreset {
  id: ScenarioId;
  label: string;
  description: string;
  overrides: Partial<Omit<WhatIfOverrides, 'pm25'>>;
  /** Optional relative PM2.5 scaling (e.g. 2 = double the live value). */
  pm25Multiplier?: number;
}

/** Useful ready-made scenarios (requirement #6). */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'reset',
    label: 'Live Conditions',
    description: 'Clear all adjustments and return to the current live snapshot.',
    overrides: {},
  },
  {
    id: 'heatwave',
    label: '+5°C Temperature',
    description: 'Everything else stays as it is now.',
    overrides: { tempDelta: 5 },
  },
  {
    id: 'pm25-double',
    label: '2× PM2.5',
    description: 'Doubles the current live PM2.5 concentration.',
    overrides: {},
    pm25Multiplier: 2,
  },
  {
    id: 'high-uv',
    label: 'High UV',
    description: 'UV index set to 9 (very high) with current conditions otherwise.',
    overrides: { uvIndex: 9 },
  },
  {
    id: 'high-humidity',
    label: 'High Humidity',
    description: 'Relative humidity set to 90% — heat stress climbs as cooling efficiency drops.',
    overrides: { humidity: 90 },
  },
  {
    id: 'extreme',
    label: 'Combined Extreme',
    description: '+5°C, 90% humidity, UV 9, low wind (4 km/h) and doubled PM2.5 together.',
    overrides: { tempDelta: 5, humidity: 90, uvIndex: 9, windKmh: 4 },
    pm25Multiplier: 2,
  },
];

export interface WhatIfResult {
  before: {
    score: number;
    level: RiskLevel;
    topFactors: RiskDriver[];
  };
  after: {
    score: number;
    level: RiskLevel;
    topFactors: RiskDriver[];
  };
  /** after.score - before.score (negative = risk would fall). */
  delta: number;
  /** Verbal direction: RISE / FALL / NO CHANGE. */
  direction: 'RISE' | 'FALL' | 'NO_CHANGE';
  /** One-sentence plain-English summary of the scenario. */
  summary: string;
  /** Per-component before/after for the breakdown bars. */
  components: Array<{
    key: string;
    label: string;
    before: number;
    after: number;
    weight: number;
  }>;
}

/** Internal: derive a coherent EnvironmentalMetrics copy with overrides applied. */
const applyOverrides = (
  metrics: EnvironmentalMetrics,
  o: WhatIfOverrides,
  pm25Multiplier: number,
): EnvironmentalMetrics => {
  const temp = metrics.temperature.current + o.tempDelta;
  const humidity = o.humidity ?? metrics.humidity.percentage;
  const uv = o.uvIndex ?? metrics.uv.index;
  const wind = o.windKmh ?? metrics.wind.speedKmh;
  const pm25 = o.pm25 ?? metrics.airQuality.pm25 * pm25Multiplier;

  // Stull wet-bulb approximation (same formula family as deriveMetrics).
  const wetBulb =
    temp * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
    Math.atan(temp + humidity) -
    Math.atan(humidity - 1.676331) +
    0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) -
    4.686035;

  // Preserve the live API feels-like offset (wind chill, real heat index, etc.)
  // and only adjust it for overrides the user actually applied. With zero
  // overrides the simulated metrics are identical to live (delta exactly 0).
  const liveTempOffset = metrics.temperature.feelsLike - metrics.temperature.current;
  const humidityBonus = (h: number) => (h > 70 ? 2 : h > 55 ? 1 : 0);
  const uvBonus = (u: number) => (u >= 8 ? 1 : 0);
  const humidityDelta = o.humidity !== null ? humidityBonus(humidity) - humidityBonus(metrics.humidity.percentage) : 0;
  const uvDelta = o.uvIndex !== null ? uvBonus(uv) - uvBonus(metrics.uv.index) : 0;
  const feelsLike = temp + liveTempOffset + humidityDelta + uvDelta;

  const round1 = (v: number) => Math.round(v * 10) / 10;
  const aqiBp: Array<[number, number, number, number]> = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ];
  const aqiFromPm25 = (p: number): number => {
    for (const [cL, cH, aL, aH] of aqiBp) {
      if (p <= cH) return Math.round(((aH - aL) / (cH - cL)) * (Math.max(cL, p) - cL) + aL);
    }
    return 500;
  };
  const aqi = aqiFromPm25(pm25);

  const uvCategory = (i: number) =>
    i < 3 ? 'Low' : i < 6 ? 'Moderate' : i < 8 ? 'High' : i < 11 ? 'Very High' : 'Extreme';
  const wbCategory = (t: number) =>
    t < 25 ? 'Normal' : t < 28 ? 'Caution' : t < 30 ? 'Extreme Caution' : t < 32 ? 'Danger' : 'Extreme Danger';
  const comfort = (h: number) =>
    h < 30 ? 'Dry' : h <= 60 ? 'Comfortable' : h <= 80 ? 'Humid' : 'Oppressive';
  const disp = (k: number) => (k < 10 ? 'Poor' : k < 18 ? 'Moderate' : 'Good');

  return {
    ...metrics, // untouched fields (pressure, wildfire, flood, etc.) ride along
    temperature: {
      ...metrics.temperature,
      current: round1(temp),
      feelsLike: round1(feelsLike),
      dewPoint: round1(temp - (100 - humidity) / 5),
    },
    humidity: {
      percentage: Math.round(humidity),
      dewPoint: round1(temp - (100 - humidity) / 5),
      comfortLevel: comfort(humidity),
    },
    uv: {
      ...metrics.uv,
      index: round1(uv),
      category: uvCategory(uv),
      safeExposureMinutes: uv <= 0 ? 120 : uv < 3 ? 90 : uv < 6 ? 60 : uv < 8 ? 30 : uv < 11 ? 15 : 10,
    },
    airQuality: {
      ...metrics.airQuality,
      aqi,
      category: aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Unhealthy for Sensitive' : aqi <= 200 ? 'Unhealthy' : aqi <= 300 ? 'Very Unhealthy' : 'Hazardous',
      pm25: round1(pm25),
    },
    wind: {
      ...metrics.wind,
      speedKmh: round1(wind),
      dispersionCapacity: disp(wind),
    },
    rain: {
      ...metrics.rain,
      probability: o.rainProbability ?? metrics.rain.probability,
    },
    wetBulb: {
      tempC: round1(wetBulb),
      category: wbCategory(wetBulb),
    },
  };
};

/**
 * Run the simulation. Works purely on copies — the live metrics object
 * and everything behind it are never mutated (requirement #8).
 */
export const runWhatIf = (
  liveMetrics: EnvironmentalMetrics,
  overrides: WhatIfOverrides,
  profile: UserProfile,
  pm25Multiplier: number = 1,
): WhatIfResult => {
  // BEFORE: personalized index on the untouched live data.
  const beforePersonal = calculatePersonalRisk(liveMetrics, profile);
  const beforeDrivers = deriveRiskDrivers(liveMetrics, beforePersonal);

  // AFTER: same engine on the hypothetical copy.
  const simulatedMetrics = applyOverrides(liveMetrics, overrides, pm25Multiplier);
  const afterPersonal = calculatePersonalRisk(simulatedMetrics, profile);
  const afterDrivers = deriveRiskDrivers(simulatedMetrics, afterPersonal);

  const delta = afterPersonal.score - beforePersonal.score;
  const direction = delta > 0 ? 'RISE' : delta < 0 ? 'FALL' : 'NO_CHANGE';

  const beforeTop = beforeDrivers[0]?.factor ?? '—';
  const afterTop = afterDrivers[0]?.factor ?? '—';
  const topChanged = beforeTop !== afterTop;
  const summary =
    direction === 'NO_CHANGE'
      ? `Under this scenario the personal index would stay at ${beforePersonal.score}/100.`
      : `Under this scenario the personal index would ${direction === 'RISE' ? 'rise' : 'fall'} from ${beforePersonal.score} to ${afterPersonal.score} (${delta > 0 ? '+' : ''}${delta} points), with ${afterTop.toLowerCase()} becoming the main contributing factor.` +
        (topChanged ? ` The dominant factor changes from ${beforeTop.toLowerCase()}.` : '');

  const components = CSRI_COMPONENTS.map((def) => {
    const beforeComp = beforePersonal.components.find((c) => c.key === def.key);
    const afterComp = afterPersonal.components.find((c) => c.key === def.key);
    return {
      key: def.key,
      label: def.label,
      before: beforeComp?.score ?? 0,
      after: afterComp?.score ?? 0,
      weight: def.weight,
    };
  });

  return {
    before: { score: beforePersonal.score, level: beforePersonal.level, topFactors: beforeDrivers.slice(0, 3) },
    after: { score: afterPersonal.score, level: afterPersonal.level, topFactors: afterDrivers.slice(0, 3), },
    delta,
    direction,
    summary,
    components,
  };
};

/* ------------------------------------------------------------------ */
/* Active-simulation registry (Step 10): lets the AI assistant read    */
/* the user's currently running What-If scenario without prop drilling */
/* or context coupling. Holds only the label + result — never mutates  */
/* live data.                                                          */
/* ------------------------------------------------------------------ */

export interface ActiveSimulation {
  scenarioLabel: string;
  overridesSummary: string[];
  result: WhatIfResult;
}

let activeSimulation: ActiveSimulation | null = null;

export const setActiveSimulation = (sim: ActiveSimulation | null): void => {
  activeSimulation = sim;
};

export const getActiveSimulation = (): ActiveSimulation | null => activeSimulation;

/** Human-readable list of the active adjustments (for the UI chips). */
export const describeOverrides = (o: WhatIfOverrides, pm25Multiplier: number): string[] => {
  const parts: string[] = [];
  if (o.tempDelta !== 0) parts.push(`${o.tempDelta > 0 ? '+' : ''}${o.tempDelta}°C temperature`);
  if (o.pm25 !== null) parts.push(`${o.pm25} µg/m³ PM2.5`);
  else if (pm25Multiplier !== 1) parts.push(`${pm25Multiplier}× PM2.5`);
  if (o.humidity !== null) parts.push(`${o.humidity}% humidity`);
  if (o.uvIndex !== null) parts.push(`UV ${o.uvIndex}`);
  if (o.windKmh !== null) parts.push(`${o.windKmh} km/h wind`);
  if (o.rainProbability !== null) parts.push(`${o.rainProbability}% rain chance`);
  return parts;
};
