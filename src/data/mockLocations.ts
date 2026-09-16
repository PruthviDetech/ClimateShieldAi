import { ClimateLocation, EnvironmentalMetrics, RiskDriver, HealthImpactProfile, HourlyForecast, DailyForecast, ClimateScenario, ActiveAlert, PersonaProfile } from '../types/climate';

export interface LocationDataset {
  location: ClimateLocation;
  metrics: EnvironmentalMetrics;
  riskDrivers: RiskDriver[];
  healthImpact: HealthImpactProfile;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  scenarios: ClimateScenario[];
  alerts: ActiveAlert[];
  recommendations: {
    id: string;
    category: 'Urgent' | 'Behavioral' | 'Hydration' | 'Protection';
    title: string;
    description: string;
    icon: string;
    timeframe: string;
  }[];
}

export const PRESET_LOCATIONS: Record<string, LocationDataset> = {
  'pune-india': {
    location: {
      id: 'pune-india',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      lat: 18.5204,
      lng: 73.8567,
      elevationMeters: 560,
      population: '7.4 Million',
      riskScore: 72,
      riskLevel: 'HIGH',
      primaryHazard: 'Elevated PM2.5 & Thermal Discomfort',
    },
    metrics: {
      temperature: {
        current: 34.2,
        feelsLike: 38.6,
        min: 22.4,
        max: 36.8,
        dewPoint: 22.1,
        unit: 'C',
      },
      airQuality: {
        aqi: 178,
        category: 'Unhealthy',
        pm25: 98.4,
        pm10: 145.2,
        no2: 44.1,
        o3: 68.2,
        so2: 14.8,
        co: 1.8,
      },
      humidity: {
        percentage: 68,
        dewPoint: 22.1,
        comfortLevel: 'Humid',
      },
      uv: {
        index: 9.2,
        maxToday: 10.4,
        safeExposureMinutes: 18,
        category: 'Very High',
        peakTime: '11:30 - 15:00',
      },
      wind: {
        speedKmh: 14.2,
        gustKmh: 22.5,
        direction: 'WSW',
        degrees: 245,
        dispersionCapacity: 'Poor',
      },
      rain: {
        probability: 15,
        volumeMm: 0.2,
        forecast: 'Scattered clouds, isolated evening convective drizzle',
      },
      pressure: {
        hPa: 1009,
        trend: 'Falling',
      },
      wetBulb: {
        tempC: 28.4,
        category: 'Extreme Caution',
      },
      wildfireThreat: {
        index: 24,
        smokeDensity: 'Low',
      },
      floodThreat: {
        index: 38,
        drainageStress: 'Moderate',
      },
    },
    riskDrivers: [
      {
        factor: 'PM2.5 Micro-Particulate Inhalation',
        contributionPercent: 38,
        currentValue: '98.4 µg/m³',
        safeThreshold: '< 15.0 µg/m³ (WHO)',
        severity: 'critical',
        impactDescription: 'High penetration into lower lung bronchioles causing elevated inflammation.',
      },
      {
        factor: 'Apparent Heat Index & Wet-Bulb Stress',
        contributionPercent: 31,
        currentValue: '38.6°C Feels Like (WBGT 28.4°C)',
        safeThreshold: '< 30.0°C Heat Index',
        severity: 'high',
        impactDescription: 'Impaired metabolic sweat evaporative cooling under high humidity.',
      },
      {
        factor: 'Solar UV Erythema Index',
        contributionPercent: 19,
        currentValue: '9.2 UV Index',
        safeThreshold: '< 5.0 Moderate',
        severity: 'high',
        impactDescription: 'Severe solar radiation burn risk in less than 20 minutes of unshaded exposure.',
      },
      {
        factor: 'Atmospheric Inversion & Stagnant Airflow',
        contributionPercent: 12,
        currentValue: '14.2 km/h Low Dispersion',
        safeThreshold: '> 22 km/h Active Flow',
        severity: 'moderate',
        impactDescription: 'Valley topographic trapping of vehicular emissions in Shivajinagar & Hadapsar.',
      },
    ],
    healthImpact: {
      heatStress: {
        score: 76,
        status: 'High Metabolic Strain',
        wbgt: 28.4,
        exhaustionThresholdHours: 1.5,
        symptoms: ['Elevated core temp', 'Profuse sweating', 'Fatigue / Dizziness', 'Muscle cramps'],
      },
      respiratoryStress: {
        score: 82,
        status: 'Bronchial Irritation Likely',
        pm25AlveolarInfiltration: 64.8,
        lungInflammationRisk: 'High for Asthmatics / Children',
        symptoms: ['Dry throat tickle', 'Reduced FEV1 airflow', 'Airway tightness', 'Eye irritation'],
      },
      uvExposure: {
        score: 79,
        status: 'Severe Phototoxic Window',
        burnTimeMinutes: 18,
        erythemaDose: '5.4 SED / hr',
      },
      dehydrationRisk: {
        score: 74,
        status: 'Accelerated Fluid Depletion',
        recommendedWaterLiters: 3.8,
        electrolyteNeed: 'Moderate',
      },
      outdoorActivityRisk: {
        score: 71,
        status: 'Restrict High-Intensity Cardio',
        safeWindow: '06:00 - 08:30 AM & 19:30 - 22:00',
        avoidWindow: '11:00 AM - 16:30 PM',
        intensityRecommendation: 'Limit strenuous outdoor athletics to early dawn with N95 filtration if AQI > 150.',
      },
    },
    hourlyForecast: [
      { time: '06:00', hour: 6, temp: 23, feelsLike: 24, aqi: 142, pm25: 78, riskScore: 54, riskLevel: 'MODERATE', humidity: 82, uv: 0.4, rainProb: 5, condition: 'Hazy Sun', icon: 'Sunrise' },
      { time: '08:00', hour: 8, temp: 26, feelsLike: 28, aqi: 165, pm25: 89, riskScore: 61, riskLevel: 'HIGH', humidity: 76, uv: 2.8, rainProb: 5, condition: 'Haze', icon: 'Sun' },
      { time: '10:00', hour: 10, temp: 30, feelsLike: 33, aqi: 175, pm25: 95, riskScore: 68, riskLevel: 'HIGH', humidity: 71, uv: 6.5, rainProb: 10, condition: 'Partly Sunny', icon: 'Sun' },
      { time: '12:00', hour: 12, temp: 33, feelsLike: 37, aqi: 184, pm25: 102, riskScore: 76, riskLevel: 'HIGH', humidity: 65, uv: 9.8, rainProb: 15, condition: 'Hot & Hazy', icon: 'Sun' },
      { time: '14:00', hour: 14, temp: 34.5, feelsLike: 39, aqi: 188, pm25: 106, riskScore: 79, riskLevel: 'HIGH', humidity: 62, uv: 9.2, rainProb: 20, condition: 'Peak Heat', icon: 'Sun' },
      { time: '16:00', hour: 16, temp: 33, feelsLike: 36, aqi: 172, pm25: 94, riskScore: 71, riskLevel: 'HIGH', humidity: 67, uv: 4.8, rainProb: 25, condition: 'Scattered Clouds', icon: 'CloudSun' },
      { time: '18:00', hour: 18, temp: 29, feelsLike: 31, aqi: 168, pm25: 91, riskScore: 65, riskLevel: 'HIGH', humidity: 74, uv: 0.8, rainProb: 20, condition: 'Dusk Haze', icon: 'Sunset' },
      { time: '20:00', hour: 20, temp: 27, feelsLike: 29, aqi: 176, pm25: 97, riskScore: 66, riskLevel: 'HIGH', humidity: 79, uv: 0, rainProb: 10, condition: 'Night Haze', icon: 'Moon' },
      { time: '22:00', hour: 22, temp: 25, feelsLike: 27, aqi: 162, pm25: 88, riskScore: 59, riskLevel: 'MODERATE', humidity: 84, uv: 0, rainProb: 5, condition: 'Clear Night', icon: 'Moon' },
    ],
    dailyForecast: [
      { day: 'Today', date: 'Sep 12', tempMax: 34.5, tempMin: 22.4, aqi: 178, riskScore: 72, riskLevel: 'HIGH', condition: 'Hot & Smoggy', rainProb: 15, uvMax: 9.8, summary: 'High particulate accumulation with humid thermal peak' },
      { day: 'Sat', date: 'Sep 13', tempMax: 35.2, tempMin: 23.0, aqi: 186, riskScore: 75, riskLevel: 'HIGH', condition: 'Intense Heat', rainProb: 10, uvMax: 10.2, summary: 'Increasing solar irradiance with midday ozone spikes' },
      { day: 'Sun', date: 'Sep 14', tempMax: 33.8, tempMin: 22.1, aqi: 162, riskScore: 66, riskLevel: 'HIGH', condition: 'Afternoon Shower', rainProb: 45, uvMax: 8.4, summary: 'Partial convective rain cleansing late afternoon air' },
      { day: 'Mon', date: 'Sep 15', tempMax: 31.5, tempMin: 21.8, aqi: 128, riskScore: 54, riskLevel: 'MODERATE', condition: 'Scattered Rain', rainProb: 65, uvMax: 6.9, summary: 'Monsoon revival brings particulate dispersion' },
      { day: 'Tue', date: 'Sep 16', tempMax: 30.2, tempMin: 21.0, aqi: 110, riskScore: 48, riskLevel: 'MODERATE', condition: 'Cloudy & Breezy', rainProb: 50, uvMax: 6.0, summary: 'Improved airflow and lower thermal stress index' },
      { day: 'Wed', date: 'Sep 17', tempMax: 32.0, tempMin: 21.5, aqi: 140, riskScore: 58, riskLevel: 'MODERATE', condition: 'Partly Sunny', rainProb: 25, uvMax: 8.5, summary: 'Gradual warming resumption with moderate smog' },
      { day: 'Thu', date: 'Sep 18', tempMax: 33.4, tempMin: 22.0, aqi: 155, riskScore: 64, riskLevel: 'HIGH', condition: 'Warm & Hazy', rainProb: 15, uvMax: 9.1, summary: 'Surface inversions trapping morning micro-particulates' },
    ],
    scenarios: [
      {
        id: 'baseline',
        name: 'Current Baseline (2026)',
        warmingDelta: '+0.0°C vs Present',
        targetYear: '2026',
        projectedRiskScore: 72,
        extremeHeatDays: 28,
        heavyRainEvents: 6,
        smogDaysDelta: 0,
        description: 'Current climate status with average 28 extreme heat index days/year and moderate monsoon variability.',
        impacts: ['Urban Heat Island effect in core Shivaji Nagar', 'Occasional seasonal flash urban waterlogging', 'Elevated winter and pre-monsoon smog episodes'],
      },
      {
        id: 'rcp45',
        name: 'Moderate Mitigation (RCP 4.5)',
        warmingDelta: '+1.5°C Global Warming',
        targetYear: '2040',
        projectedRiskScore: 81,
        extremeHeatDays: 52,
        heavyRainEvents: 11,
        smogDaysDelta: 18,
        description: 'Intermediate emissions scenario with prolonged summer heatwaves and intensified monsoon downpours.',
        impacts: ['3.2x increase in wet-bulb temperature exceedance (>30°C)', '24% higher respiratory admissions in elderly during dry spells', 'Groundwater recharge volatility'],
      },
      {
        id: 'rcp85',
        name: 'High Emissions Path (RCP 8.5)',
        warmingDelta: '+3.2°C Global Warming',
        targetYear: '2060',
        projectedRiskScore: 93,
        extremeHeatDays: 98,
        heavyRainEvents: 22,
        smogDaysDelta: 45,
        description: 'Severe unmitigated warming path causing lethal combined heat-humidity stress windows in Deccan plateau.',
        impacts: ['Unlivable outdoor labor conditions between April-June', 'Frequent severe urban flooding of Mula-Mutha river basin', 'Cascading power grid stress from continuous cooling demand'],
      },
    ],
    alerts: [
      {
        id: 'alt-01',
        severity: 'WARNING',
        hazardType: 'AIR_QUALITY',
        title: 'Elevated PM2.5 Micro-Particulate Advisory',
        message: 'Concentration of PM2.5 is currently 98.4 µg/m³ (6.5x WHO safe limit). Sensitive populations should wear N95 filtration outdoors.',
        issuedAt: 'Today at 08:30 AM',
        expiresAt: 'Today at 21:00 PM',
        affectedAreas: ['Pune Metropolitan Region', 'Pimpri-Chinchwad', 'Hadapsar Corridor'],
        source: 'Central Pollution Control Board (CPCB) + ClimateShield AI Ensemble',
        actionRequired: 'Run HEPA air purifiers indoors and seal ventilation windows during peak rush hours.',
      },
      {
        id: 'alt-02',
        severity: 'ADVISORY',
        hazardType: 'EXTREME_HEAT',
        title: 'High Wet-Bulb Heat Index Alert',
        message: 'Apparent temperature is projected to reach 38.6°C with 68% relative humidity, creating high metabolic heat storage.',
        issuedAt: 'Today at 10:00 AM',
        expiresAt: 'Today at 17:00 PM',
        affectedAreas: ['Pune Urban Core', 'Kothrud', 'Viman Nagar'],
        source: 'India Meteorological Department (IMD) / ClimateShield Biometeorology Model',
        actionRequired: 'Pre-hydrate with electrolytes. Avoid intense cardio between 11:30 AM and 16:00 PM.',
      },
    ],
    recommendations: [
      {
        id: 'rec-1',
        category: 'Hydration',
        title: 'Stay Hydrated with Electrolytes',
        description: 'Drink at least 3.8L of fluid today. High humidity hampers evaporative cooling, increasing sweat rate by 40%.',
        icon: 'Droplets',
        timeframe: 'Throughout the day',
      },
      {
        id: 'rec-2',
        category: 'Behavioral',
        title: 'Avoid Intense Outdoor Activity During Peak Heat',
        description: 'Restrict outdoor running or construction labor between 11:30 AM and 4:30 PM when UV and apparent temp peak.',
        icon: 'Clock',
        timeframe: '11:30 AM - 04:30 PM',
      },
      {
        id: 'rec-3',
        category: 'Protection',
        title: 'Reduce Prolonged Exposure to Polluted Air',
        description: 'PM2.5 levels at 98.4 µg/m³ cause alveolar irritation. Use an N95 mask if commuting along congested highway arteries.',
        icon: 'ShieldAlert',
        timeframe: 'Morning & Evening Commute',
      },
      {
        id: 'rec-4',
        category: 'Protection',
        title: 'Apply Broad-Spectrum Sunscreen (SPF 50+)',
        description: 'UV index of 9.2 causes erythema in under 18 minutes. Reapply every 2 hours if outdoors.',
        icon: 'Sun',
        timeframe: '10:00 AM - 03:30 PM',
      },
    ],
  },
  'delhi-india': {
    location: {
      id: 'delhi-india',
      city: 'Delhi (NCR)',
      state: 'Delhi',
      country: 'India',
      lat: 28.6139,
      lng: 77.2090,
      elevationMeters: 216,
      population: '33 Million',
      riskScore: 88,
      riskLevel: 'SEVERE',
      primaryHazard: 'Severe Toxic Smog & Extreme Temperature Swings',
    },
    metrics: {
      temperature: { current: 39.5, feelsLike: 43.8, min: 27.2, max: 41.6, dewPoint: 24.5, unit: 'C' },
      airQuality: { aqi: 312, category: 'Hazardous', pm25: 220.5, pm10: 380.1, no2: 89.2, o3: 94.5, so2: 28.4, co: 4.2 },
      humidity: { percentage: 54, dewPoint: 24.5, comfortLevel: 'Oppressive' },
      uv: { index: 10.1, maxToday: 11.2, safeExposureMinutes: 12, category: 'Extreme', peakTime: '11:00 - 14:30' },
      wind: { speedKmh: 7.2, gustKmh: 12.0, direction: 'NW', degrees: 315, dispersionCapacity: 'Poor' },
      rain: { probability: 5, volumeMm: 0, forecast: 'Clear hot sky, dense stagnation layer' },
      pressure: { hPa: 1004, trend: 'Stable' },
      wetBulb: { tempC: 29.8, category: 'Danger' },
      wildfireThreat: { index: 65, smokeDensity: 'High' },
      floodThreat: { index: 20, drainageStress: 'Low' },
    },
    riskDrivers: [
      { factor: 'Hazardous Particulate Inhalation (PM2.5)', contributionPercent: 48, currentValue: '220.5 µg/m³', safeThreshold: '< 15 µg/m³', severity: 'critical', impactDescription: 'Severe systemic blood-barrier penetration risk.' },
      { factor: 'Heat Index & Solar Radiative Load', contributionPercent: 32, currentValue: '43.8°C Apparent', safeThreshold: '< 30.0°C', severity: 'critical', impactDescription: 'Extreme thermal strain and heat exhaustion danger.' },
      { factor: 'Surface Ozone Photochemical Accumulation', contributionPercent: 12, currentValue: '94.5 ppb', safeThreshold: '< 50 ppb', severity: 'high', impactDescription: 'Potent oxidant irritating epithelial lung linings.' },
      { factor: 'Atmospheric Stagnation', contributionPercent: 8, currentValue: '7.2 km/h Calms', safeThreshold: '> 20 km/h', severity: 'high', impactDescription: 'Complete lack of horizontal air dispersion.' },
    ],
    healthImpact: {
      heatStress: { score: 89, status: 'Danger of Heat Exhaustion', wbgt: 29.8, exhaustionThresholdHours: 0.8, symptoms: ['Heat syncope', 'Rapid pulse', 'Confusion', 'Nausea'] },
      respiratoryStress: { score: 94, status: 'Critical Toxic Air Load', pm25AlveolarInfiltration: 88.4, lungInflammationRisk: 'Severe for All Demographics', symptoms: ['Bronchospasm', 'Severe wheezing', 'Blood pressure spike', 'Chest pain'] },
      uvExposure: { score: 88, status: 'Extreme Solar Radiation', burnTimeMinutes: 12, erythemaDose: '7.2 SED/hr' },
      dehydrationRisk: { score: 85, status: 'Rapid Fluid Deficit', recommendedWaterLiters: 4.5, electrolyteNeed: 'Urgent' },
      outdoorActivityRisk: { score: 92, status: 'Avoid All Non-Essential Outdoor Exposure', safeWindow: 'Stay indoors with HEPA purification', avoidWindow: 'All Day (06:00 - 22:00)', intensityRecommendation: 'Do not exercise outdoors under any circumstance.' },
    },
    hourlyForecast: [
      { time: '06:00', hour: 6, temp: 28, feelsLike: 31, aqi: 280, pm25: 195, riskScore: 79, riskLevel: 'HIGH', humidity: 72, uv: 0.5, rainProb: 0, condition: 'Dense Smog', icon: 'Sunrise' },
      { time: '10:00', hour: 10, temp: 35, feelsLike: 39, aqi: 310, pm25: 218, riskScore: 86, riskLevel: 'SEVERE', humidity: 58, uv: 7.2, rainProb: 0, condition: 'Smoggy Sun', icon: 'Sun' },
      { time: '14:00', hour: 14, temp: 40.5, feelsLike: 45, aqi: 330, pm25: 235, riskScore: 92, riskLevel: 'SEVERE', humidity: 48, uv: 10.5, rainProb: 0, condition: 'Extreme Heat & Smog', icon: 'Sun' },
      { time: '18:00', hour: 18, temp: 36, feelsLike: 39, aqi: 315, pm25: 222, riskScore: 87, riskLevel: 'SEVERE', humidity: 56, uv: 1.2, rainProb: 5, condition: 'Hazy Sunset', icon: 'Sunset' },
      { time: '22:00', hour: 22, temp: 31, feelsLike: 34, aqi: 295, pm25: 205, riskScore: 81, riskLevel: 'SEVERE', humidity: 65, uv: 0, rainProb: 0, condition: 'Smoggy Night', icon: 'Moon' },
    ],
    dailyForecast: [
      { day: 'Today', date: 'Sep 12', tempMax: 41.6, tempMin: 27.2, aqi: 312, riskScore: 88, riskLevel: 'SEVERE', condition: 'Hazardous Smog', rainProb: 5, uvMax: 10.1, summary: 'Severe air pollution coupled with dangerous midday heat index' },
      { day: 'Sat', date: 'Sep 13', tempMax: 42.0, tempMin: 28.0, aqi: 325, riskScore: 90, riskLevel: 'SEVERE', condition: 'Severe Heatwave', rainProb: 0, uvMax: 10.8, summary: 'Thermal inversion exacerbates ground level particulate trap' },
      { day: 'Sun', date: 'Sep 14', tempMax: 40.8, tempMin: 27.5, aqi: 298, riskScore: 85, riskLevel: 'SEVERE', condition: 'Dense Haze', rainProb: 10, uvMax: 9.8, summary: 'Marginal wind increase offers minimal particulate dispersion' },
    ],
    scenarios: [
      { id: 'baseline', name: 'Baseline 2026', warmingDelta: '+0.0°C', targetYear: '2026', projectedRiskScore: 88, extremeHeatDays: 62, heavyRainEvents: 4, smogDaysDelta: 0, description: 'Severe annual smog episodes lasting over 110 days.', impacts: ['Critical public health strain', 'Emergency school closures'] },
      { id: 'rcp45', name: 'RCP 4.5 Scenario', warmingDelta: '+1.7°C', targetYear: '2040', projectedRiskScore: 94, extremeHeatDays: 95, heavyRainEvents: 9, smogDaysDelta: 24, description: 'Longer stagnation seasons and dangerous dry heat spells.', impacts: ['Wet bulb limits reached repeatedly in May-June', 'Chronic cardiopulmonary strain'] },
    ],
    alerts: [
      {
        id: 'alt-delhi-01',
        severity: 'CRITICAL',
        hazardType: 'AIR_QUALITY',
        title: 'Severe Emergency Air Pollution Alert',
        message: 'AQI has crossed 300+ (Hazardous category). Inhaling outside air today is equivalent to smoking ~18 cigarettes.',
        issuedAt: 'Today at 06:00 AM',
        expiresAt: 'Tomorrow at 06:00 AM',
        affectedAreas: ['Entire NCR Region', 'Anand Vihar', 'Dwarka', 'Noida'],
        source: 'GRAP Stage IV Advisory',
        actionRequired: 'Stay strictly indoors. Wear certified N95/N99 respirators if transit is unavoidable.',
      }
    ],
    recommendations: [
      { id: 'rec-d1', category: 'Urgent', title: 'Operate High-Grade HEPA Filtration', description: 'Keep indoor windows airtight and run air purifiers on high mode in living and sleeping spaces.', icon: 'ShieldAlert', timeframe: '24 Hours' },
      { id: 'rec-d2', category: 'Behavioral', title: 'Avoid Outdoor Workouts & Commutes on Foot', description: 'Physical exertion elevates lung ventilation by 400%, deeply depositing heavy fine particles.', icon: 'HeartPulse', timeframe: 'All Day' },
      { id: 'rec-d3', category: 'Hydration', title: 'Maintain 4.5L Daily Hydration with ORS', description: 'Counteract severe vapor deficit and high thermal perspiration.', icon: 'Droplets', timeframe: 'Continuous' },
    ]
  },
  'tokyo-japan': {
    location: {
      id: 'tokyo-japan',
      city: 'Tokyo',
      state: 'Kanto',
      country: 'Japan',
      lat: 35.6762,
      lng: 139.6503,
      elevationMeters: 40,
      population: '14 Million',
      riskScore: 28,
      riskLevel: 'LOW',
      primaryHazard: 'Mild Urban Heat Island & Low UV',
    },
    metrics: {
      temperature: { current: 22.4, feelsLike: 22.8, min: 18.2, max: 24.5, dewPoint: 14.1, unit: 'C' },
      airQuality: { aqi: 34, category: 'Good', pm25: 8.2, pm10: 16.5, no2: 18.2, o3: 28.0, so2: 4.1, co: 0.4 },
      humidity: { percentage: 58, dewPoint: 14.1, comfortLevel: 'Comfortable' },
      uv: { index: 4.2, maxToday: 5.5, safeExposureMinutes: 45, category: 'Moderate', peakTime: '11:30 - 13:30' },
      wind: { speedKmh: 18.5, gustKmh: 28.0, direction: 'ENE', degrees: 65, dispersionCapacity: 'Good' },
      rain: { probability: 20, volumeMm: 0.8, forecast: 'Crisp coastal breeze, clear skies' },
      pressure: { hPa: 1018, trend: 'Stable' },
      wetBulb: { tempC: 17.5, category: 'Normal' },
      wildfireThreat: { index: 5, smokeDensity: 'Low' },
      floodThreat: { index: 15, drainageStress: 'Low' },
    },
    riskDrivers: [
      { factor: 'UV Radiative Index', contributionPercent: 42, currentValue: '4.2 Moderate', safeThreshold: '< 5.0', severity: 'low', impactDescription: 'Mild UV exposure during peak midday hours.' },
      { factor: 'Urban Thermal Mass', contributionPercent: 28, currentValue: '22.8°C', safeThreshold: '< 25.0°C', severity: 'low', impactDescription: 'Well-ventilated urban canyon with marine cooling.' },
      { factor: 'Fine Particulates PM2.5', contributionPercent: 18, currentValue: '8.2 µg/m³', safeThreshold: '< 15 µg/m³', severity: 'low', impactDescription: 'Within optimal WHO safe threshold.' },
      { factor: 'Ozone Concentrations', contributionPercent: 12, currentValue: '28 ppb', safeThreshold: '< 50 ppb', severity: 'low', impactDescription: 'Minimal photochemical activity.' },
    ],
    healthImpact: {
      heatStress: { score: 22, status: 'Optimal Thermal Comfort', wbgt: 17.5, exhaustionThresholdHours: 6.0, symptoms: ['None'] },
      respiratoryStress: { score: 18, status: 'Clean Ambient Air', pm25AlveolarInfiltration: 6.2, lungInflammationRisk: 'Very Low', symptoms: ['None'] },
      uvExposure: { score: 35, status: 'Mild UV Exposure', burnTimeMinutes: 45, erythemaDose: '1.8 SED/hr' },
      dehydrationRisk: { score: 25, status: 'Baseline Hydration Requirement', recommendedWaterLiters: 2.2, electrolyteNeed: 'Low' },
      outdoorActivityRisk: { score: 19, status: 'Excellent for All Outdoor Sports', safeWindow: 'All Day (06:00 - 20:00)', avoidWindow: 'None', intensityRecommendation: 'Ideal conditions for running, cycling, and outdoor recreation.' },
    },
    hourlyForecast: [
      { time: '08:00', hour: 8, temp: 19, feelsLike: 19, aqi: 28, pm25: 6, riskScore: 20, riskLevel: 'LOW', humidity: 65, uv: 1.5, rainProb: 10, condition: 'Sunny', icon: 'Sun' },
      { time: '12:00', hour: 12, temp: 24, feelsLike: 24, aqi: 36, pm25: 9, riskScore: 30, riskLevel: 'LOW', humidity: 52, uv: 4.8, rainProb: 15, condition: 'Clear', icon: 'Sun' },
      { time: '16:00', hour: 16, temp: 22, feelsLike: 22, aqi: 32, pm25: 8, riskScore: 25, riskLevel: 'LOW', humidity: 60, uv: 1.2, rainProb: 20, condition: 'Partly Cloudy', icon: 'CloudSun' },
      { time: '20:00', hour: 20, temp: 19, feelsLike: 19, aqi: 26, pm25: 5, riskScore: 18, riskLevel: 'LOW', humidity: 70, uv: 0, rainProb: 10, condition: 'Crisp Night', icon: 'Moon' },
    ],
    dailyForecast: [
      { day: 'Today', date: 'Sep 12', tempMax: 24.5, tempMin: 18.2, aqi: 34, riskScore: 28, riskLevel: 'LOW', condition: 'Pleasant & Sunny', rainProb: 20, uvMax: 5.5, summary: 'Optimal environmental conditions with excellent air dispersion' },
      { day: 'Sat', date: 'Sep 13', tempMax: 25.0, tempMin: 19.0, aqi: 38, riskScore: 30, riskLevel: 'LOW', condition: 'Sunny Intervals', rainProb: 10, uvMax: 5.8, summary: 'Pleasant autumn breeze from Tokyo Bay' },
    ],
    scenarios: [
      { id: 'baseline', name: 'Baseline 2026', warmingDelta: '+0.0°C', targetYear: '2026', projectedRiskScore: 28, extremeHeatDays: 8, heavyRainEvents: 5, smogDaysDelta: 0, description: 'Temperate climate with effective coastal ventilation.', impacts: ['Low baseline risk'] },
    ],
    alerts: [],
    recommendations: [
      { id: 'rec-t1', category: 'Behavioral', title: 'Ideal Day for Outdoor Activities', description: 'AQI and temperature are within optimal physiological zones. Great day for outdoor training or parks.', icon: 'CheckCircle', timeframe: 'All Day' },
      { id: 'rec-t2', category: 'Protection', title: 'Standard SPF 30 for Midday Sunlight', description: 'Apply moderate sunscreen if staying in direct sunlight for more than 45 minutes between 11 AM - 2 PM.', icon: 'Sun', timeframe: '11:00 AM - 02:00 PM' },
    ]
  },
  'dubai-uae': {
    location: {
      id: 'dubai-uae',
      city: 'Dubai',
      state: 'Dubai',
      country: 'United Arab Emirates',
      lat: 25.2048,
      lng: 55.2708,
      elevationMeters: 5,
      population: '3.6 Million',
      riskScore: 84,
      riskLevel: 'SEVERE',
      primaryHazard: 'Extreme Hyperthermia & High Solar Radiance',
    },
    metrics: {
      temperature: { current: 43.8, feelsLike: 52.4, min: 32.1, max: 45.6, dewPoint: 28.2, unit: 'C' },
      airQuality: { aqi: 145, category: 'Unhealthy for Sensitive', pm25: 64.2, pm10: 195.4, no2: 32.5, o3: 76.2, so2: 12.1, co: 1.1 },
      humidity: { percentage: 48, dewPoint: 28.2, comfortLevel: 'Oppressive' },
      uv: { index: 11.8, maxToday: 12.4, safeExposureMinutes: 8, category: 'Extreme', peakTime: '10:30 - 15:00' },
      wind: { speedKmh: 16.8, gustKmh: 26.5, direction: 'NW', degrees: 310, dispersionCapacity: 'Moderate' },
      rain: { probability: 0, volumeMm: 0, forecast: 'Intense blistering sunshine, desert wind' },
      pressure: { hPa: 1002, trend: 'Stable' },
      wetBulb: { tempC: 31.4, category: 'Danger' },
      wildfireThreat: { index: 0, smokeDensity: 'Low' },
      floodThreat: { index: 10, drainageStress: 'Low' },
    },
    riskDrivers: [
      { factor: 'Extreme Apparent Temperature & Wet-Bulb Stress', contributionPercent: 52, currentValue: '52.4°C Feels Like (WBGT 31.4°C)', safeThreshold: '< 32.0°C', severity: 'critical', impactDescription: 'Approaching upper limit of human metabolic heat tolerance.' },
      { factor: 'Solar UV Erythema Dose', contributionPercent: 26, currentValue: '11.8 UV Index', safeThreshold: '< 5.0', severity: 'critical', impactDescription: 'Severe skin burn in under 8 minutes of direct sun.' },
      { factor: 'Coarse Desert Dust (PM10)', contributionPercent: 14, currentValue: '195.4 µg/m³', safeThreshold: '< 45 µg/m³', severity: 'high', impactDescription: 'Windblown fine sand causing upper airway irritation.' },
      { factor: 'Tropospheric Ozone', contributionPercent: 8, currentValue: '76.2 ppb', safeThreshold: '< 50 ppb', severity: 'moderate', impactDescription: 'Intense solar radiation driving ozone synthesis.' },
    ],
    healthImpact: {
      heatStress: { score: 96, status: 'Critical Heat Stroke Risk', wbgt: 31.4, exhaustionThresholdHours: 0.5, symptoms: ['Heat syncope', 'Rapid heart rate', 'Anhidrosis risk', 'Confusion'] },
      respiratoryStress: { score: 62, status: 'Dust & Ozone Irritation', pm25AlveolarInfiltration: 42.1, lungInflammationRisk: 'Moderate to High', symptoms: ['Eye stinging', 'Throat dryness'] },
      uvExposure: { score: 98, status: 'Dangerous UV Radiation', burnTimeMinutes: 8, erythemaDose: '9.2 SED/hr' },
      dehydrationRisk: { score: 95, status: 'Extreme Perspiration Loss', recommendedWaterLiters: 5.2, electrolyteNeed: 'Urgent' },
      outdoorActivityRisk: { score: 94, status: 'Prohibit Strenuous Outdoor Activity', safeWindow: 'Indoors Only / Night after 21:00', avoidWindow: '08:00 AM - 19:30 PM', intensityRecommendation: 'Strictly avoid outdoor physical work during daylight hours.' },
    },
    hourlyForecast: [
      { time: '07:00', hour: 7, temp: 34, feelsLike: 39, aqi: 120, pm25: 50, riskScore: 68, riskLevel: 'HIGH', humidity: 62, uv: 2.1, rainProb: 0, condition: 'Sunny', icon: 'Sunrise' },
      { time: '11:00', hour: 11, temp: 42, feelsLike: 49, aqi: 145, pm25: 64, riskScore: 84, riskLevel: 'SEVERE', humidity: 45, uv: 11.5, rainProb: 0, condition: 'Extreme Heat', icon: 'Sun' },
      { time: '14:00', hour: 14, temp: 45, feelsLike: 54, aqi: 152, pm25: 68, riskScore: 92, riskLevel: 'SEVERE', humidity: 42, uv: 11.8, rainProb: 0, condition: 'Blistering Sun', icon: 'Sun' },
      { time: '18:00', hour: 18, temp: 40, feelsLike: 46, aqi: 138, pm25: 58, riskScore: 78, riskLevel: 'HIGH', humidity: 55, uv: 0.9, rainProb: 0, condition: 'Dusty Dusk', icon: 'Sunset' },
    ],
    dailyForecast: [
      { day: 'Today', date: 'Sep 12', tempMax: 45.6, tempMin: 32.1, aqi: 145, riskScore: 84, riskLevel: 'SEVERE', condition: 'Extreme Thermal Stress', rainProb: 0, uvMax: 11.8, summary: 'Dangerous heat index exceeding 52°C feels-like' },
    ],
    scenarios: [
      { id: 'baseline', name: 'Baseline 2026', warmingDelta: '+0.0°C', targetYear: '2026', projectedRiskScore: 84, extremeHeatDays: 140, heavyRainEvents: 1, smogDaysDelta: 0, description: 'Prolonged hyper-thermal summer windows.', impacts: ['100% reliance on artificial cooling'] },
    ],
    alerts: [
      {
        id: 'alt-dxb-01',
        severity: 'CRITICAL',
        hazardType: 'EXTREME_HEAT',
        title: 'Severe Midday Thermal Safety Warning',
        message: 'Feels-like temperature will reach 52.4°C. Mandatory work break protocols are active for outdoor labor.',
        issuedAt: 'Today at 08:00 AM',
        expiresAt: 'Today at 18:00 PM',
        affectedAreas: ['All Emirates of Dubai & Northern Emirates'],
        source: 'National Center of Meteorology (NCM)',
        actionRequired: 'Stay in climate-controlled environments and consume electrolyte-enriched fluids.',
      }
    ],
    recommendations: [
      { id: 'rec-u1', category: 'Urgent', title: 'Limit Direct Sun to < 10 Minutes', description: 'Extreme UV index of 11.8 and 44°C air temperature can trigger acute heat exhaustion and severe solar burns.', icon: 'Sun', timeframe: '10:00 AM - 05:00 PM' },
      { id: 'rec-u2', category: 'Hydration', title: 'Consume 5+ Liters with Electrolytes', description: 'High ambient temperature requires active electrolyte replenishing to prevent hypokalemia and cramping.', icon: 'Droplets', timeframe: 'Continuous' },
    ]
  },
  'new-york-usa': {
    location: {
      id: 'new-york-usa',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      lat: 40.7128,
      lng: -74.0060,
      elevationMeters: 10,
      population: '8.3 Million',
      riskScore: 42,
      riskLevel: 'MODERATE',
      primaryHazard: 'Urban Heat Island & Ground Ozone',
    },
    metrics: {
      temperature: { current: 24.6, feelsLike: 25.8, min: 18.5, max: 27.2, dewPoint: 16.4, unit: 'C' },
      airQuality: { aqi: 62, category: 'Moderate', pm25: 16.8, pm10: 28.4, no2: 24.6, o3: 45.2, so2: 6.2, co: 0.6 },
      humidity: { percentage: 61, dewPoint: 16.4, comfortLevel: 'Comfortable' },
      uv: { index: 6.4, maxToday: 7.2, safeExposureMinutes: 28, category: 'High', peakTime: '11:45 - 14:15' },
      wind: { speedKmh: 15.2, gustKmh: 24.0, direction: 'SSE', degrees: 160, dispersionCapacity: 'Moderate' },
      rain: { probability: 30, volumeMm: 1.2, forecast: 'Scattered clouds, mild evening breeze' },
      pressure: { hPa: 1014, trend: 'Falling' },
      wetBulb: { tempC: 20.2, category: 'Normal' },
      wildfireThreat: { index: 15, smokeDensity: 'Low' },
      floodThreat: { index: 25, drainageStress: 'Low' },
    },
    riskDrivers: [
      { factor: 'Midday Solar UV Index', contributionPercent: 38, currentValue: '6.4 High', safeThreshold: '< 5.0', severity: 'moderate', impactDescription: 'Moderate risk of skin damage during midday hours.' },
      { factor: 'Ground-Level Ozone', contributionPercent: 32, currentValue: '45.2 ppb', safeThreshold: '< 50 ppb', severity: 'moderate', impactDescription: 'Traffic emission reactivity during afternoon sunlight.' },
      { factor: 'Fine Particulates PM2.5', contributionPercent: 18, currentValue: '16.8 µg/m³', safeThreshold: '< 15 µg/m³', severity: 'moderate', impactDescription: 'Slightly above WHO annual guideline.' },
      { factor: 'Urban Canopy Heat Trap', contributionPercent: 12, currentValue: '25.8°C Feels Like', safeThreshold: '< 28.0°C', severity: 'low', impactDescription: 'Asphalt & concrete retention in Midtown Manhattan.' },
    ],
    healthImpact: {
      heatStress: { score: 38, status: 'Mild Thermal Burden', wbgt: 20.2, exhaustionThresholdHours: 4.5, symptoms: ['Mild perspiration'] },
      respiratoryStress: { score: 44, status: 'Mild Airway Sensitivity', pm25AlveolarInfiltration: 18.2, lungInflammationRisk: 'Low (Moderate for Asthmatics)', symptoms: ['Slight airway dryness'] },
      uvExposure: { score: 62, status: 'High UV Window', burnTimeMinutes: 28, erythemaDose: '3.4 SED/hr' },
      dehydrationRisk: { score: 38, status: 'Standard Hydration Window', recommendedWaterLiters: 2.8, electrolyteNeed: 'Low' },
      outdoorActivityRisk: { score: 35, status: 'Generally Favorable for Outdoor Exercise', safeWindow: '06:00 - 11:00 AM & 16:30 - 21:00', avoidWindow: '12:00 - 14:30 PM', intensityRecommendation: 'Good conditions for outdoor jogging. Apply SPF 30+.' },
    },
    hourlyForecast: [
      { time: '08:00', hour: 8, temp: 20, feelsLike: 20, aqi: 52, pm25: 14, riskScore: 32, riskLevel: 'LOW', humidity: 70, uv: 2.0, rainProb: 15, condition: 'Partly Sunny', icon: 'CloudSun' },
      { time: '12:00', hour: 12, temp: 26, feelsLike: 27, aqi: 68, pm25: 18, riskScore: 46, riskLevel: 'MODERATE', humidity: 58, uv: 7.0, rainProb: 25, condition: 'Warm Sun', icon: 'Sun' },
      { time: '16:00', hour: 16, temp: 25, feelsLike: 26, aqi: 64, pm25: 17, riskScore: 42, riskLevel: 'MODERATE', humidity: 62, uv: 3.2, rainProb: 35, condition: 'Passing Shower', icon: 'CloudRain' },
      { time: '20:00', hour: 20, temp: 22, feelsLike: 22, aqi: 48, pm25: 12, riskScore: 28, riskLevel: 'LOW', humidity: 75, uv: 0, rainProb: 20, condition: 'Clear Sky', icon: 'Moon' },
    ],
    dailyForecast: [
      { day: 'Today', date: 'Sep 12', tempMax: 27.2, tempMin: 18.5, aqi: 62, riskScore: 42, riskLevel: 'MODERATE', condition: 'Mostly Sunny', rainProb: 30, uvMax: 7.2, summary: 'Moderate air quality with warm afternoon temperatures' },
      { day: 'Sat', date: 'Sep 13', tempMax: 26.0, tempMin: 17.8, aqi: 55, riskScore: 36, riskLevel: 'LOW', condition: 'Scattered Clouds', rainProb: 20, uvMax: 6.8, summary: 'Comfortable autumnal airflow across tri-state area' },
    ],
    scenarios: [
      { id: 'baseline', name: 'Baseline 2026', warmingDelta: '+0.0°C', targetYear: '2026', projectedRiskScore: 42, extremeHeatDays: 14, heavyRainEvents: 7, smogDaysDelta: 0, description: 'Moderate coastal climate with periodic summer heatwaves.', impacts: ['Flash flooding in low subway catchments'] },
    ],
    alerts: [],
    recommendations: [
      { id: 'rec-ny1', category: 'Protection', title: 'Apply SPF 30+ Sun Protection', description: 'UV index peaks at 7.2 between 12:00 PM and 2:30 PM. Wear sunglasses and sunscreen.', icon: 'Sun', timeframe: '11:45 AM - 02:30 PM' },
      { id: 'rec-ny2', category: 'Hydration', title: 'Maintain 2.8L Daily Water Intake', description: 'Normal metabolic hydration requirement for urban walking and commuting.', icon: 'Droplets', timeframe: 'All Day' },
    ]
  },
  'london-uk': {
    location: {
      id: 'london-uk',
      city: 'London',
      state: 'Greater London',
      country: 'United Kingdom',
      lat: 51.5074,
      lng: -0.1278,
      elevationMeters: 15,
      population: '9.0 Million',
      riskScore: 31,
      riskLevel: 'LOW',
      primaryHazard: 'Overcast Conditions & Mild Humidity',
    },
    metrics: {
      temperature: { current: 19.8, feelsLike: 19.4, min: 13.5, max: 21.2, dewPoint: 12.0, unit: 'C' },
      airQuality: { aqi: 41, category: 'Good', pm25: 10.4, pm10: 18.2, no2: 28.5, o3: 31.0, so2: 3.8, co: 0.5 },
      humidity: { percentage: 65, dewPoint: 12.0, comfortLevel: 'Comfortable' },
      uv: { index: 3.8, maxToday: 4.5, safeExposureMinutes: 50, category: 'Moderate', peakTime: '12:00 - 14:00' },
      wind: { speedKmh: 20.4, gustKmh: 34.0, direction: 'SW', degrees: 225, dispersionCapacity: 'Good' },
      rain: { probability: 45, volumeMm: 2.4, forecast: 'Breezy with intermittent light showers' },
      pressure: { hPa: 1012, trend: 'Rising' },
      wetBulb: { tempC: 15.6, category: 'Normal' },
      wildfireThreat: { index: 2, smokeDensity: 'Low' },
      floodThreat: { index: 20, drainageStress: 'Low' },
    },
    riskDrivers: [
      { factor: 'Nitrogen Dioxide (NO2) Traffic Plumes', contributionPercent: 44, currentValue: '28.5 µg/m³', safeThreshold: '< 25 µg/m³', severity: 'moderate', impactDescription: 'Corridor emissions along Central London arterial roads.' },
      { factor: 'UV Radiance Index', contributionPercent: 26, currentValue: '3.8 Moderate', safeThreshold: '< 5.0', severity: 'low', impactDescription: 'Mild UV penetrated by cloud layers.' },
      { factor: 'Particulate PM2.5', contributionPercent: 20, currentValue: '10.4 µg/m³', safeThreshold: '< 15 µg/m³', severity: 'low', impactDescription: 'Well within UK and WHO safety targets.' },
      { factor: 'Thermal Discomfort Index', contributionPercent: 10, currentValue: '19.4°C Feels Like', safeThreshold: '< 24.0°C', severity: 'low', impactDescription: 'Comfortable temperate maritime climate.' },
    ],
    healthImpact: {
      heatStress: { score: 18, status: 'Zero Heat Stress', wbgt: 15.6, exhaustionThresholdHours: 8.0, symptoms: ['None'] },
      respiratoryStress: { score: 26, status: 'Good Respiratory Comfort', pm25AlveolarInfiltration: 8.5, lungInflammationRisk: 'Low', symptoms: ['None'] },
      uvExposure: { score: 28, status: 'Low to Moderate UV', burnTimeMinutes: 50, erythemaDose: '1.4 SED/hr' },
      dehydrationRisk: { score: 20, status: 'Standard Fluid Baseline', recommendedWaterLiters: 2.2, electrolyteNeed: 'Low' },
      outdoorActivityRisk: { score: 22, status: 'Ideal for Outdoor Fitness', safeWindow: 'All Day', avoidWindow: 'None', intensityRecommendation: 'Great weather for cycling and long runs. Carry a light rain jacket.' },
    },
    hourlyForecast: [
      { time: '08:00', hour: 8, temp: 15, feelsLike: 15, aqi: 36, pm25: 8, riskScore: 24, riskLevel: 'LOW', humidity: 75, uv: 1.0, rainProb: 30, condition: 'Cloudy', icon: 'Cloud' },
      { time: '13:00', hour: 13, temp: 21, feelsLike: 21, aqi: 44, pm25: 11, riskScore: 33, riskLevel: 'LOW', humidity: 60, uv: 4.2, rainProb: 40, condition: 'Sun & Clouds', icon: 'CloudSun' },
      { time: '18:00', hour: 18, temp: 18, feelsLike: 18, aqi: 38, pm25: 9, riskScore: 28, riskLevel: 'LOW', humidity: 68, uv: 0.6, rainProb: 25, condition: 'Light Breeze', icon: 'Wind' },
    ],
    dailyForecast: [
      { day: 'Today', date: 'Sep 12', tempMax: 21.2, tempMin: 13.5, aqi: 41, riskScore: 31, riskLevel: 'LOW', condition: 'Passing Showers', rainProb: 45, uvMax: 4.5, summary: 'Temperate maritime air with excellent atmospheric mixing' },
    ],
    scenarios: [
      { id: 'baseline', name: 'Baseline 2026', warmingDelta: '+0.0°C', targetYear: '2026', projectedRiskScore: 31, extremeHeatDays: 4, heavyRainEvents: 6, smogDaysDelta: 0, description: 'Temperate oceanic regime with mild summer extremes.', impacts: ['Thames flood barrier operational resilience'] },
    ],
    alerts: [],
    recommendations: [
      { id: 'rec-ldn1', category: 'Behavioral', title: 'Great Day for Outdoor Commutes', description: 'Air quality is clear and temperatures are mild across the capital.', icon: 'CheckCircle', timeframe: 'All Day' },
    ]
  }
};

export const PERSONA_PROFILES: PersonaProfile[] = [
  {
    id: 'general',
    name: 'General Population',
    label: 'Standard Adult (18-64)',
    ageGroup: '18 - 64 years',
    vulnerabilityFactor: 1.0,
    keySensitivities: ['Midday UV', 'Sustained severe heat', 'Hazardous smog > 200 AQI'],
    customAdvice: [
      'Maintain standard 2.5L - 3.5L daily hydration',
      'Wear SPF 30+ sunscreen during peak solar hours',
      'Monitor real-time AQI when exercising outdoors'
    ],
    recommendedMaxExposureMins: 120
  },
  {
    id: 'asthma',
    name: 'Respiratory / Asthma',
    label: 'Asthma & Chronic Bronchitis',
    ageGroup: 'All ages with airway sensitivity',
    vulnerabilityFactor: 1.45,
    keySensitivities: ['Fine particulate PM2.5 > 35 µg/m³', 'Ground-level ozone', 'High relative humidity + smog'],
    customAdvice: [
      'Keep rescue bronchodilator / inhaler accessible at all times',
      'Wear certified N95 respirator if traveling near heavy vehicular corridors',
      'Run HEPA air purifiers indoors and avoid opening windows between 18:00 - 21:00'
    ],
    recommendedMaxExposureMins: 30
  },
  {
    id: 'elderly',
    name: 'Senior Citizen (65+)',
    label: 'Elderly / Cardiovascular Risk',
    ageGroup: '65+ years',
    vulnerabilityFactor: 1.35,
    keySensitivities: ['Wet-bulb heat stress > 26°C', 'Sudden barometric swings', 'PM2.5 microvascular strain'],
    customAdvice: [
      'Stay in well-ventilated or air-conditioned environments during thermal peak (11:00 - 16:30)',
      'Drink water at regular intervals even before feeling thirsty',
      'Avoid unshaded outdoor walking during peak UV index windows'
    ],
    recommendedMaxExposureMins: 45
  },
  {
    id: 'child',
    name: 'Children & Infants',
    label: 'Children Under 12',
    ageGroup: '0 - 12 years',
    vulnerabilityFactor: 1.3,
    keySensitivities: ['High respiratory rate per body weight', 'Rapid dehydration', 'Sensitive skin erythema'],
    customAdvice: [
      'Schedule outdoor playground time before 10:00 AM or after 17:00 PM',
      'Apply broad-spectrum mineral sunscreen SPF 50+',
      'Ensure continuous hydration with water and diluted fruit juices'
    ],
    recommendedMaxExposureMins: 45
  },
  {
    id: 'worker',
    name: 'Outdoor Worker / Laborer',
    label: 'Construction & Field Labor',
    ageGroup: 'Working adults',
    vulnerabilityFactor: 1.4,
    keySensitivities: ['Sustained Wet-Bulb Globe Temp > 28°C', 'Direct solar radiative load', 'Prolonged PM2.5 inhalation'],
    customAdvice: [
      'Implement mandatory 15-minute rest breaks in shade every 45 minutes of heavy labor',
      'Drink 500ml of electrolyte water per hour worked',
      'Wear wide-brim head protection and UV-blocking breathable workwear'
    ],
    recommendedMaxExposureMins: 60
  },
  {
    id: 'athlete',
    name: 'Endurance Athlete / Runner',
    label: 'Marathon & High Cardio',
    ageGroup: 'Athletic adults',
    vulnerabilityFactor: 1.25,
    keySensitivities: ['Deep alveolar PM2.5 deposition at high VO2 max', 'Core hyperthermia', 'Electrolyte depletion'],
    customAdvice: [
      'Shift strenuous tempo runs to dawn (05:30 - 07:30 AM) when temperature and ozone are lowest',
      'If AQI > 150, transfer workout to indoor treadmill or climate-controlled gym',
      'Pre-load with sodium/potassium electrolytes before sessions > 60 minutes'
    ],
    recommendedMaxExposureMins: 75
  }
];
