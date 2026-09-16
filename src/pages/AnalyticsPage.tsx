import React, { useState } from 'react';
import {
  LineChart,
  Activity,
  Calendar,
  Download,
  TrendingUp,
  BarChart3,
  Sparkles,
  Info,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { useClimate } from '../context/ClimateContext';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

interface AnalyticsPageProps {
  onOpenExportModal: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onOpenExportModal }) => {
  const { currentLocation, activeRiskScore, activeRiskLevel } = useClimate();
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d');

  // Simulated 30-day historical trend data
  const historicalTrendData = [
    { day: 'Day 1', aqi: 142, temp: 31.2, risk: 58, pm25: 78 },
    { day: 'Day 5', aqi: 155, temp: 32.8, risk: 62, pm25: 84 },
    { day: 'Day 10', aqi: 188, temp: 35.4, risk: 78, pm25: 104 },
    { day: 'Day 15', aqi: 172, temp: 34.0, risk: 71, pm25: 92 },
    { day: 'Day 20', aqi: 130, temp: 29.5, risk: 52, pm25: 65 },
    { day: 'Day 25', aqi: 165, temp: 33.1, risk: 66, pm25: 88 },
    { day: 'Day 30 (Today)', aqi: 178, temp: 34.2, risk: 72, pm25: 98 },
  ];

  // Anomaly frequency monthly distribution
  const anomalyData = [
    { month: 'Apr', heatwaveDays: 8, severeSmogDays: 14, unshadedUVDays: 22 },
    { month: 'May', heatwaveDays: 16, severeSmogDays: 11, unshadedUVDays: 26 },
    { month: 'Jun', heatwaveDays: 5, severeSmogDays: 6, unshadedUVDays: 12 },
    { month: 'Jul', heatwaveDays: 2, severeSmogDays: 4, unshadedUVDays: 8 },
    { month: 'Aug', heatwaveDays: 3, severeSmogDays: 5, unshadedUVDays: 10 },
    { month: 'Sep (MTD)', heatwaveDays: 6, severeSmogDays: 9, unshadedUVDays: 14 },
  ];

  // Wind speed vs PM2.5 dispersion correlation data
  const correlationData = [
    { wind: 5, pm25: 145, size: 80 },
    { wind: 8, pm25: 120, size: 90 },
    { wind: 12, pm25: 98, size: 100 },
    { wind: 16, pm25: 64, size: 110 },
    { wind: 22, pm25: 38, size: 120 },
    { wind: 28, pm25: 22, size: 130 },
  ];

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <LineChart className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Historical Trends & Anomaly Analytics
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Long-Term Longitudinal Environmental Epidemiological Analysis</span>
                <span>•</span>
                <span className="text-cyan-400">{currentLocation.city}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Time Filter & Export */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono">
            {(['30d', '90d', '1y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  timeRange === r
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Generate Audit Report</span>
          </button>
        </div>
      </div>

      {/* 30-Day Historical Risk & AQI Trend Chart */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Multi-Metric Historical Progression ({timeRange.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-400">
              Correlating ClimateShield Risk Index vs PM2.5 Micro-Particulate Density in {currentLocation.city}.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span> Risk Index (0-100)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span> PM2.5 (µg/m³)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="pmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 150]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(11, 19, 43, 0.95)',
                  borderColor: 'rgba(6, 182, 212, 0.4)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="risk" stroke="#06B6D4" strokeWidth={2.5} fill="url(#riskGrad)" name="Risk Score" />
              <Area type="monotone" dataKey="pm25" stroke="#F43F5E" strokeWidth={2} strokeDasharray="3 3" fill="url(#pmGrad)" name="PM2.5 (µg/m³)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* ANOMALY FREQUENCY & CORRELATION GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Monthly Anomaly Exceedance Bar Chart */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Monthly Climate Hazard Exceedance Days
              </h3>
              <p className="text-xs text-slate-400">
                Number of days exceeding safety thresholds across 2026.
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={anomalyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(11, 19, 43, 0.95)',
                      borderColor: 'rgba(6, 182, 212, 0.4)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="heatwaveDays" fill="#F59E0B" name="Extreme Heat Days" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="severeSmogDays" fill="#F43F5E" name="Severe Smog Days" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unshadedUVDays" fill="#06B6D4" name="Peak UV Days" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Right: Wind Speed vs PM2.5 Inversion Correlation */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Inverse Correlation: Wind vs Smog
              </h3>
              <p className="text-xs text-slate-400">
                Shows clear exponential dispersion of PM2.5 as surface wind speed exceeds 18 km/h.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Calm Winds (&lt; 8 km/h):</span>
                <span className="text-rose-400 font-bold">PM2.5: 145 µg/m³ (Severe Trap)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Moderate Breeze (14 km/h):</span>
                <span className="text-amber-400 font-bold">PM2.5: 98 µg/m³ (Current)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Active Advection (&gt; 25 km/h):</span>
                <span className="text-emerald-400 font-bold">PM2.5: 22 µg/m³ (Clear)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-300">
              <strong className="text-cyan-300 block mb-1">AI Machine Learning Insight:</strong>
              Topographic valley inversions in Pune require sustained &gt; 18 km/h wind shear or solar convective thermals to achieve healthy air clearance.
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};
