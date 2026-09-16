/** ClimateShield Risk Index bands (experimental, non-official classification). */
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

/* ------------------------------------------------------------------ */
/* Personal Risk Profile (Step 6)                                     */
/* ------------------------------------------------------------------ */

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';

export type OutdoorActivityLevel = 'low' | 'moderate' | 'high';

export type SensitivityLevel = 'low' | 'medium' | 'high';

/** Optional self-reported vulnerability factors. Non-diagnostic — user-declared only. */
export interface VulnerabilityFactor {
  id: 'respiratory' | 'cardiovascular' | 'heat_intolerance' | 'outdoor_worker' | 'pregnancy';
  /** Optional free-text note, never rendered as a diagnosis. */
  note?: string;
}

/**
 * User's personal risk profile. Combined with LIVE environmental data to
 * personalize the experimental ClimateShield Risk Index.
 * Non-medical: factors are user-selected context, not clinical inputs.
 */
export interface UserProfile {
  ageGroup: AgeGroup;
  outdoorActivityLevel: OutdoorActivityLevel;
  sensitivityToHeat: SensitivityLevel;
  sensitivityToAirPollution: SensitivityLevel;
  vulnerabilityFactors: VulnerabilityFactor[];
}

export interface ClimateLocation {
  id: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  elevationMeters: number;
  population: string;
  riskScore: number;
  riskLevel: RiskLevel;
  primaryHazard: string;
}

// A place selected through search or device geolocation. Environmental telemetry is
// intentionally not included until it is fetched from a dedicated data source.
export interface SelectedLocation {
  id: string;
  city: string;
  state?: string;
  country: string;
  lat: number;
  lng: number;
  source: 'search' | 'device';
}

export interface EnvironmentalMetrics {
  temperature: {
    current: number;
    feelsLike: number;
    min: number;
    max: number;
    dewPoint: number;
    unit: 'C' | 'F';
  };
  airQuality: {
    aqi: number;
    category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    so2: number;
    co: number;
  };
  humidity: {
    percentage: number;
    dewPoint: number;
    comfortLevel: 'Dry' | 'Comfortable' | 'Humid' | 'Oppressive';
  };
  uv: {
    index: number;
    maxToday: number;
    safeExposureMinutes: number;
    category: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
    peakTime: string;
  };
  wind: {
    speedKmh: number;
    gustKmh: number;
    direction: string;
    degrees: number;
    dispersionCapacity: 'Poor' | 'Moderate' | 'Good';
  };
  rain: {
    probability: number;
    volumeMm: number;
    forecast: string;
  };
  pressure: {
    hPa: number;
    trend: 'Rising' | 'Stable' | 'Falling';
  };
  wetBulb: {
    tempC: number;
    category: 'Normal' | 'Caution' | 'Extreme Caution' | 'Danger' | 'Extreme Danger';
  };
  wildfireThreat: {
    index: number;
    smokeDensity: 'Low' | 'Moderate' | 'High';
  };
  floodThreat: {
    index: number;
    drainageStress: 'Low' | 'Moderate' | 'High';
  };
}

export interface RiskDriver {
  factor: string;
  contributionPercent: number;
  currentValue: string;
  safeThreshold: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  impactDescription: string;
}

export interface HealthImpactProfile {
  heatStress: {
    score: number;
    status: string;
    wbgt: number;
    exhaustionThresholdHours: number;
    symptoms: string[];
  };
  respiratoryStress: {
    score: number;
    status: string;
    pm25AlveolarInfiltration: number; // percentage
    lungInflammationRisk: string;
    symptoms: string[];
  };
  uvExposure: {
    score: number;
    status: string;
    burnTimeMinutes: number;
    erythemaDose: string;
  };
  dehydrationRisk: {
    score: number;
    status: string;
    recommendedWaterLiters: number;
    electrolyteNeed: 'Low' | 'Moderate' | 'Urgent';
  };
  outdoorActivityRisk: {
    score: number;
    status: string;
    safeWindow: string;
    avoidWindow: string;
    intensityRecommendation: string;
  };
}

export interface PersonaProfile {
  id: 'general' | 'elderly' | 'child' | 'asthma' | 'worker' | 'athlete';
  name: string;
  label: string;
  ageGroup: string;
  vulnerabilityFactor: number;
  keySensitivities: string[];
  customAdvice: string[];
  recommendedMaxExposureMins: number;
}

export interface HourlyForecast {
  time: string;
  hour: number;
  temp: number;
  feelsLike: number;
  aqi: number;
  pm25: number;
  riskScore: number;
  riskLevel: RiskLevel;
  humidity: number;
  uv: number;
  rainProb: number;
  condition: string;
  icon: string;
  /** Major contributing factor label for this hour (personalized). */
  topFactor?: string;
  /** Stable CSRI component key of the top factor: air | thermal | uv | wind | rain. */
  topFactorKey?: string;
}

export interface DailyForecast {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  aqi: number;
  riskScore: number;
  riskLevel: RiskLevel;
  condition: string;
  rainProb: number;
  uvMax: number;
  summary: string;
}

export interface ClimateScenario {
  id: 'baseline' | 'rcp45' | 'rcp85';
  name: string;
  warmingDelta: string;
  targetYear: string;
  projectedRiskScore: number;
  extremeHeatDays: number;
  heavyRainEvents: number;
  smogDaysDelta: number;
  description: string;
  impacts: string[];
}

export interface ActiveAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
  hazardType: 'AIR_QUALITY' | 'EXTREME_HEAT' | 'UV_RADIATION' | 'FLASH_FLOOD' | 'WILDFIRE_SMOKE';
  title: string;
  message: string;
  issuedAt: string;
  expiresAt: string;
  affectedAreas: string[];
  source: string;
  actionRequired: string;
}

/**
 * Step 8 — Early Warning System.
 * A forecast-derived, experimental environmental warning for an upcoming
 * period within the next 24 hours. NOT an official medical or government
 * warning; generated from live Open-Meteo data and the CSRI engine.
 */
export type EarlyWarningKind =
  | 'RISK_INDEX'
  | 'HEAT'
  | 'AIR_QUALITY'
  | 'UV'
  | 'COMPOUND';

export type EarlyWarningLevel = 'WATCH' | 'WARNING' | 'CRITICAL';

export interface EarlyWarning {
  id: string;
  kind: EarlyWarningKind;
  /** WATCH = approaching threshold, WARNING = exceeded, CRITICAL = well beyond. */
  level: EarlyWarningLevel;
  /** Human-readable window, e.g. "13:00 – 15:00" (location-local time). */
  windowLabel: string;
  /** First hour of the window in HH:00 local time. */
  startHour: string;
  /** Main cause, e.g. "High temperature & UV". */
  cause: string;
  /** Peak risk score within the window (0–100). */
  riskScore: number;
  riskLevel: RiskLevel;
  /** Short plain-English explanation derived from live forecast values. */
  explanation: string;
  /** Recommended general safety action (non-medical). */
  action: string;
  /** Live values at the window's worst hour, for transparency. */
  peakValues: {
    temp: number;
    feelsLike: number;
    pm25: number;
    aqi: number;
    uv: number;
  };
  /** True when this is the highest-risk upcoming period across all warnings. */
  isPeakPeriod: boolean;
  /** Compound warnings list the contributing kinds. */
  contributingKinds?: EarlyWarningKind[];
}

export interface DataSourceMeta {
  id: string;
  name: string;
  organization: string;
  type: 'Satellite' | 'Ground Sensor Grid' | 'Atmospheric Reanalysis' | 'Numerical Model';
  parameters: string[];
  updateInterval: string;
  latencyMs: number;
  status: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
  accuracyConfidence: number;
  coverage: string;
  description: string;
  apiEndpointDoc: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  riskBadge?: {
    score: number;
    level: RiskLevel;
  };
  recommendations?: string[];
  citations?: string[];
  quickActions?: { label: string; action: string }[];
}
