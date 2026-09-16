import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  FlaskConical,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  CloudRain,
  Gauge,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { GlassCard } from '../components/common/GlassCard';
import { getRiskColor } from '../utils/formatters';
import {
  runWhatIf,
  SCENARIO_PRESETS,
  describeOverrides,
  setActiveSimulation,
  WhatIfOverrides,
} from '../utils/whatIfSimulator';

const DEFAULT_OVERRIDES: WhatIfOverrides = {
  tempDelta: 0,
  pm25: null,
  humidity: null,
  uvIndex: null,
  windKmh: null,
  rainProbability: null,
};

interface SliderDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  absValue: string;
  onChange: (v: number) => void;
}

export const WhatIfSimulatorPage: React.FC = () => {
  const {
    currentMetrics,
    currentLocation,
    userProfile,
    liveStatus,
    liveError,
    refreshLive,
  } = useClimate();

  const [overrides, setOverrides] = useState<WhatIfOverrides>(DEFAULT_OVERRIDES);
  const [pm25Multiplier, setPm25Multiplier] = useState<number>(1);
  const [activeScenario, setActiveScenario] = useState<string>('reset');

  // Start every location (or live refresh) from that location's real conditions.
  useEffect(() => {
    setOverrides(DEFAULT_OVERRIDES);
    setPm25Multiplier(1);
    setActiveScenario('reset');
  }, [currentLocation.id]);

  const result = useMemo(
    () => runWhatIf(currentMetrics, overrides, userProfile, pm25Multiplier),
    [currentMetrics, overrides, userProfile, pm25Multiplier],
  );

  // Publish the running scenario for the AI assistant (Step 10). Cleared when
  // the user resets to live conditions.
  useEffect(() => {
    if (activeScenario === 'reset') {
      setActiveSimulation(null);
    } else {
      setActiveSimulation({
        scenarioLabel: activeScenario === 'custom' ? 'Custom adjustments' : SCENARIO_PRESETS.find((s) => s.id === activeScenario)?.label ?? 'Scenario',
        overridesSummary: describeOverrides(overrides, pm25Multiplier),
        result,
      });
    }
  }, [activeScenario, result, overrides, pm25Multiplier]);

  const setOv = <K extends keyof WhatIfOverrides>(key: K, value: WhatIfOverrides[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
    setActiveScenario('custom');
  };

  const applyScenario = (id: string) => {
    const preset = SCENARIO_PRESETS.find((s) => s.id === id);
    if (!preset) return;
    setOverrides({ ...DEFAULT_OVERRIDES, ...preset.overrides });
    setPm25Multiplier(preset.pm25Multiplier ?? 1);
    setActiveScenario(id);
  };

  const resetAll = () => {
    setOverrides(DEFAULT_OVERRIDES);
    setPm25Multiplier(1);
    setActiveScenario('reset');
  };

  const setPm25Abs = (v: number) => {
    setPm25Multiplier(1);
    setOv('pm25', v);
  };

  const chips = describeOverrides(overrides, pm25Multiplier);
  const beforeColors = getRiskColor(result.before.level);
  const afterColors = getRiskColor(result.after.level);
  const isLiveState = activeScenario === 'reset';

  const DeltaIcon =
    result.direction === 'RISE' ? TrendingUp : result.direction === 'FALL' ? TrendingDown : Minus;

  const sliders: SliderDef[] = [
    {
      key: 'tempDelta',
      label: 'Temperature',
      icon: <Thermometer className="w-3.5 h-3.5" />,
      min: -10,
      max: 15,
      step: 1,
      value: overrides.tempDelta,
      display: `${overrides.tempDelta > 0 ? '+' : ''}${overrides.tempDelta}°C vs live`,
      absValue: `${(currentMetrics.temperature.current + overrides.tempDelta).toFixed(1)}°C resulting`,
      onChange: (v) => setOv('tempDelta', v),
    },
    {
      key: 'pm25',
      label: 'PM2.5',
      icon: <Gauge className="w-3.5 h-3.5" />,
      min: 0,
      max: 350,
      step: 1,
      value: overrides.pm25 ?? currentMetrics.airQuality.pm25,
      display:
        overrides.pm25 !== null
          ? `${overrides.pm25} µg/m³`
          : pm25Multiplier !== 1
          ? `${pm25Multiplier}× live`
          : 'Live value',
      absValue: `${currentMetrics.airQuality.pm25} µg/m³ live`,
      onChange: setPm25Abs,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      icon: <Droplets className="w-3.5 h-3.5" />,
      min: 0,
      max: 100,
      step: 1,
      value: overrides.humidity ?? currentMetrics.humidity.percentage,
      display: overrides.humidity !== null ? `${overrides.humidity}%` : 'Live value',
      absValue: `${currentMetrics.humidity.percentage}% live`,
      onChange: (v) => setOv('humidity', v),
    },
    {
      key: 'uvIndex',
      label: 'UV Index',
      icon: <Sun className="w-3.5 h-3.5" />,
      min: 0,
      max: 13,
      step: 0.5,
      value: overrides.uvIndex ?? currentMetrics.uv.index,
      display: overrides.uvIndex !== null ? `${overrides.uvIndex}` : 'Live value',
      absValue: `${currentMetrics.uv.index} live`,
      onChange: (v) => setOv('uvIndex', v),
    },
    {
      key: 'windKmh',
      label: 'Wind',
      icon: <Wind className="w-3.5 h-3.5" />,
      min: 0,
      max: 80,
      step: 1,
      value: overrides.windKmh ?? currentMetrics.wind.speedKmh,
      display: overrides.windKmh !== null ? `${overrides.windKmh} km/h` : 'Live value',
      absValue: `${currentMetrics.wind.speedKmh} km/h live`,
      onChange: (v) => setOv('windKmh', v),
    },
    {
      key: 'rainProbability',
      label: 'Precipitation',
      icon: <CloudRain className="w-3.5 h-3.5" />,
      min: 0,
      max: 100,
      step: 1,
      value: overrides.rainProbability ?? currentMetrics.rain.probability,
      display: overrides.rainProbability !== null ? `${overrides.rainProbability}%` : 'Live value',
      absValue: `${currentMetrics.rain.probability}% live`,
      onChange: (v) => setOv('rainProbability', v),
    },
  ];

  const renderSlider = (s: SliderDef) => (
    <div key={s.key} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          {s.icon} {s.label}
        </span>
        <span className="text-[11px] font-mono text-cyan-300">{s.display}</span>
        <span className="text-[10px] font-mono text-slate-500">{s.absValue}</span>
      </div>
      <input
        type="range"
        min={s.min}
        max={s.max}
        step={s.step}
        value={s.value}
        onChange={(e) => s.onChange(Number(e.target.value))}
        className="w-full accent-cyan-400 cursor-pointer"
      />
      <div className="flex justify-between text-[9px] font-mono text-slate-500">
        <span>{s.min}</span>
        <span>{s.max}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
            <FlaskConical className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              What-If Climate Simulator
            </h1>
            <p className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2 mt-0.5">
              <span>Experimental Scenario Tool</span>
              <span>•</span>
              <span className="text-fuchsia-400">{currentLocation.city}</span>
              <span>•</span>
              <span>Not a prediction or medical assessment</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-fuchsia-400">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Works on a temporary copy — live data is never modified</span>
        </div>
      </div>

      {/* Live data guard */}
      {liveStatus === 'loading' && (
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2 text-xs font-mono text-cyan-300">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>FETCHING LIVE DATA FOR {currentLocation.city.toUpperCase()}…</span>
        </div>
      )}
      {liveStatus === 'error' && (
        <div role="alert" className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-wrap items-center gap-2 text-xs text-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Simulator needs live data — {liveError ?? 'unavailable'}.</span>
          <button onClick={refreshLive} className="ml-auto px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 font-bold transition-colors">
            Retry
          </button>
        </div>
      )}

      {liveStatus === 'success' && (
        <>
          {/* Question banner */}
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
              <span className="font-bold text-white">How would the risk change if these conditions occurred?</span>
              <span className="text-slate-400 font-mono">
                Adjust the sliders or pick a scenario — the index recalculates instantly for your personal risk profile.
              </span>
            </div>
          </GlassCard>

          {/* Scenario presets */}
          <GlassCard className="p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-white">Quick Scenarios</h3>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">one click, instant recalculation</span>
              {!isLiveState && (
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Live
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {SCENARIO_PRESETS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => applyScenario(s.id)}
                  title={s.description}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    activeScenario === s.id
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/60 text-fuchsia-200'
                      : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-fuchsia-500/40 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sliders */}
            <div className="lg:col-span-7">
              <GlassCard className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Adjust Conditions</h3>
                  <span className="text-[10px] font-mono text-slate-500 ml-auto">
                    {activeScenario === 'custom' ? 'custom scenario' : 'preset scenario'}
                  </span>
                </div>
                {sliders.map(renderSlider)}
              </GlassCard>
            </div>

            {/* Results */}
            <div className="lg:col-span-5 space-y-4">
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-white mb-4">Before vs After</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-700/60">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Before (live)</div>
                    <div className={`text-4xl font-extrabold mt-1 ${beforeColors.text}`}>{result.before.score}</div>
                    <div className={`text-xs font-bold ${beforeColors.text}`}>{result.before.level}</div>
                    <div className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      Main factor: {result.before.topFactors[0]?.factor ?? '—'}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-fuchsia-500/40">
                    <div className="text-[10px] font-mono text-fuchsia-300/80 uppercase tracking-wide">After (simulated)</div>
                    <div className={`text-4xl font-extrabold mt-1 ${afterColors.text}`}>{result.after.score}</div>
                    <div className={`text-xs font-bold ${afterColors.text}`}>{result.after.level}</div>
                    <div className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      Main factor: {result.after.topFactors[0]?.factor ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Change in risk */}
                <div
                  className={`mt-3 p-3 rounded-2xl border flex items-center gap-3 ${
                    result.direction === 'RISE'
                      ? 'bg-rose-500/10 border-rose-500/40'
                      : result.direction === 'FALL'
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-800/60 border-slate-700'
                  }`}
                >
                  <DeltaIcon
                    className={`w-5 h-5 shrink-0 ${
                      result.direction === 'RISE'
                        ? 'text-rose-400'
                        : result.direction === 'FALL'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white">
                      Change in risk: {result.delta > 0 ? '+' : ''}{result.delta} points
                    </span>
                    <span className="text-slate-300">
                      {result.direction === 'RISE'
                        ? ' — risk would rise under this scenario'
                        : result.direction === 'FALL'
                        ? ' — risk would fall under this scenario'
                        : ' — no change under this scenario'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-3">{result.summary}</p>
              </GlassCard>

              {/* Component breakdown */}
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-white mb-3">Component Breakdown (before → after)</h3>
                <div className="space-y-2.5">
                  {result.components.map((c) => {
                    const up = c.after > c.before;
                    const down = c.after < c.before;
                    return (
                      <div key={c.key} className="text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-slate-300 font-semibold truncate">{c.label}</span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {c.before} →{' '}
                            <span className={up ? 'text-rose-300 font-bold' : down ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                              {c.after}
                            </span>
                            <span className="text-slate-600"> · w {(c.weight * 100).toFixed(0)}%</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-slate-500/40 rounded-full"
                            style={{ width: `${Math.min(100, c.before)}%` }}
                          />
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full ${
                              up ? 'bg-rose-500/60' : down ? 'bg-emerald-500/60' : 'bg-cyan-500/60'
                            }`}
                            style={{ width: `${Math.min(100, c.after)}%`, opacity: 0.85 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-3 text-[9px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500/40 inline-block" /> before
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/60 inline-block" /> after (rose = higher, emerald = lower)
                  </span>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Experimental disclaimer */}
          <p className="text-[10px] font-mono text-slate-500 text-center pt-2">
            ClimateShield What-If Simulator — experimental scenario exploration built on the transparent CSRI v3.0 engine and
            your personal risk profile. NOT a weather prediction, forecast, or medical assessment. Simulated conditions are
            hypothetical; your live data remains untouched.
          </p>
        </>
      )}
    </div>
  );
};
