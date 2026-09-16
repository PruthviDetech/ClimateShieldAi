import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  CloudSun,
  Sun,
  CloudRain,
  Wind,
  TrendingUp,
  AlertTriangle,
  Zap,
  Sparkles,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useClimate } from '../context/ClimateContext';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { getRiskColor, formatTemp } from '../utils/formatters';

export const ForecastPage: React.FC = () => {
  const { currentDataset, currentLocation, tempUnit } = useClimate();
  const [selectedScenarioId, setSelectedScenarioId] = useState<'baseline' | 'rcp45' | 'rcp85'>('baseline');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const activeScenario =
    currentDataset.scenarios.find((s) => s.id === selectedScenarioId) ||
    currentDataset.scenarios[0];

  const forecastDays = currentDataset.dailyForecast;
  const activeDay = forecastDays[selectedDayIndex] || forecastDays[0];

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Predictive Forecast & Climate Scenarios
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>7–14 Day Predictive Risk Ensembles & Long-Term Climate Projections</span>
                <span>•</span>
                <span className="text-cyan-400">{currentLocation.city}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Daily Forecast Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            7-Day Climate Risk Trajectory
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Click any day to view details
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecastDays.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const colors = getRiskColor(day.riskLevel);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-[1.02]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{day.day}</span>
                    <span className="text-[10px] font-mono text-slate-400">{day.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium truncate mb-2">
                    {day.condition}
                  </div>
                </div>

                <div className="my-2 flex items-center justify-between">
                  <div className="text-xl font-mono font-bold text-white">
                    {formatTemp(day.tempMax, tempUnit)}
                  </div>
                  <Badge variant="risk" riskLevel={day.riskLevel} size="sm">
                    {day.riskScore}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>AQI: {day.aqi}</span>
                  <span>Rain: {day.rainProb}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day In-Depth Intelligence Card */}
      <GlassCard glow="cyan" className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <Badge riskLevel={activeDay.riskLevel} size="md">
                {activeDay.day}, {activeDay.date} — {activeDay.riskLevel} RISK
              </Badge>
              <span className="text-xs font-mono text-cyan-400">Score: {activeDay.riskScore}/100</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              {activeDay.summary}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Forecast models show a high temperature of {formatTemp(activeDay.tempMax, tempUnit)} with projected ambient AQI at {activeDay.aqi}. Precipitation likelihood is {activeDay.rainProb}% with solar UV peak at {activeDay.uvMax}.
            </p>
          </div>

          <div className="md:col-span-4 grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Temp Range:</span>
              <div className="text-white font-bold">{formatTemp(activeDay.tempMin, tempUnit)} - {formatTemp(activeDay.tempMax, tempUnit)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Air Quality:</span>
              <div className="text-amber-400 font-bold">{activeDay.aqi} AQI</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Rain Probability:</span>
              <div className="text-cyan-400 font-bold">{activeDay.rainProb}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Peak UV Index:</span>
              <div className="text-yellow-400 font-bold">{activeDay.uvMax} UVI</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* CLIMATE SCENARIO SIMULATOR (Baseline vs RCP 4.5 vs RCP 8.5) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Climate Scenario Simulator (IPCC AR6 Projections)
            </h3>
            <p className="text-xs text-slate-400">
              Simulate future localized warming trajectories and environmental health stress for {currentLocation.city}.
            </p>
          </div>

          {/* Scenario Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
            {currentDataset.scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScenarioId(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                  selectedScenarioId === s.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <GlassCard className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                  {activeScenario.warmingDelta}
                </span>
                <span className="text-xs font-mono text-slate-400">Target Horizon: {activeScenario.targetYear}</span>
              </div>

              <h4 className="text-xl font-bold text-white leading-tight">
                {activeScenario.name}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeScenario.description}
              </p>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-white font-mono uppercase">Key Regional Impacts:</span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {activeScenario.impacts.map((impact, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{impact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Projected Stats Matrix */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-xs font-mono text-slate-400">Projected Risk Score</span>
                <div className="text-3xl font-mono font-black text-cyan-300">
                  {activeScenario.projectedRiskScore} <span className="text-sm font-normal text-slate-500">/100</span>
                </div>
                <p className="text-[11px] text-slate-400">Baseline was {currentDataset.location.riskScore}/100</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-xs font-mono text-slate-400">Extreme Heat Days / Yr</span>
                <div className="text-3xl font-mono font-black text-rose-400">
                  {activeScenario.extremeHeatDays} <span className="text-sm font-normal text-slate-500">days</span>
                </div>
                <p className="text-[11px] text-slate-400">WBGT &gt; 30°C conditions</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-xs font-mono text-slate-400">Heavy Rain Deluges</span>
                <div className="text-3xl font-mono font-black text-blue-400">
                  {activeScenario.heavyRainEvents} <span className="text-sm font-normal text-slate-500">events</span>
                </div>
                <p className="text-[11px] text-slate-400">High urban waterlogging risk</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-xs font-mono text-slate-400">Additional Smog Days</span>
                <div className="text-3xl font-mono font-black text-amber-400">
                  +{activeScenario.smogDaysDelta} <span className="text-sm font-normal text-slate-500">days</span>
                </div>
                <p className="text-[11px] text-slate-400">Inversion stagnation episodes</p>
              </div>
            </div>

          </div>
        </GlassCard>
      </div>

    </div>
  );
};
