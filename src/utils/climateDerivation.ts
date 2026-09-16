import {
  ActiveAlert,
  ClimateScenario,
  DailyForecast,
  EnvironmentalMetrics,
  HealthImpactProfile,
  HourlyForecast,
  RiskDriver,
  RiskLevel,
  SelectedLocation,
  UserProfile,
} from '../types/climate';
import { LocationDataset } from '../data/mockLocations';
import { calculateClimateShieldRisk, CSRIResult, CSRI_COMPONENTS, CSRIComponentResult } from './riskCalculator';
import { calculatePersonalRisk } from './personalProfile';
import { LiveEnvironmentalData } from '../services/openMeteo';

const round1 = (value: number) => Math.round(value * 10) / 10;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const usAqiFromPm25 = (pm25: number): number => {
  // Simplified US EPA breakpoint mapping for PM2.5 (µg/m³ → AQI)
  const breakpoints: Array<[number, number, number, number]> = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ];
  for (const [cLow, cHigh, aqiLow, aqiHigh] of breakpoints) {
    if (pm25 <= cHigh) {
      const clamped = Math.max(cLow, pm25);
      return Math.round(((aqiHigh - aqiLow) / (cHigh - cLow)) * (clamped - cLow) + aqiLow);
    }
  }
  return 500;
};

const aqiCategory = (aqi: number): EnvironmentalMetrics['airQuality']['category'] => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const humidityComfort = (percentage: number): EnvironmentalMetrics['humidity']['comfortLevel'] => {
  if (percentage < 30) return 'Dry';
  if (percentage <= 60) return 'Comfortable';
  if (percentage <= 80) return 'Humid';
  return 'Oppressive';
};

const uvCategory = (index: number): EnvironmentalMetrics['uv']['category'] => {
  if (index < 3) return 'Low';
  if (index < 6) return 'Moderate';
  if (index < 8) return 'High';
  if (index < 11) return 'Very High';
  return 'Extreme';
};

const wetBulbCategory = (tempC: number): EnvironmentalMetrics['wetBulb']['category'] => {
  if (tempC < 25) return 'Normal';
  if (tempC < 28) return 'Caution';
  if (tempC < 30) return 'Extreme Caution';
  if (tempC < 32) return 'Danger';
  return 'Extreme Danger';
};

const dispersion = (windKmh: number): EnvironmentalMetrics['wind']['dispersionCapacity'] => {
  if (windKmh < 10) return 'Poor';
  if (windKmh < 18) return 'Moderate';
  return 'Good';
};

const uvSafeExposureMinutes = (uv: number): number => {
  if (uv <= 0) return 120;
  if (uv < 3) return 90;
  if (uv < 6) return 45;
  if (uv < 8) return 30;
  if (uv < 11) return 18;
  return 10;
};

/** Approximate wet-bulb temperature (Stull 2011). */
const estimateWetBulb = (tempC: number, humidity: number): number => {
  const rh = clamp(humidity, 0, 100);
  return round1(
    tempC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
      Math.atan(tempC / rh) -
      Math.atan(rh - 1.676331) +
      0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
      4.686035,
  );
};

const windDirectionLabel = (deg: number): string => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
};

/** Derive the full EnvironmentalMetrics object from the live snapshot. */
export const deriveMetrics = (snapshot: LiveEnvironmentalData): EnvironmentalMetrics => {
  const aqi = usAqiFromPm25(snapshot.pm25 ?? 0);
  const uv = snapshot.uvIndex ?? 0;
  const wbgt = estimateWetBulb(snapshot.temperature, snapshot.humidity);
  const wildfireIndex = clamp(Math.round((snapshot.dust ?? 0) * 6 + Math.max(0, 30 - snapshot.windSpeed) * 1.2));
  const rainProbability = snapshot.hourly.length
    ? Math.round(Math.max(...snapshot.hourly.slice(0, 12).map((h) => h.precipitationProbability)))
    : 0;

  return {
    temperature: {
      current: round1(snapshot.temperature),
      feelsLike: round1(snapshot.feelsLike),
      min: snapshot.daily.length ? round1(Math.min(...snapshot.daily.map((d) => d.tempMin))) : round1(snapshot.temperature),
      max: snapshot.daily.length ? round1(Math.max(...snapshot.daily.map((d) => d.tempMax))) : round1(snapshot.temperature),
      dewPoint: round1(snapshot.temperature - (100 - snapshot.humidity) / 5),
      unit: 'C',
    },
    airQuality: {
      aqi,
      category: aqiCategory(aqi),
      pm25: round1(snapshot.pm25 ?? 0),
      pm10: round1(snapshot.pm10 ?? 0),
      no2: round1(snapshot.nitrogenDioxide ?? 0),
      o3: round1(snapshot.ozone ?? 0),
      so2: round1(snapshot.sulphurDioxide ?? 0),
      co: round1(snapshot.carbonMonoxide ?? 0),
    },
    humidity: {
      percentage: Math.round(snapshot.humidity),
      dewPoint: round1(snapshot.temperature - (100 - snapshot.humidity) / 5),
      comfortLevel: humidityComfort(snapshot.humidity),
    },
    uv: {
      index: round1(uv),
      maxToday: snapshot.daily.length && snapshot.daily[0].uvIndexMax !== null ? round1(snapshot.daily[0].uvIndexMax!) : round1(uv),
      safeExposureMinutes: uvSafeExposureMinutes(uv),
      category: uvCategory(uv),
      peakTime: '12:00 - 15:00',
    },
    wind: {
      speedKmh: round1(snapshot.windSpeed),
      gustKmh: round1(snapshot.windSpeed * 1.5),
      direction: snapshot.windDirection !== null ? windDirectionLabel(snapshot.windDirection) : '—',
      degrees: snapshot.windDirection ?? 0,
      dispersionCapacity: dispersion(snapshot.windSpeed),
    },
    rain: {
      probability: rainProbability,
      volumeMm: round1(snapshot.precipitation),
      forecast: snapshot.weatherCondition,
    },
    pressure: {
      hPa: snapshot.surfacePressure !== null ? Math.round(snapshot.surfacePressure) : 1013,
      trend: 'Stable',
    },
    wetBulb: {
      tempC: wbgt,
      category: wetBulbCategory(wbgt),
    },
    wildfireThreat: {
      index: wildfireIndex,
      smokeDensity: wildfireIndex > 50 ? 'High' : wildfireIndex > 25 ? 'Moderate' : 'Low',
    },
    floodThreat: {
      index: clamp(Math.round(snapshot.precipitation * 10 + rainProbability * 0.6)),
      drainageStress: snapshot.precipitation > 5 ? 'High' : snapshot.precipitation > 1.5 ? 'Moderate' : 'Low',
    },
  };
};

/**
 * Derive the UI risk drivers directly from the transparent CSRI components,
 * so the displayed contribution percentages exactly match the index math.
 */
export const deriveRiskDrivers = (metrics: EnvironmentalMetrics, riskResult: CSRIResult): RiskDriver[] => {
  const currentValueFor = (key: string): string => {
    switch (key) {
      case 'air':
        return `${metrics.airQuality.pm25} µg/m³ (AQI ${metrics.airQuality.aqi})`;
      case 'thermal':
        return `${metrics.temperature.feelsLike}°C Feels Like (WBGT ${metrics.wetBulb.tempC}°C)`;
      case 'uv':
        return `${metrics.uv.index} UV Index (${metrics.uv.category})`;
      case 'wind':
        return `${metrics.wind.speedKmh} km/h (${metrics.wind.dispersionCapacity} Dispersion)`;
      case 'rain':
        return `${metrics.rain.probability}% probability (${metrics.rain.volumeMm} mm)`;
      default:
        return 'Live measurement';
    }
  };

  const safeThresholdFor = (key: string): string => {
    switch (key) {
      case 'air':
        return '< 15.0 µg/m³ PM2.5 (WHO 2021 guideline)';
      case 'thermal':
        return '< 30.0°C heat index / WBGT < 25°C';
      case 'uv':
        return 'UV index < 5 (moderate threshold)';
      case 'wind':
        return '> 18 km/h for active dispersion';
      case 'rain':
        return '< 50% probability and < 10 mm/24h';
      default:
        return '—';
    }
  };

  const impactFor = (key: string): string => {
    switch (key) {
      case 'air':
        return 'Fine particles penetrate deep into the lower airways; inflammation risk rises sharply above WHO guideline levels.';
      case 'thermal':
        return 'Combined heat and humidity reduce evaporative cooling efficiency and elevate core temperature strain.';
      case 'uv':
        return 'Solar radiation reaches erythema thresholds quickly at this index; unshaded exposure burns skin faster.';
      case 'wind':
        return 'Low airflow traps pollutants near the surface and prevents natural dispersion of urban emissions.';
      case 'rain':
        return 'Intense rainfall drives flash waterlogging; prolonged dry spells elevate dust and allergen loads.';
      default:
        return 'Environmental stressor contributing to the composite index.';
    }
  };

  return riskResult.components.map((component) => ({
    factor: component.label,
    contributionPercent: component.contributionPercent,
    currentValue: currentValueFor(component.key),
    safeThreshold: safeThresholdFor(component.key),
    severity: (component.score >= 75 ? 'critical' : component.score >= 50 ? 'high' : component.score >= 30 ? 'moderate' : 'low') as RiskDriver['severity'],
    impactDescription: impactFor(component.key),
  }));
};

/** Derive the 5 health impact vectors from live metrics. */
export const deriveHealthImpact = (metrics: EnvironmentalMetrics): HealthImpactProfile => {
  const wbgt = metrics.wetBulb.tempC;
  const heatScore = clamp(Math.round((wbgt / 33) * 100));
  const respiratoryScore = clamp(Math.round((metrics.airQuality.pm25 / 150) * 100));
  const uvScore = clamp(Math.round((metrics.uv.index / 12) * 100));
  const dehydrationScore = clamp(Math.round(heatScore * 0.7 + Math.max(0, metrics.temperature.current - 20) * 2));
  const outdoorScore = clamp(Math.round(Math.max(heatScore, respiratoryScore, uvScore) * 0.9));

  const heatStatus =
    wbgt >= 32 ? 'Extreme Danger of Heat Stroke' :
    wbgt >= 30 ? 'Danger of Heat Exhaustion' :
    wbgt >= 28 ? 'High Metabolic Strain' :
    wbgt >= 25 ? 'Caution — Reduce Exertion' : 'Optimal Thermal Comfort';

  const respStatus =
    metrics.airQuality.aqi > 300 ? 'Hazardous Toxic Air Load' :
    metrics.airQuality.aqi > 200 ? 'Very Unhealthy Air — Critical' :
    metrics.airQuality.aqi > 150 ? 'Unhealthy — Bronchial Irritation Likely' :
    metrics.airQuality.aqi > 100 ? 'Sensitive Groups At Risk' : 'Good Respiratory Comfort';

  const uvStatus =
    metrics.uv.index >= 11 ? 'Extreme Solar Radiation' :
    metrics.uv.index >= 8 ? 'Very High Phototoxic Window' :
    metrics.uv.index >= 6 ? 'High UV Exposure' :
    metrics.uv.index >= 3 ? 'Moderate UV Exposure' : 'Low UV Exposure';

  const electrolyteNeed: HealthImpactProfile['dehydrationRisk']['electrolyteNeed'] =
    dehydrationScore >= 80 ? 'Urgent' : dehydrationScore >= 50 ? 'Moderate' : 'Low';

  return {
    heatStress: {
      score: heatScore,
      status: heatStatus,
      wbgt,
      exhaustionThresholdHours: Math.max(0.5, round1((36 - wbgt) / 4)),
      symptoms: wbgt >= 28
        ? ['Elevated core temp', 'Profuse sweating', 'Fatigue / Dizziness', 'Muscle cramps']
        : ['None expected'],
    },
    respiratoryStress: {
      score: respiratoryScore,
      status: respStatus,
      pm25AlveolarInfiltration: clamp(Math.round(metrics.airQuality.pm25 * 0.66), 0, 100),
      lungInflammationRisk:
        metrics.airQuality.aqi > 200 ? 'Severe for All Demographics' :
        metrics.airQuality.aqi > 100 ? 'High for Asthmatics / Children' : 'Low',
      symptoms: metrics.airQuality.aqi > 100
        ? ['Dry throat tickle', 'Reduced FEV1 airflow', 'Airway tightness', 'Eye irritation']
        : ['None expected'],
    },
    uvExposure: {
      score: uvScore,
      status: uvStatus,
      burnTimeMinutes: metrics.uv.safeExposureMinutes,
      erythemaDose: `${round1(metrics.uv.index * 0.6)} SED / hr`,
    },
    dehydrationRisk: {
      score: dehydrationScore,
      status:
        dehydrationScore >= 80 ? 'Extreme Perspiration Loss' :
        dehydrationScore >= 50 ? 'Accelerated Fluid Depletion' : 'Baseline Hydration Requirement',
      recommendedWaterLiters: round1(2.0 + dehydrationScore / 50),
      electrolyteNeed,
    },
    outdoorActivityRisk: {
      score: outdoorScore,
      status:
        outdoorScore >= 75 ? 'Avoid Strenuous Outdoor Activity' :
        outdoorScore >= 50 ? 'Restrict High-Intensity Cardio' :
        outdoorScore >= 30 ? 'Generally Favorable With Care' : 'Excellent for All Outdoor Sports',
      safeWindow: outdoorScore >= 50 ? '05:30 - 08:00 & after 19:30' : 'All Day',
      avoidWindow: outdoorScore >= 50 ? '11:00 - 16:30' : 'None',
      intensityRecommendation:
        outdoorScore >= 75
          ? 'Stay indoors during peak hours; any outdoor exertion should be shifted to early morning.'
          : outdoorScore >= 50
            ? 'Limit strenuous activity to dawn hours; hydrate aggressively and monitor AQI.'
            : 'Conditions are favorable for outdoor exercise and recreation.',
    },
  };
};

const dayName = (isoDate: string, index: number) => {
  if (index === 0) return 'Today';
  const date = new Date(`${isoDate}T12:00:00`);
  return Number.isNaN(date.getTime()) ? `Day ${index + 1}` : date.toLocaleDateString('en-US', { weekday: 'short' });
};



/**
 * Derive the 24h hourly forecast with per-hour risk scores from live data.
 * When a UserProfile is supplied, each hour is scored with the personalized
 * engine (Step 7), so the forecast curve moves with the user's profile.
 */
export const deriveHourlyForecast = (
  metrics: EnvironmentalMetrics,
  snapshot: LiveEnvironmentalData,
  profile?: UserProfile,
): HourlyForecast[] =>
  snapshot.hourly.map((h) => {
    const pseudoMetrics: EnvironmentalMetrics = {
      ...metrics,
      temperature: { ...metrics.temperature, current: h.temp, feelsLike: h.feelsLike },
      airQuality: { ...metrics.airQuality, aqi: usAqiFromPm25(h.pm25 ?? 0), pm25: round1(h.pm25 ?? 0) },
      uv: { ...metrics.uv, index: round1(h.uvIndex ?? 0), category: uvCategory(h.uvIndex ?? 0) },
      wind: { ...metrics.wind, speedKmh: round1(h.windSpeed), dispersionCapacity: dispersion(h.windSpeed) },
    };
    const calc = profile
      ? calculatePersonalRisk(pseudoMetrics, profile)
      : calculateClimateShieldRisk(pseudoMetrics);
    return {
      time: `${String(h.hour).padStart(2, '0')}:00`,
      hour: h.hour,
      temp: round1(h.temp),
      feelsLike: round1(h.feelsLike),
      aqi: pseudoMetrics.airQuality.aqi,
      pm25: round1(h.pm25 ?? 0),
      riskScore: calc.score,
      riskLevel: calc.level,
      humidity: Math.round(h.humidity),
      uv: round1(h.uvIndex ?? 0),
      rainProb: Math.round(h.precipitationProbability),
      condition: h.weatherCondition,
      icon: 'Sun',
      // Major contributing factor for this hour (personalized when profile given).
      topFactor: calc.components[0]?.label,
      topFactorKey: calc.components[0]?.key,
    };
  });

/**
 * Plain-English peak-risk summary for the upcoming 24h window, e.g.
 * "Highest risk expected around 14 due to high temperature and high UV — index 58/100 (moderate)."
 * Experimental environmental-risk framing only; not a medical prediction.
 */
export const summarizePeakRisk = (hourly: HourlyForecast[]): string => {
  if (hourly.length === 0) return 'Hourly forecast data is unavailable right now.';

  const peak = hourly.reduce((a, b) => (b.riskScore > a.riskScore ? b : a));

  // Compose the reason from the peak hour's own live conditions.
  const reasons: string[] = [];
  if (peak.feelsLike >= 32 || peak.temp >= 32) reasons.push('high temperature');
  if (peak.uv >= 6) reasons.push('high UV');
  if (peak.pm25 > 35 || peak.aqi > 100) reasons.push('elevated air pollution');
  if (reasons.length === 0 && peak.topFactor) reasons.push(peak.topFactor.toLowerCase());
  if (reasons.length === 0) reasons.push('a combination of environmental conditions');

  const hour24 = Number.parseInt(peak.time.slice(0, 2), 10);
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const meridiem = hour24 < 12 ? 'AM' : 'PM';
  const label = `${hour12} ${meridiem}`;
  return `Highest risk expected around ${label} due to ${reasons.slice(0, 2).join(' and ')} — index ${peak.riskScore}/100 (${peak.riskLevel.toLowerCase()}).`;
};

/** Derive the 5-day daily forecast with per-day risk scores from live data. */
export const deriveDailyForecast = (metrics: EnvironmentalMetrics, snapshot: LiveEnvironmentalData): DailyForecast[] =>
  snapshot.daily.map((d, index) => {
    const dayAqi = d.pm25Max !== null ? usAqiFromPm25(d.pm25Max) : metrics.airQuality.aqi;
    const dayPm25 = d.pm25Max ?? metrics.airQuality.pm25;
    const dayUv = d.uvIndexMax ?? metrics.uv.index;
    const pseudoMetrics: EnvironmentalMetrics = {
      ...metrics,
      temperature: { ...metrics.temperature, current: round1(d.tempMax), max: round1(d.tempMax), min: round1(d.tempMin) },
      airQuality: { ...metrics.airQuality, aqi: dayAqi, pm25: round1(dayPm25) },
      uv: { ...metrics.uv, index: round1(dayUv), category: uvCategory(dayUv) },
      wind: { ...metrics.wind, speedKmh: round1(d.windSpeedMax), dispersionCapacity: dispersion(d.windSpeedMax) },
    };
    const calc = calculateClimateShieldRisk(pseudoMetrics);
    return {
      day: dayName(d.date, index),
      date: d.date,
      tempMax: round1(d.tempMax),
      tempMin: round1(d.tempMin),
      aqi: dayAqi,
      riskScore: calc.score,
      riskLevel: calc.level,
      condition: d.weatherCondition,
      rainProb: Math.round(d.precipitationProbabilityMax),
      uvMax: d.uvIndexMax !== null ? round1(d.uvIndexMax) : 0,
      summary: `${d.weatherCondition} with a high of ${round1(d.tempMax)}°C and peak UV of ${round1(dayUv)}.`,
    };
  });

/** Derive live threshold-based alerts for the selected location. */
export const deriveAlerts = (metrics: EnvironmentalMetrics, location: SelectedLocation): ActiveAlert[] => {
  const alerts: ActiveAlert[] = [];
  const now = new Date();
  const expires = new Date(now.getTime() + 12 * 60 * 60 * 1000).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
  const issued = now.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (metrics.airQuality.aqi > 150) {
    alerts.push({
      id: 'live-aq-alert',
      severity: metrics.airQuality.aqi > 250 ? 'CRITICAL' : 'WARNING',
      hazardType: 'AIR_QUALITY',
      title: `Elevated Particulate Pollution Advisory — AQI ${metrics.airQuality.aqi}`,
      message: `PM2.5 is currently ${metrics.airQuality.pm25} µg/m³ (AQI ${metrics.airQuality.aqi}, ${metrics.airQuality.category}). Sensitive groups should limit prolonged outdoor exertion.`,
      issuedAt: `Today at ${issued}`,
      expiresAt: `Today at ${expires}`,
      affectedAreas: [`${location.city} metropolitan area`],
      source: 'Open-Meteo Air Quality API + ClimateShield AI Derivation',
      actionRequired: 'Run HEPA filtration indoors and consider N95 masks during peak traffic hours.',
    });
  }

  if (metrics.wetBulb.tempC >= 28) {
    alerts.push({
      id: 'live-heat-alert',
      severity: metrics.wetBulb.tempC >= 30 ? 'CRITICAL' : 'ADVISORY',
      hazardType: 'EXTREME_HEAT',
      title: `High Wet-Bulb Heat Index Alert — WBGT ${metrics.wetBulb.tempC}°C`,
      message: `Apparent temperature is ${metrics.temperature.feelsLike}°C with ${metrics.humidity.percentage}% humidity, creating elevated metabolic heat storage risk.`,
      issuedAt: `Today at ${issued}`,
      expiresAt: `Today at ${expires}`,
      affectedAreas: [`${location.city} urban core`],
      source: 'Open-Meteo Forecast + Stull Wet-Bulb Model',
      actionRequired: 'Pre-hydrate with electrolytes and avoid intense outdoor activity during peak heat hours.',
    });
  }

  if (metrics.uv.index >= 8) {
    alerts.push({
      id: 'live-uv-alert',
      severity: metrics.uv.index >= 11 ? 'WARNING' : 'ADVISORY',
      hazardType: 'UV_RADIATION',
      title: `High Solar UV Advisory — Index ${metrics.uv.index}`,
      message: `Unshaded skin may burn in approximately ${metrics.uv.safeExposureMinutes} minutes at current UV intensity.`,
      issuedAt: `Today at ${issued}`,
      expiresAt: `Today at ${expires}`,
      affectedAreas: [`${location.city} region`],
      source: 'Open-Meteo UV Index Feed',
      actionRequired: 'Apply SPF 50+ sunscreen, wear UV400 sunglasses and limit direct sun exposure.',
    });
  }

  return alerts;
};

/** Derive actionable recommendations from live conditions. */
export const deriveRecommendations = (metrics: EnvironmentalMetrics): LocationDataset['recommendations'] => {
  const recs: LocationDataset['recommendations'] = [];
  if (metrics.airQuality.aqi > 100) {
    recs.push({
      id: 'rec-air',
      category: 'Protection',
      title: 'Reduce Prolonged Exposure to Polluted Air',
      description: `PM2.5 at ${metrics.airQuality.pm25} µg/m³ causes alveolar irritation. Use an N95 mask outdoors and run HEPA filtration indoors.`,
      icon: 'ShieldAlert',
      timeframe: 'Morning & Evening Commute',
    });
  }
  if (metrics.temperature.feelsLike > 30) {
    recs.push({
      id: 'rec-hydration',
      category: 'Hydration',
      title: 'Stay Hydrated with Electrolytes',
      description: `Feels-like temperature of ${metrics.temperature.feelsLike}°C with ${metrics.humidity.percentage}% humidity accelerates fluid loss. Drink water regularly throughout the day.`,
      icon: 'Droplets',
      timeframe: 'Throughout the day',
    });
  }
  if (metrics.uv.index >= 6) {
    recs.push({
      id: 'rec-uv',
      category: 'Protection',
      title: 'Apply Broad-Spectrum Sunscreen (SPF 50+)',
      description: `UV index of ${metrics.uv.index} causes erythema in under ${metrics.uv.safeExposureMinutes} minutes. Reapply sunscreen every 2 hours outdoors.`,
      icon: 'Sun',
      timeframe: '10:00 AM - 03:30 PM',
    });
  }
  if (metrics.temperature.feelsLike > 32) {
    recs.push({
      id: 'rec-behavior',
      category: 'Behavioral',
      title: 'Avoid Intense Outdoor Activity During Peak Heat',
      description: 'Restrict outdoor running or heavy labor between 11:30 AM and 4:30 PM when heat and UV peak.',
      icon: 'Clock',
      timeframe: '11:30 AM - 04:30 PM',
    });
  }
  if (recs.length === 0) {
    recs.push({
      id: 'rec-ok',
      category: 'Behavioral',
      title: 'Great Conditions for Outdoor Activity',
      description: 'Air quality, temperature and UV are all within comfortable physiological ranges today.',
      icon: 'CheckCircle',
      timeframe: 'All Day',
    });
  }
  return recs;
};

/** Long-range scenarios derived by applying warming deltas to the live baseline. */
export const deriveScenarios = (metrics: EnvironmentalMetrics, baselineScore: number): ClimateScenario[] => {
  const heatDays = Math.round(Math.max(0, metrics.temperature.max - 25) * 6);
  const scenarios: ClimateScenario[] = [
    {
      id: 'baseline',
      name: 'Current Baseline (Live)',
      warmingDelta: '+0.0°C vs Present',
      targetYear: '2026',
      projectedRiskScore: baselineScore,
      extremeHeatDays: heatDays,
      heavyRainEvents: Math.round(metrics.rain.probability / 10),
      smogDaysDelta: 0,
      description: 'Current live conditions for the selected location with seasonal hazard variability.',
      impacts: [
        `Live AQI ${metrics.airQuality.aqi} (${metrics.airQuality.category})`,
        `Peak UV ${metrics.uv.maxToday} with ${metrics.uv.safeExposureMinutes}-min burn window`,
        `${metrics.wind.dispersionCapacity} atmospheric dispersion at ${metrics.wind.speedKmh} km/h`,
      ],
    },
    {
      id: 'rcp45',
      name: 'Moderate Mitigation (RCP 4.5)',
      warmingDelta: '+1.5°C Global Warming',
      targetYear: '2040',
      projectedRiskScore: Math.min(100, Math.round(baselineScore * 1.12)),
      extremeHeatDays: Math.round(heatDays * 1.8),
      heavyRainEvents: Math.round(metrics.rain.probability / 8),
      smogDaysDelta: 18,
      description: 'Intermediate emissions scenario with prolonged heatwaves and intensified downpours for this region.',
      impacts: [
        'Higher wet-bulb exceedance during summer months',
        'Increased respiratory admissions during stagnation spells',
        'Longer high-O3 windows under sustained solar radiation',
      ],
    },
    {
      id: 'rcp85',
      name: 'High Emissions Path (RCP 8.5)',
      warmingDelta: '+3.2°C Global Warming',
      targetYear: '2060',
      projectedRiskScore: Math.min(100, Math.round(baselineScore * 1.28)),
      extremeHeatDays: Math.round(heatDays * 3.2),
      heavyRainEvents: Math.round(metrics.rain.probability / 6),
      smogDaysDelta: 45,
      description: 'Severe unmitigated warming path producing dangerous combined heat-humidity stress windows.',
      impacts: [
        'Outdoor labor becomes hazardous during summer daylight hours',
        'Frequent intense precipitation and urban flooding events',
        'Sustained cooling demand stressing power infrastructure',
      ],
    },
  ];
  return scenarios;
};
