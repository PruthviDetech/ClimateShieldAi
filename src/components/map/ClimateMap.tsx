import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PRESET_LOCATIONS } from '../../data/mockLocations';
import { useClimate } from '../../context/ClimateContext';
import { Layers, Wind, Flame, Sun, Sparkles, MapPin, Eye, Play, Pause } from 'lucide-react';
import { getRiskColor } from '../../utils/formatters';

interface ClimateMapProps {
  height?: string;
  onSelectLocation?: (locationId: string) => void;
}

export const ClimateMap: React.FC<ClimateMapProps> = ({ height = '550px', onSelectLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const { currentLocation, selectLocation } = useClimate();

  const [activeLayer, setActiveLayer] = useState<'aqi' | 'temp' | 'wildfire' | 'uv'>('aqi');
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.lat, currentLocation.lng],
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark theme tile layer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom Zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentLocation.lat, currentLocation.lng], 6, {
        duration: 1.5,
      });
    }
  }, [currentLocation]);

  // Redraw layers and markers when activeLayer or timeOffset changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // Add Heatmap / Anomaly circles for all preset locations
    Object.values(PRESET_LOCATIONS).forEach((ds) => {
      const { lat, lng, city, country, riskScore, riskLevel } = ds.location;
      const metrics = ds.metrics;

      let radius = 90000;
      let fillColor = '#06B6D4';
      let fillOpacity = 0.4;
      let popupMetric = '';

      if (activeLayer === 'aqi') {
        fillColor =
          metrics.airQuality.aqi > 250
            ? '#a855f7'
            : metrics.airQuality.aqi > 150
            ? '#f43f5e'
            : metrics.airQuality.aqi > 100
            ? '#f59e0b'
            : '#10b981';
        radius = 80000 + metrics.airQuality.pm25 * 600;
        popupMetric = `AQI: ${metrics.airQuality.aqi} • PM2.5: ${metrics.airQuality.pm25} µg/m³`;
      } else if (activeLayer === 'temp') {
        fillColor =
          metrics.temperature.feelsLike > 40
            ? '#ef4444'
            : metrics.temperature.feelsLike > 32
            ? '#f97316'
            : '#06b6d4';
        radius = 100000;
        popupMetric = `Temp: ${metrics.temperature.current}°C (Feels ${metrics.temperature.feelsLike}°C)`;
      } else if (activeLayer === 'wildfire') {
        fillColor = metrics.wildfireThreat.index > 50 ? '#f43f5e' : '#eab308';
        radius = 60000 + metrics.wildfireThreat.index * 1000;
        popupMetric = `Smoke Density: ${metrics.wildfireThreat.smokeDensity} • Threat: ${metrics.wildfireThreat.index}/100`;
      } else if (activeLayer === 'uv') {
        fillColor = metrics.uv.index > 10 ? '#9333ea' : metrics.uv.index > 7 ? '#f43f5e' : '#eab308';
        radius = 120000;
        popupMetric = `UV Index: ${metrics.uv.index} (${metrics.uv.category}) • Safe: ${metrics.uv.safeExposureMinutes}m`;
      }

      // 1. Atmosphere halo circle
      const circle = L.circle([lat, lng], {
        color: fillColor,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        weight: 1.5,
        radius: radius,
      });

      // 2. Custom pulsing HTML Marker
      const customIcon = L.divIcon({
        className: 'custom-climate-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: ${fillColor}; border: 2px solid #ffffff; box-shadow: 0 0 15px ${fillColor};"></div>
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; border: 2px solid ${fillColor}; opacity: 0.7; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div style="padding: 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 8px;">
            <strong style="color: #ffffff; font-size: 14px;">${city}, ${country}</strong>
            <span style="background: rgba(6,182,212,0.2); color: #22d3ee; border: 1px solid rgba(6,182,212,0.4); padding: 1px 6px; border-radius: 6px; font-size: 10px; font-weight: bold; font-family: monospace;">
              ${riskScore}/100
            </span>
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">
            ${popupMetric}
          </div>
          <div style="color: #38bdf8; font-size: 10px; font-weight: 600;">
            Hazard: ${ds.location.primaryHazard}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        selectLocation(ds.location.id);
        if (onSelectLocation) onSelectLocation(ds.location.id);
      });

      layerGroupRef.current?.addLayer(circle);
      layerGroupRef.current?.addLayer(marker);
    });
  }, [activeLayer, timeOffset]);

  // Timeline playback simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOffset((prev) => (prev >= 24 ? 0 : prev + 3));
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass-panel border border-cyan-500/25 bg-[#050b1a]" style={{ height }}>
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Layer Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl shadow-xl">
        <span className="text-[11px] font-mono text-cyan-400 font-bold px-2 uppercase flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Layers:
        </span>

        {[
          { id: 'aqi', label: 'Air Quality (AQI)', icon: Wind, color: 'text-rose-400' },
          { id: 'temp', label: 'Thermal Heat Island', icon: Sparkles, color: 'text-amber-400' },
          { id: 'wildfire', label: 'Wildfire & Smoke', icon: Flame, color: 'text-orange-400' },
          { id: 'uv', label: 'Solar UV Index', icon: Sun, color: 'text-purple-400' },
        ].map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;

          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
              <span>{layer.label}</span>
            </button>
          );
        })}
      </div>

      {/* Time Playback Control Slider */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500/30 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <span>FORECAST HORIZON:</span>
              <span className="text-cyan-400">+{timeOffset} HOURS</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Copernicus Atmosphere Reanalysis Model
            </p>
          </div>
        </div>

        {/* Time slider */}
        <div className="flex-1 max-w-md flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="24"
            step="3"
            value={timeOffset}
            onChange={(e) => setTimeOffset(Number(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span>Now</span>
            <span>→</span>
            <span>+24h</span>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Extreme
          </span>
        </div>
      </div>
    </div>
  );
};
