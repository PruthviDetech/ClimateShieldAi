import React from 'react';
import { Activity, Radio, Satellite, ShieldCheck, Thermometer, Wind } from 'lucide-react';
import { useClimate } from '../../context/ClimateContext';

export const LiveTicker: React.FC = () => {
  const { isLiveFeedActive, lastUpdated } = useClimate();

  return (
    <div className="w-full bg-[#070d1e]/90 border-y border-cyan-500/10 py-1.5 px-4 overflow-hidden relative backdrop-blur-md text-xs font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Live Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-bold text-cyan-400 tracking-wider flex items-center gap-1 uppercase text-[11px]">
            <Radio className="w-3.5 h-3.5" /> LIVE TELEMETRY
          </span>
        </div>

        {/* Marquee stream */}
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-flex items-center gap-8 animate-[marquee_25s_linear_infinite] text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-cyan-400 font-semibold">PUNE, IN:</span> 34.2°C • AQI 178 (High) • PM2.5 98.4 µg/m³
            </span>
            <span className="text-slate-600">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-rose-400 font-semibold">DELHI NCR:</span> 39.5°C • AQI 312 (Hazardous) • Inversion Layer Trapped
            </span>
            <span className="text-slate-600">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">TOKYO, JP:</span> 22.4°C • AQI 34 (Good) • Sea Breeze Dispersion
            </span>
            <span className="text-slate-600">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-amber-400 font-semibold">DUBAI, UAE:</span> 43.8°C (Feels 52°C) • UV 11.8 (Extreme)
            </span>
            <span className="text-slate-600">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Satellite className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-400">Copernicus Sentinel-5P:</span> Swath Pass Validated (142ms latency)
            </span>
            <span className="text-slate-600">|</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">OpenAQ Network:</span> 48,219 Active IoT Station Nodes Online
            </span>
          </div>
        </div>

        {/* Last Sync */}
        <div className="hidden md:flex items-center gap-2 text-slate-400 text-[11px] shrink-0">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>Synced {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
