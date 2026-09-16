import React, { useState } from 'react';
import {
  Layers,
  Activity,
  AlertTriangle,
  UserCheck,
  Radio,
  Sparkles,
  Shield,
  Wind,
  Flame,
  Sun,
  Droplets,
  HeartPulse,
  TrendingUp,
  RefreshCw,
  Info
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { RiskGauge } from '../components/common/RiskGauge';
import { PERSONA_PROFILES } from '../data/mockLocations';
import { getRiskColor } from '../utils/formatters';

interface LiveRiskPageProps {
  setActiveTab: (tab: string) => void;
}

export const LiveRiskPage: React.FC<LiveRiskPageProps> = ({ setActiveTab }) => {
  const {
    currentDataset,
    currentLocation,
    currentMetrics,
    selectedPersona,
    setSelectedPersona,
    activeRiskScore,
    activeRiskLevel,
    isLiveFeedActive,
    setIsLiveFeedActive,
    lastUpdated,
    liveStatus,
    liveError,
    refreshLive,
    activeRiskResult,
  } = useClimate();

  const [selectedHazard, setSelectedHazard] = useState<string>('pm25');

  // Hazards are derived from the live risk drivers of the ACTIVE selected location.
  const severityLabel: Record<string, string> = {
    critical: 'CRITICAL',
    high: 'HIGH',
    moderate: 'MODERATE',
    low: 'LOW',
  };
  const hazardIcons = [Wind, Flame, Sun, Droplets];
  const hazardColors = ['text-rose-400', 'text-orange-400', 'text-yellow-400', 'text-cyan-400'];
  const hazardDetails: Record<string, string> = {
    air: 'Fine combustion particles penetrating bronchial epithelial barriers into pulmonary bloodstream.',
    thermal: 'Combined heat and humidity suppressing evaporative sweat cooling during daylight hours.',
    uv: 'Direct ultraviolet radiation accelerating cellular oxidative stress and erythema risk.',
    wind: 'Low airflow trapping vehicular emissions and fine particulates in urban canyons.',
  };
  const driverKeyOrder = ['air', 'thermal', 'uv', 'wind'];
  const hazards = currentDataset.riskDrivers.map((driver, index) => ({
    id: driverKeyOrder[index] ?? `driver-${index}`,
    name: driver.factor,
    category: driver.severity === 'critical' ? 'Critical Exposure' : 'Environmental',
    value: driver.currentValue,
    severity: severityLabel[driver.severity] ?? 'MODERATE',
    riskContribution: `${driver.contributionPercent}%`,
    details: hazardDetails[driverKeyOrder[index]] ?? driver.impactDescription,
    icon: hazardIcons[index % hazardIcons.length],
    color: hazardColors[index % hazardColors.length],
  }));

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Live Multi-Hazard Risk Radar
              </h1>
              <p className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                <span>Real-Time Hazard Decomposition & Persona Sensitivity Calibration</span>
                <span>•</span>
                <span className="text-cyan-400">{currentLocation.city}</span>
                {activeRiskResult && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-slate-400 text-[10px]">
                    {activeRiskResult.version} · Experimental index, not an official classification
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Live Stream Controller */}
        <div className="flex items-center gap-3">
          {liveStatus === 'error' && (
            <div role="alert" className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
              <Info className="w-3.5 h-3.5" />
              <span>{liveError ?? 'Live data unavailable.'}</span>
              <button onClick={refreshLive} className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 font-bold">Retry</button>
            </div>
          )}
          {liveStatus === 'loading' && (
            <span className="text-xs font-mono text-cyan-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> SYNCING LIVE DATA…
            </span>
          )}
          <button
            onClick={() => setIsLiveFeedActive(!isLiveFeedActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-mono font-semibold transition-all ${
              isLiveFeedActive
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveFeedActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
            <span>{isLiveFeedActive ? 'LIVE TELEMETRY STREAMING' : 'STREAM PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Persona Vulnerability Matrix */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-400" />
              Dynamic Vulnerability Persona Switcher
            </h3>
            <p className="text-xs text-slate-400">
              Select a physiological profile to dynamically scale mathematical risk weights and protective protocols.
            </p>
          </div>
          <div className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-500/30">
            Active Multiplier: {selectedPersona.vulnerabilityFactor}x
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PERSONA_PROFILES.map((p) => {
            const isSelected = selectedPersona.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900/90'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-white mb-0.5">{p.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{p.label}</div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-cyan-400">Factor: {p.vulnerabilityFactor}x</span>
                  <span className="text-[10px] font-mono text-slate-400">&lt;{p.recommendedMaxExposureMins}m</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Persona Adaptive Guidance */}
        <div className="mt-6 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              Tailored Guidance for {selectedPersona.label}:
            </span>
            <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
              {selectedPersona.customAdvice.map((adv, idx) => (
                <li key={idx}>{adv}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setActiveTab('health-insights')}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-semibold text-xs shrink-0 self-start md:self-center"
          >
            Open Health Action Plan →
          </button>
        </div>
      </GlassCard>

      {/* Real-Time Hazard Radar & Decomposed Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Hazard List */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Active Hazards Decomposed ({hazards.length})
          </h3>

          {hazards.map((hazard) => {
            const Icon = hazard.icon;
            const isSelected = selectedHazard === hazard.id;

            return (
              <div
                key={hazard.id}
                onClick={() => setSelectedHazard(hazard.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-slate-800 border border-slate-700 ${hazard.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{hazard.name}</h4>
                      <span className="text-[11px] font-mono text-slate-400">{hazard.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-cyan-300">{hazard.riskContribution} Impact</div>
                    <Badge variant="risk" riskLevel={hazard.severity as any} size="sm">
                      {hazard.severity}
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-slate-300 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span>{hazard.details}</span>
                  <span className="font-mono text-cyan-400 font-semibold shrink-0 ml-2">{hazard.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Real-time Live Sensor Stream Simulator */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Live In-Situ Telemetry Feed</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Open-Meteo AQ Station (US AQI):</span>
                  <span className="text-rose-400 font-bold">{currentMetrics.airQuality.aqi} AQI</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Optical Particle Sizer (PM2.5):</span>
                  <span className="text-amber-400 font-bold">{currentMetrics.airQuality.pm25} µg/m³</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Ambient Temperature:</span>
                  <span className="text-white font-bold">{currentMetrics.temperature.current}°C</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Solar Radiometer (UV):</span>
                  <span className="text-yellow-400 font-bold">{currentMetrics.uv.index} UVI</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Anemometer (Wind):</span>
                  <span className="text-teal-400 font-bold">{currentMetrics.wind.speedKmh} km/h</span>
                </div>
              </div>
            </div>

            {/* Anomaly Detection Status Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0c1630] border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-white">AI Anomaly Detection Flag:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Atmospheric boundary layer height dropped to 420m, restricting horizontal particulate dispersion. Expect elevated stagnation until late afternoon convective heating.
              </p>
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};
