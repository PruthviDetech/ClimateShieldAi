import React, { useState } from 'react';
import {
  HeartPulse,
  Thermometer,
  ShieldAlert,
  Sun,
  Droplets,
  Activity,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ChevronRight,
  Flame,
  Wind
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { PERSONA_PROFILES } from '../data/mockLocations';

export const HealthInsightsPage: React.FC = () => {
  const { currentDataset, currentLocation, currentMetrics, selectedPersona, setSelectedPersona, activeRiskScore, activeRiskLevel } = useClimate();
  const [activityIntensity, setActivityIntensity] = useState<'Rest' | 'Moderate Walking' | 'Intense Cardio'>('Moderate Walking');

  const health = currentDataset.healthImpact;

  // Hydration calculator based on activity
  const baseWater = health.dehydrationRisk.recommendedWaterLiters;
  const activityMultiplier = activityIntensity === 'Rest' ? 0.8 : activityIntensity === 'Intense Cardio' ? 1.4 : 1.0;
  const targetHydration = (baseWater * activityMultiplier).toFixed(1);

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <HeartPulse className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Health & Biometeorology Insights
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Environmental Epidemiology, Lung Infiltration & Thermal Stress Modeling</span>
                <span>•</span>
                <span className="text-cyan-400">{currentLocation.city}</span>
              </p>
            </div>
          </div>
        </div>

        <Badge riskLevel={activeRiskLevel} size="lg">
          {activeRiskScore}/100 {activeRiskLevel} RISK
        </Badge>
      </div>

      {/* Mandatory Medical Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300 font-bold uppercase tracking-wider font-mono mr-1">
            Clinical Disclaimer:
          </strong>
          This platform provides general environmental awareness and does not provide medical diagnosis. If experiencing acute respiratory tightness, heat exhaustion, or cardiovascular distress, contact emergency healthcare immediately.
        </div>
      </div>

      {/* 5 CORE HEALTH IMPACT VECTORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Heat Stress & Wet-Bulb Globe Temp */}
        <GlassCard glow="amber" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-amber-400 font-bold">WBGT: {health.heatStress.wbgt}°C</span>
              <div className="text-xs text-slate-400">Score: {health.heatStress.score}/100</div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Heat Stress & Hyperthermia</h3>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">{health.heatStress.status}</p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            At {currentMetrics.temperature.feelsLike}°C apparent temperature and {currentMetrics.humidity.percentage}% humidity, sweat evaporative capacity is severely reduced. Time-to-exhaustion without cooling breaks is ~{health.heatStress.exhaustionThresholdHours} hours.
          </p>

          <div className="pt-2 border-t border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Warning Signs:</span>
            <div className="flex flex-wrap gap-1.5">
              {health.heatStress.symptoms.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 2. Respiratory Stress & PM2.5 Alveolar Infiltration */}
        <GlassCard glow="rose" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-rose-400 font-bold">Infiltration: {health.respiratoryStress.pm25AlveolarInfiltration}%</span>
              <div className="text-xs text-slate-400">Score: {health.respiratoryStress.score}/100</div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Respiratory & Lung Infiltration</h3>
            <p className="text-xs text-rose-300 font-semibold mt-0.5">{health.respiratoryStress.status}</p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            PM2.5 micro-particles at {currentMetrics.airQuality.pm25} µg/m³ penetrate deep into the lower alveolar sacs, triggering oxidative inflammation and airway hyper-responsiveness.
          </p>

          <div className="pt-2 border-t border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Common Symptoms:</span>
            <div className="flex flex-wrap gap-1.5">
              {health.respiratoryStress.symptoms.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 3. Solar UV & Erythema Burn Timer */}
        <GlassCard glow="cyan" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              <Sun className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-yellow-400 font-bold">Burn Time: ~{health.uvExposure.burnTimeMinutes}m</span>
              <div className="text-xs text-slate-400">Score: {health.uvExposure.score}/100</div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Solar UV Radiation & Burn Timer</h3>
            <p className="text-xs text-yellow-300 font-semibold mt-0.5">{health.uvExposure.status}</p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Solar UV Index is {currentMetrics.uv.index} ({currentMetrics.uv.category}). Unshaded direct sunlight causes DNA photo-dimerization and cutaneous erythema in less than {health.uvExposure.burnTimeMinutes} minutes.
          </p>

          <div className="pt-2 border-t border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Recommended Protection:</span>
            <p className="text-xs text-slate-300">
              Broad-spectrum SPF 50+ mineral sunscreen, UV400 sunglasses, and wide-brim headwear.
            </p>
          </div>
        </GlassCard>

      </div>

      {/* SMART HYDRATION ADVISOR & SAFE OUTDOOR ACTIVITY PLANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Hydration Calculator */}
        <div className="lg:col-span-6">
          <GlassCard className="p-6 space-y-4 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Smart Hydration Advisor</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                Electrolytes: {health.dehydrationRisk.electrolyteNeed}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Calculates physiological fluid requirement calibrated for ambient temperature ({currentMetrics.temperature.current}°C), relative humidity ({currentMetrics.humidity.percentage}%), and metabolic workload.
            </p>

            {/* Intensity Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase">Select Activity Workload:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Rest', 'Moderate Walking', 'Intense Cardio'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActivityIntensity(mode)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      activityIntensity === mode
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Output */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Target Daily Fluid Intake</span>
                <div className="text-2xl font-black font-mono text-white">
                  {targetHydration} <span className="text-sm font-normal text-slate-400">Liters / Day</span>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-300">
                <span>Includes 500ml sodium/potassium electrolyte replenishment.</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Safe Outdoor Activity Window */}
        <div className="lg:col-span-6">
          <GlassCard className="p-6 space-y-4 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Outdoor Activity Risk Planner</h3>
              </div>
              <Badge riskLevel="MODERATE" size="sm">
                Schedule Optimizer
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Optimal Safe Activity Windows:
                  </span>
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    {health.outdoorActivityRisk.safeWindow}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Thermal stress and surface photochemical ozone reach daily minimums.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    High-Hazard Prohibited Windows:
                  </span>
                  <span className="font-mono text-xs text-rose-400 font-bold">
                    {health.outdoorActivityRisk.avoidWindow}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Peak solar UV irradiance and apparent heat index exceed metabolic safety limits.
                </p>
              </div>

              <p className="text-xs text-slate-300 italic pt-1">
                Recommendation: {health.outdoorActivityRisk.intensityRecommendation}
              </p>
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};
