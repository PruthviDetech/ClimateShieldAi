import React, { useState } from 'react';
import {
  Navigation,
  Layers,
  MapPin,
  Activity,
  Wind,
  Sun,
  Flame,
  Droplets,
  Sparkles,
  Info,
  Radio,
  ChevronRight,
  Compass
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { ClimateMap } from '../components/map/ClimateMap';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { PRESET_LOCATIONS } from '../data/mockLocations';

export const ClimateMapPage: React.FC = () => {
  const { currentLocation, selectLocation, activeRiskScore, activeRiskLevel } = useClimate();
  const [selectedStationId, setSelectedStationId] = useState<string>(currentLocation.id);

  const selectedStationData =
    PRESET_LOCATIONS[selectedStationId] || PRESET_LOCATIONS['pune-india'];

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Navigation className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Geospatial Climate Intelligence Map
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Multi-Layer Planetary Satellite Observation & Ground In-Situ Network</span>
                <span>•</span>
                <span className="text-cyan-400">48,219 Sensor Nodes</span>
              </p>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>CartoDB Dark Tile Matrix Online</span>
        </div>
      </div>

      {/* Main Map & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Map Center Canvas */}
        <div className="lg:col-span-8">
          <ClimateMap
            height="620px"
            onSelectLocation={(locId) => {
              setSelectedStationId(locId);
              selectLocation(locId);
            }}
          />
        </div>

        {/* Right: Station Intelligence Drawer */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {selectedStationData.location.city}, {selectedStationData.location.country}
                </h3>
              </div>
              <Badge riskLevel={selectedStationData.location.riskLevel} size="sm">
                {selectedStationData.location.riskScore}/100
              </Badge>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Ambient Temp</span>
                <div className="text-white font-bold">{selectedStationData.metrics.temperature.current}°C</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Air Quality</span>
                <div className="text-amber-400 font-bold">{selectedStationData.metrics.airQuality.aqi} AQI</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">PM2.5 Micro</span>
                <div className="text-rose-400 font-bold">{selectedStationData.metrics.airQuality.pm25} µg/m³</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Solar UV</span>
                <div className="text-yellow-400 font-bold">{selectedStationData.metrics.uv.index} UVI</div>
              </div>
            </div>

            {/* Primary Stressor */}
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs">
              <span className="text-cyan-400 font-bold block mb-1">Primary Stressor:</span>
              <span className="text-slate-300">{selectedStationData.location.primaryHazard}</span>
            </div>

            {/* Station Switcher List */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Quick Jump To Observatory Node:
              </span>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {Object.values(PRESET_LOCATIONS).map((ds) => {
                  const isCurrent = ds.location.id === selectedStationId;
                  return (
                    <button
                      key={ds.location.id}
                      onClick={() => {
                        setSelectedStationId(ds.location.id);
                        selectLocation(ds.location.id);
                      }}
                      className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition-all border ${
                        isCurrent
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{ds.location.city}, {ds.location.country}</span>
                      <span className="font-mono text-[11px] opacity-80">{ds.location.riskScore}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};
