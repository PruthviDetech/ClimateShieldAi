import { PersonaProfile } from '../types/climate';
import { LocationDataset } from './mockLocations';

export interface AIResponseTemplate {
  queryKeywords: string[];
  generateResponse: (dataset: LocationDataset, persona: PersonaProfile) => {
    text: string;
    riskScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    recommendations: string[];
    citations: string[];
    actions: { label: string; action: string }[];
  };
}

export const AI_KNOWLEDGE_BASE: AIResponseTemplate[] = [
  {
    queryKeywords: ['asthma', 'child', 'safe', 'outside', 'breathe', 'respiratory'],
    generateResponse: (dataset, persona) => {
      const pm25 = dataset.metrics.airQuality.pm25;
      const aqi = dataset.metrics.airQuality.aqi;
      const temp = dataset.metrics.temperature.feelsLike;
      const isHigh = aqi > 100 || pm25 > 35;

      return {
        text: `### 🛡️ Environmental Health Assessment: Respiratory & Pediatric Vulnerability

**Location Evaluated:** ${dataset.location.city}, ${dataset.location.state}  
**Current Particulate Load:** PM2.5 is **${pm25} µg/m³** (AQI: ${aqi} — *${dataset.metrics.airQuality.category}*)  
**Thermal Index:** Feels like **${temp}°C** with **${dataset.metrics.humidity.percentage}%** humidity.

${isHigh 
  ? `⚠️ **Clinical Precautionary Advisory:** Outdoor air in ${dataset.location.city} currently carries high fine particulate density. Children and individuals with asthma experience **${persona.id === 'asthma' ? '45% higher bronchial reactivity' : 'elevated microvascular strain'}**. The small aerodynamic diameter (<2.5 µm) allows these particles to penetrate deep into terminal bronchioles and alveoli, potentially triggering bronchospasm and wheezing.`
  : `✅ **Low Risk Conditions:** Air quality is within safe physiological bounds for outdoor activity.`}

#### 📋 Proactive Safety Protocol:
- ${isHigh ? 'Keep physical exertion indoors in a HEPA-filtered environment during morning and evening rush hours.' : 'Safe for general outdoor exercise.'}
- Ensure rescue bronchodilators / inhalers are readily accessible.
- Maintain adequate indoor air circulation with closed external windows.`,
        riskScore: Math.min(100, Math.round(dataset.location.riskScore * (persona.id === 'asthma' ? 1.25 : 1.1))),
        riskLevel: dataset.location.riskLevel,
        recommendations: [
          'Pre-treat with prescribed maintenance inhalers before necessary commutes',
          'Wear a well-fitted N95 / FFP2 respirator if transiting near high-traffic arterials',
          'Track real-time PM2.5 trends on the ClimateShield Live Dashboard'
        ],
        citations: ['WHO Global Air Quality Guidelines (2021)', 'Lancet Planetary Health: Pediatric Asthma & Fine Particulates', 'Copernicus Sentinel-5P TROPOMI Tropospheric Analysis'],
        actions: [
          { label: 'View PM2.5 Infiltration Model', action: 'health-insights' },
          { label: 'Configure High AQI Alert', action: 'alerts' }
        ]
      };
    }
  },
  {
    queryKeywords: ['heatwave', 'heat', 'wet-bulb', 'wbgt', 'temperature', 'sweat', 'hot'],
    generateResponse: (dataset, persona) => {
      const metrics = dataset.metrics;
      const wbgt = metrics.wetBulb.tempC;
      const feelsLike = metrics.temperature.feelsLike;

      return {
        text: `### 🌡️ Biometeorological Analysis: Wet-Bulb & Hyperthermia Strain

**Location:** ${dataset.location.city}, ${dataset.location.country}  
**Apparent Temperature:** **${feelsLike}°C** (Ambient: ${metrics.temperature.current}°C)  
**Wet-Bulb Globe Temperature (WBGT):** **${wbgt}°C** (*${metrics.wetBulb.category}*)  
**Relative Humidity:** **${metrics.humidity.percentage}%**

#### 🔬 Thermodynamic Mechanism:
When ambient humidity is high (${metrics.humidity.percentage}%), the water vapor pressure gradient between human skin and ambient air shrinks. This impedes sweat evaporation—the body's primary physiological cooling mechanism. 

At a WBGT of **${wbgt}°C**, sustained metabolic work leads to heat accumulation in the body core. For ${persona.label}, time-to-exhaustion decreases to approximately **${dataset.healthImpact.heatStress.exhaustionThresholdHours} hours** without active cooling breaks.`,
        riskScore: dataset.location.riskScore,
        riskLevel: dataset.location.riskLevel,
        recommendations: [
          `Drink at least ${dataset.healthImpact.dehydrationRisk.recommendedWaterLiters}L of water with balanced sodium/potassium electrolytes`,
          'Avoid unshaded direct sunlight between 11:30 AM and 16:30 PM',
          'Apply cooling towels to arterial pulse points (neck, wrists) if experiencing dizziness'
        ],
        citations: ['NOAA Wet-Bulb Globe Temperature Protocols', 'Occupational Safety & Health Administration (OSHA) Heat Illness Prevention', 'IPCC Sixth Assessment Report: Regional Extreme Heat'],
        actions: [
          { label: 'Open Hydration Calculator', action: 'health-insights' },
          { label: 'Explore 14-Day Heat Forecast', action: 'forecast' }
        ]
      };
    }
  },
  {
    queryKeywords: ['pune', 'risk', 'why', 'drivers', 'factors', 'score', '72'],
    generateResponse: (dataset) => {
      return {
        text: `### 📊 ClimateShield Risk Index Breakdown: ${dataset.location.city}

**Calculated Composite Risk Index:** **${dataset.location.riskScore} / 100** [**${dataset.location.riskLevel}**]

#### 🔍 Primary Contributors Driving This Score:
1. **${dataset.riskDrivers[0].factor}:** Contributes **${dataset.riskDrivers[0].contributionPercent}%** to overall risk (${dataset.riskDrivers[0].currentValue}).
2. **${dataset.riskDrivers[1].factor}:** Contributes **${dataset.riskDrivers[1].contributionPercent}%** (${dataset.riskDrivers[1].currentValue}).
3. **${dataset.riskDrivers[2].factor}:** Contributes **${dataset.riskDrivers[2].contributionPercent}%** (${dataset.riskDrivers[2].currentValue}).
4. **${dataset.riskDrivers[3].factor}:** Contributes **${dataset.riskDrivers[3].contributionPercent}%** (${dataset.riskDrivers[3].currentValue}).

**Geographic Context:** Pune's Deccan plateau topography creates localized nocturnal temperature inversions in river valleys (Mula-Mutha), trapping morning vehicular emissions and elevating fine particulate concentrations before convective dispersion begins.`,
        riskScore: dataset.location.riskScore,
        riskLevel: dataset.location.riskLevel,
        recommendations: [
          'Stay hydrated with 3.8L fluid replenishment',
          'Avoid intense cardio workouts between 11:30 AM - 16:30 PM',
          'Reduce unmasked exposure near high-density traffic junctions'
        ],
        citations: ['ClimateShield Multi-Modal Risk Formulation v2.4', 'CPCB India National Ambient Air Monitoring Data', 'Copernicus Atmospheric Service'],
        actions: [
          { label: 'View Risk Driver Charts', action: 'dashboard' },
          { label: 'Compare Scenarios (RCP 4.5 / 8.5)', action: 'forecast' }
        ]
      };
    }
  },
  {
    queryKeywords: ['uv', 'sun', 'sunscreen', 'burn', 'erythema', 'solar'],
    generateResponse: (dataset) => {
      const uv = dataset.metrics.uv;
      return {
        text: `### ☀️ Solar Radiance & Photobiological Assessment

**Current Solar UV Index:** **${uv.index}** (*${uv.category}*)  
**Estimated Skin Erythema (Burn) Time:** **${uv.safeExposureMinutes} minutes** (Type II skin, unshaded)  
**Peak Solar Flux Window:** **${uv.peakTime}**

#### 🛡️ Photoprotection Guidance:
At UV Index **${uv.index}**, solar ultraviolet radiation (both UVA and UVB) induces direct cellular DNA photo-dimerization and accelerates oxidative skin damage. Broad-spectrum SPF 50+ protection is strongly recommended for any outdoor activity lasting > 15 minutes.`,
        riskScore: Math.round(uv.index * 9),
        riskLevel: uv.index > 8 ? 'SEVERE' : 'MODERATE',
        recommendations: [
          'Apply broad-spectrum SPF 50+ sunscreen 15 minutes prior to sun exposure',
          'Wear UV400 rated polarized sunglasses to shield retinas from corneal photokeratitis',
          'Seek shade under broad tree canopies or UV-resistant umbrellas'
        ],
        citations: ['WHO Global Solar UV Index Practical Guide', 'International Commission on Non-Ionizing Radiation Protection (ICNIRP)'],
        actions: [
          { label: 'View UV Safe Exposure Timer', action: 'health-insights' }
        ]
      };
    }
  }
];

export function queryAIEngine(
  prompt: string,
  dataset: LocationDataset,
  persona: PersonaProfile
): {
  text: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  recommendations: string[];
  citations: string[];
  actions: { label: string; action: string }[];
} {
  const lower = prompt.toLowerCase();
  
  for (const template of AI_KNOWLEDGE_BASE) {
    if (template.queryKeywords.some(k => lower.includes(k))) {
      return template.generateResponse(dataset, persona);
    }
  }

  // General synthesized response
  return {
    text: `### 🤖 ClimateShield AI Synthesized Intelligence

**Location Analyzed:** ${dataset.location.city}, ${dataset.location.country}  
**Overall Risk Index:** **${dataset.location.riskScore} / 100** (${dataset.location.riskLevel})  
**Active Profile:** ${persona.label}

You asked: *"${prompt}"*

Based on real-time satellite telemetry from **Copernicus Sentinel-5P** and ground sensor grids (**OpenAQ / CPCB**), current ambient conditions indicate an apparent temperature of **${dataset.metrics.temperature.feelsLike}°C** with an AQI of **${dataset.metrics.airQuality.aqi}** and PM2.5 of **${dataset.metrics.airQuality.pm25} µg/m³**.

#### 🎯 Strategic Takeaways:
- **Primary Driver:** ${dataset.riskDrivers[0]?.factor || 'Elevated Thermal & Particulate Load'} accounts for the largest fraction of environmental strain.
- **Adaptive Measures:** Maintain targeted hydration, schedule outdoor sessions during dawn/dusk windows, and configure automated threshold alerts.`,
    riskScore: dataset.location.riskScore,
    riskLevel: dataset.location.riskLevel,
    recommendations: [
      'Follow real-time hourly forecast timeline on the dashboard',
      'Wear protective gear (N95 or SPF 50+) tailored to current primary hazard',
      'Check back during forecast shifts (+3h, +6h)'
    ],
    citations: ['ClimateShield Unified Environmental Model', 'Copernicus Atmosphere Monitoring Service (CAMS)', 'NASA MODIS Near-Real-Time Data'],
    actions: [
      { label: 'Explore Interactive Map', action: 'climate-map' },
      { label: 'View Health Recommendations', action: 'health-insights' }
    ]
  };
}
