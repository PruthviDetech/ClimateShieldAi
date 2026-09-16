import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Thermometer,
  Wind,
  Sun,
  Droplets,
  CloudRain,
  Activity,
  HeartPulse,
  ShieldAlert,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Siren,
  Layers,
  UserCheck,
  ArrowUpRight,
  Download,
  Share2,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceDot,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useClimate } from '../context/ClimateContext';
import { RiskGauge } from '../components/common/RiskGauge';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { LocationSearchPanel } from '../components/common/LocationSearchPanel';
import { LiveEnvironmentalData } from '../components/common/LiveEnvironmentalData';
import { UserProfilePanel } from '../components/common/UserProfilePanel';
import { formatTemp, getAQICategory, getRiskColor } from '../utils/formatters';
import { Flame } from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onOpenLocationModal: () => void;
  onOpenExportModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setActiveTab,
  onOpenLocationModal,
  onOpenExportModal,
}) => {
  const {
    currentDataset,
    currentLocation,
    currentMetrics,
    selectedPersona,
    detectLocation,
    isDetectingLocation,
    tempUnit,
    setTempUnit,
    activeRiskScore,
    activeRiskLevel,
    lastUpdated,
    liveStatus,
    liveError,
    refreshLive,
    activeRiskResult,
    peakRiskSummary,
    earlyWarnings,
  } = useClimate();

  const [selectedDriverIndex, setSelectedDriverIndex] = useState<number | null>(null);
  const [selectedHourIdx, setSelectedHourIdx] = useState<number | null>(null);

  const topDriver = currentDataset.riskDrivers[0];
  const secondDriver = currentDataset.riskDrivers[1];

  // Step 7: the highest-risk hour in the upcoming 24h window (live, personalized).
  const hourly = currentDataset.hourlyForecast;
  const peakHour = hourly.length > 0 ? hourly.reduce((a, b) => (b.riskScore > a.riskScore ? b : a)) : null;
  const selectedHour = selectedHourIdx !== null ? hourly[selectedHourIdx] ?? null : null;

  // Hourly chart data transformation (interactive: click a point to inspect the hour)
  const hourlyData = hourly.map((h, i) => ({
    idx: i,
    time: h.time,
    riskScore: h.riskScore,
    temp: h.temp,
    feelsLike: h.feelsLike,
    aqi: h.aqi,
    pm25: h.pm25,
    humidity: h.humidity,
    topFactor: h.topFactor,
    isPeak: peakHour !== null && h.time === peakHour.time,
  }));

  const aqiInfo = getAQICategory(currentMetrics.airQuality.aqi);

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* 1. TOP HEADER & LOCATION SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Climate Intelligence
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Real-Time Planetary & Health Telemetry</span>
                <span>•</span>
                <span className="text-cyan-400">Station ID: CS-{currentLocation.id.toUpperCase()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Location & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-white">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {currentLocation.city}, {currentLocation.state ? `${currentLocation.state}, ` : ''}{currentLocation.country}
            </span>
          </div>

          <button
            onClick={() => detectLocation()}
            disabled={isDetectingLocation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-sm group"
          >
            <Navigation className={`w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>{isDetectingLocation ? 'Locating...' : 'Detect My Location'}</span>
          </button>

          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Location</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Export Report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <LocationSearchPanel />

      <UserProfilePanel />

      {/* Live data pipeline status banner */}
      {liveStatus === 'loading' && (
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2 text-xs font-mono text-cyan-300">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>FETCHING LIVE ENVIRONMENTAL DATA FOR {currentLocation.city.toUpperCase()}…</span>
        </div>
      )}
      {liveStatus === 'error' && (
        <div role="alert" className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-wrap items-center gap-2 text-xs text-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{liveError ?? 'Live environmental data is unavailable right now.'}</span>
          <button onClick={refreshLive} className="ml-auto px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 font-bold transition-colors">
            Retry
          </button>
        </div>
      )}

      <LiveEnvironmentalData />

      {/* 2. PRIMARY HERO RISK CARD (Pune 72 / 100 HIGH) */}
      <div className="rounded-3xl glass-panel-glow bg-gradient-to-br from-[#0a132d]/90 via-[#070d1e]/90 to-[#040815]/90 border border-cyan-500/30 p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Large Gauge Highlight */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 border-b lg:border-b-0 lg:border-r border-slate-800/80">
            <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              CLIMATESHIELD RISK INDEX
            </div>
            
            <RiskGauge
              score={activeRiskScore}
              level={activeRiskLevel}
              size="lg"
              delta={4}
              sublabel="Composite Multi-Hazard Environmental Index"
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge riskLevel={activeRiskLevel} size="md">
                {activeRiskLevel} RISK
              </Badge>
              <span className="text-[11px] text-slate-400 font-mono">
                Persona: <strong className="text-teal-300">{selectedPersona.name}</strong>
              </span>
              {activeRiskResult && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-slate-400">
                  {activeRiskResult.version} · Experimental
                </span>
              )}
            </div>

            {/* "Why is my risk high/low?" — transparent narrative from the CSRI engine */}
            {activeRiskResult && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    Why is my risk {activeRiskResult.score >= 60 ? 'high' : activeRiskResult.score >= 40 ? 'moderate' : 'low'}?
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{activeRiskResult.narrative}</p>
                {activeRiskResult.profileDelta !== 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300">
                      General population: {activeRiskResult.baselineScore}/100
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${
                        activeRiskResult.profileDelta > 0
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      }`}
                    >
                      Your profile: {activeRiskResult.profileDelta > 0 ? '+' : ''}{activeRiskResult.profileDelta} pts
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-800 pt-2">
                  The ClimateShield Risk Index is an <strong className="text-slate-400">experimental environmental index</strong> computed live from Open-Meteo telemetry. It is not an official medical, governmental, or air-quality agency classification.
                </p>
              </div>
            )}
          </div>

          {/* Right: Key Drivers & Immediate Summary */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Primary Environmental Stressors in {currentLocation.city}
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated using Copernicus Sentinel-5P, NOAA GFS, and CPCB Ground Station Feeds.
                </p>
              </div>

              {/* Temp unit toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setTempUnit('C')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${tempUnit === 'C' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500'}`}
                >
                  °C
                </button>
                <button
                  onClick={() => setTempUnit('F')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${tempUnit === 'F' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500'}`}
                >
                  °F
                </button>
              </div>
            </div>

            {/* Risk Contribution Breakdown Bars */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Top contributing factors (live weights):</span>
                <span className="font-mono text-cyan-400 text-[11px]">{activeRiskResult ? `${activeRiskResult.version} · Weights sum 100%` : 'Weights sum 100%'}</span>
              </div>

              {currentDataset.riskDrivers.map((driver, index) => {
                const isSelected = selectedDriverIndex === index;
                const barColor =
                  driver.severity === 'critical'
                    ? 'bg-rose-500'
                    : driver.severity === 'high'
                    ? 'bg-orange-500'
                    : 'bg-cyan-500';

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDriverIndex(isSelected ? null : index)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900/90 border-cyan-400/50 shadow-md'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${barColor}`} />
                        {driver.factor}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400">{driver.currentValue}</span>
                        <span className="font-bold text-cyan-300">{driver.contributionPercent}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-1000`}
                        style={{ width: `${driver.contributionPercent * 2}%` }}
                      />
                    </div>

                    {/* Expanded Detail */}
                    {isSelected && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex justify-between items-center">
                        <span>{driver.impactDescription}</span>
                        <span className="font-mono text-slate-400 text-[10px] shrink-0 ml-2">
                          Threshold: {driver.safeThreshold}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>

      {/* 3. 7 CORE ENVIRONMENTAL METRICS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Live Environmental Parameters
            </h2>
            <p className="text-xs text-slate-400">
              Validated real-time measurements in {currentLocation.city}.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          
          {/* 1. Temperature */}
          <GlassCard glow="cyan" hoverEffect onClick={() => setActiveTab('health-insights')} className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase font-mono">Temperature</span>
              <Thermometer className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {formatTemp(currentMetrics.temperature.current, tempUnit)}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Feels like <strong className="text-amber-300">{formatTemp(currentMetrics.temperature.feelsLike, tempUnit)}</strong>
            </div>
            <div className="mt-2 text-[10px] font-mono text-cyan-400">
              WBGT: {currentMetrics.wetBulb.tempC}°C
            </div>
          </GlassCard>

          {/* 2. Air Quality (AQI) */}
          <GlassCard glow="amber" hoverEffect onClick={() => setActiveTab('health-insights')} className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase font-mono">AQI Index</span>
              <Wind className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {currentMetrics.airQuality.aqi}
            </div>
            <div className={`mt-1 text-[11px] font-semibold ${aqiInfo.colorClass}`}>
              {aqiInfo.label}
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              NO2: {currentMetrics.airQuality.no2} ppb
            </div>
          </GlassCard>

          {/* 3. PM2.5 Micro-Particulate */}
          <GlassCard glow="rose" hoverEffect onClick={() => setActiveTab('health-insights')} className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase font-mono">PM2.5</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {currentMetrics.airQuality.pm25}
              <span className="text-xs font-normal text-slate-400 ml-1">µg/m³</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-rose-400">
              PM10: {currentMetrics.airQuality.pm10}
            </div>
          </GlassCard>

          {/* 4. Humidity */}
          <GlassCard hoverEffect onClick={() => setActiveTab('health-insights')} className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase font-mono">Humidity</span>
              <Droplets className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {currentMetrics.humidity.percentage}%
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              {currentMetrics.humidity.comfortLevel}
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              Dew: {currentMetrics.humidity.dewPoint}°C
            </div>
          </GlassCard>

          {/* 5. UV Index */}
          <GlassCard glow="cyan" hoverEffect onClick={() => setActiveTab('health-insights')} className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase font-mono">UV Index</span>
              <Sun className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {currentMetrics.uv.index}
            </div>
            <div className="mt-1 text-[11px] text-amber-300 font-semibold">
              {currentMetrics.uv.category}
            </div>
            <div className="mt-2 text-[10px] font-mono text-rose-400">
              Burn: ~{currentMetrics.uv.safeExposureMinutes}m
            </div>
          </GlassCard>

          {/* 6. Wind & Dispersion */}
          <GlassCard hoverEffect onClick={() => setActiveTab('climate-map')} className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase font-mono">Wind Speed</span>
              <Wind className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {currentMetrics.wind.speedKmh}
              <span className="text-xs font-normal text-slate-400 ml-1">km/h</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              Dir: {currentMetrics.wind.direction} ({currentMetrics.wind.degrees}°)
            </div>
            <div className="mt-2 text-[10px] font-mono text-amber-400">
              Dispersion: {currentMetrics.wind.dispersionCapacity}
            </div>
          </GlassCard>

          {/* 7. Rain Probability */}
          <GlassCard hoverEffect onClick={() => setActiveTab('forecast')} className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase font-mono">Precipitation</span>
              <CloudRain className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {currentMetrics.rain.probability}%
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              Vol: {currentMetrics.rain.volumeMm} mm
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">
              {currentMetrics.rain.forecast}
            </div>
          </GlassCard>

        </div>
      </div>

      {/* 3.5 EARLY WARNING STRIP (Step 8 — live forecast-derived, compact) */}
      {liveStatus === 'success' && earlyWarnings.length > 0 && (
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300">
                <Siren className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-white">
                  {earlyWarnings.length} early-warning window{earlyWarnings.length === 1 ? '' : 's'} in the next 24h
                </span>
                <span className="text-slate-400 font-mono hidden sm:inline">
                  {' '}— next: {earlyWarnings[0].windowLabel} · {earlyWarnings[0].level}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              View Full Outlook <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* 4. HOURLY RISK & ENVIRONMENTAL TRAJECTORY (24-Hour Timeline Chart) */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              24-Hour Climate Health Risk Forecast
            </h3>
            <p className="text-xs text-slate-400">
              Hour-by-hour experimental environmental risk index for {currentLocation.city} — click any point to inspect that hour.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400/80"></span> Risk Index (0-100)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400/80"></span> Feels Like (°C)
            </span>
          </div>
        </div>

        {/* Peak-risk explanation (live, personalized, non-medical) */}
        {liveStatus === 'success' && peakRiskSummary && (
          <div className="mb-4 flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">{peakRiskSummary}</span>
            <span className="ml-auto text-[10px] font-mono text-amber-400/70">
              Experimental environmental risk forecast — not a medical prediction.
            </span>
          </div>
        )}

        {liveStatus !== 'success' ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs font-mono text-slate-400">
            {liveStatus === 'error' ? (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>24-hour forecast unavailable — {liveError ?? 'live data error'}.</span>
                <button onClick={refreshLive} className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 font-bold transition-colors">
                  Retry
                </button>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span>FETCHING 24-HOUR LIVE FORECAST FOR {currentLocation.city.toUpperCase()}…</span>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={hourlyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={(state: any) => {
                    const idx = state?.activeTooltipIndex;
                    if (typeof idx === 'number') setSelectedHourIdx(idx === selectedHourIdx ? null : idx);
                  }}
                >
                  <defs>
                    <linearGradient id="riskAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="tempAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  {peakHour && (
                    <>
                      <ReferenceArea
                        x1={peakHour.time}
                        x2={peakHour.time}
                        fill="#F59E0B"
                        fillOpacity={0.12}
                        stroke="#F59E0B"
                        strokeOpacity={0.45}
                        strokeDasharray="4 4"
                        ifOverflow="extendDomain"
                      />
                      <ReferenceDot
                        x={peakHour.time}
                        y={peakHour.riskScore}
                        r={6}
                        fill="#F59E0B"
                        stroke="#0B132B"
                        strokeWidth={2}
                        isFront
                        ifOverflow="extendDomain"
                      />
                    </>
                  )}
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(11, 19, 43, 0.95)',
                      borderColor: 'rgba(6, 182, 212, 0.4)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="riskScore"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#riskAreaGradient)"
                    name="Risk Index"
                    activeDot={{ r: 6, cursor: 'pointer' }}
                    dot={{ r: 2, strokeWidth: 0, fill: '#22D3EE' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="feelsLike"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#tempAreaGradient)"
                    name="Feels Like (°C)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Peak period flag (explicit requirement: highlight the highest-risk period) */}
            {peakHour && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Peak risk: {peakHour.time}
                </span>
                <span className="text-slate-400 font-mono">
                  index {peakHour.riskScore}/100 · {peakHour.riskLevel} · feels like {peakHour.feelsLike}°C · AQI {peakHour.aqi} · top factor: {peakHour.topFactor ?? 'composite'}
                </span>
              </div>
            )}

            {/* Selected-hour inspector (interactive chart companion) */}
            {selectedHour && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-700/60">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" /> {selectedHour.time}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${getRiskColor(selectedHour.riskLevel).bg} ${getRiskColor(selectedHour.riskLevel).text} ${getRiskColor(selectedHour.riskLevel).border}`}
                  >
                    {selectedHour.riskLevel} · {selectedHour.riskScore}/100
                  </span>
                  <button
                    onClick={() => setSelectedHourIdx(null)}
                    className="ml-auto text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  {[
                    { label: 'Temperature', value: `${selectedHour.temp}°C` },
                    { label: 'Feels Like', value: `${selectedHour.feelsLike}°C` },
                    { label: 'PM2.5', value: `${selectedHour.pm25} µg/m³` },
                    { label: 'US AQI', value: `${selectedHour.aqi}` },
                    { label: 'UV Index', value: `${selectedHour.uv}` },
                    { label: 'Rain Chance', value: `${selectedHour.rainProb}%` },
                  ].map((cell) => (
                    <div key={cell.label} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-mono">{cell.label}</div>
                      <div className="text-sm font-bold text-white mt-0.5">{cell.value}</div>
                    </div>
                  ))}
                </div>
                {selectedHour.topFactor && (
                  <div className="mt-3 text-xs text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Major contributing factor this hour: <span className="font-semibold text-white">{selectedHour.topFactor}</span>
                      {peakHour && selectedHour.time === peakHour.time ? ' — this is the highest-risk period of the next 24 hours.' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* 5. HEALTH RISK IMPACT & TODAY'S RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Health Risks Breakdown (Heat, Respiratory, UV, Dehydration, Outdoor Activity) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-400" />
              Biometeorology & Health Risks
            </h3>
            <button
              onClick={() => setActiveTab('health-insights')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Full Health Suite</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: `Heat Stress (WBGT ${currentMetrics.wetBulb.tempC}°C)`,
                desc: 'Evaporative cooling efficiency and metabolic strain from current heat and humidity.',
                score: currentDataset.healthImpact.heatStress.score,
                status: currentDataset.healthImpact.heatStress.status,
                color: 'text-amber-400',
              },
              {
                title: `Respiratory Stress (PM2.5 ${currentMetrics.airQuality.pm25} µg/m³)`,
                desc: `Deep alveolar infiltration risk — AQI ${currentMetrics.airQuality.aqi} (${currentMetrics.airQuality.category}).`,
                score: currentDataset.healthImpact.respiratoryStress.score,
                status: currentDataset.healthImpact.respiratoryStress.status,
                color: 'text-rose-400',
              },
              {
                title: `UV Solar Radiation (Index ${currentMetrics.uv.index})`,
                desc: `Erythema skin burn time is ~${currentDataset.healthImpact.uvExposure.burnTimeMinutes} minutes of unshaded direct sunlight.`,
                score: currentDataset.healthImpact.uvExposure.score,
                status: currentDataset.healthImpact.uvExposure.status,
                color: 'text-yellow-400',
              },
              {
                title: 'Dehydration Risk',
                desc: `Daily baseline intake of ${currentDataset.healthImpact.dehydrationRisk.recommendedWaterLiters}L fluid recommended today.`,
                score: currentDataset.healthImpact.dehydrationRisk.score,
                status: currentDataset.healthImpact.dehydrationRisk.status,
                color: 'text-cyan-400',
              },
              {
                title: 'Outdoor Activity Risk',
                desc: `Safe window: ${currentDataset.healthImpact.outdoorActivityRisk.safeWindow}. Avoid: ${currentDataset.healthImpact.outdoorActivityRisk.avoidWindow}.`,
                score: currentDataset.healthImpact.outdoorActivityRisk.score,
                status: currentDataset.healthImpact.outdoorActivityRisk.status,
                color: 'text-orange-400',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{item.title}</span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-slate-800 ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                </div>
                <div className="font-mono font-black text-sm text-right shrink-0">
                  <span className={item.color}>{item.score}</span>
                  <span className="text-slate-500 text-xs">/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Today's Recommendations */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Today's Recommendations
            </h3>
            <Badge riskLevel={activeRiskLevel} size="sm">
              Adaptive Protocol
            </Badge>
          </div>

          <div className="space-y-3">
            {currentDataset.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-900/90 to-[#071026]/90 space-y-2 hover:border-cyan-400/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {rec.category}
                    </span>
                    <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {rec.timeframe}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>

          {/* Profile-personalized recommendations (Step 6) */}
          {activeRiskResult && activeRiskResult.personalRecommendations.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  For Your Profile
                </h4>
                <span className="text-[10px] font-mono text-slate-500">personalized, non-medical</span>
              </div>
              {activeRiskResult.personalRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl glass-panel space-y-1.5 border transition-all ${
                    rec.priority === 'high'
                      ? 'border-teal-500/30 bg-gradient-to-r from-teal-950/40 to-[#071026]/90'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-white">{rec.title}</h5>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                        rec.priority === 'high'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{rec.description}</p>
                  <span className="text-[10px] font-mono text-slate-500">triggered by: {rec.source}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mandatory Medical Disclaimer Notice Card */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mt-4">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 font-semibold">Important Medical Notice:</strong> This platform provides general environmental awareness and does not provide medical diagnosis.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
