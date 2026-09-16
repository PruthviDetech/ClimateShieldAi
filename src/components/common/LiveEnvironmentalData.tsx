import React, { useState } from 'react';
import { CloudRain, Droplets, LoaderCircle, RefreshCw, Sun, Thermometer, Wind, Wind as AirIcon, WifiOff } from 'lucide-react';
import { useClimate } from '../../context/ClimateContext';
import { formatTemp } from '../../utils/formatters';

export const LiveEnvironmentalData: React.FC = () => {
  const {
    activeLocation,
    currentMetrics,
    liveStatus,
    liveError,
    lastUpdated,
    refreshLive,
  } = useClimate();
  const [refreshing, setRefreshing] = useState(false);

  const isLoading = liveStatus === 'loading' || refreshing;

  const handleRefresh = () => {
    setRefreshing(true);
    refreshLive();
    // The context updates lastUpdated when the fetch resolves; clear the spinner shortly after.
    setTimeout(() => setRefreshing(false), 900);
  };

  return (
    <section className="rounded-3xl glass-panel bg-[#070e20]/85 border border-teal-500/25 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-300">
            <span className={`w-2 h-2 rounded-full ${liveStatus === 'success' ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-mono font-bold tracking-wider">LIVE ENVIRONMENTAL DATA</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">
            {activeLocation.city}
            {activeLocation.state ? `, ${activeLocation.state}` : ''}, {activeLocation.country}
          </h2>
          <p className="text-xs text-slate-400">
            Current conditions from Open-Meteo for {activeLocation.lat.toFixed(3)}°, {activeLocation.lng.toFixed(3)}° · Synced {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:border-teal-400/50 text-xs font-semibold text-slate-300 hover:text-teal-300 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {liveStatus === 'error' && !isLoading && (
        <div role="alert" className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200 flex items-start gap-2">
          <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{liveError ?? 'Live environmental data is unavailable right now.'}</span>
        </div>
      )}

      {isLoading && (
        <div className="py-10 flex flex-col items-center gap-3 text-slate-400">
          <LoaderCircle className="w-6 h-6 text-teal-400 animate-spin" />
          <span className="text-xs">Loading current weather and air quality…</span>
        </div>
      )}

      {liveStatus === 'success' && !isLoading && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-950/60 text-xs">
            <span className="text-slate-300 font-semibold">{currentMetrics.rain.forecast}</span>
            <span className="font-mono text-slate-400">
              US AQI {currentMetrics.airQuality.aqi} ({currentMetrics.airQuality.category}) · {currentMetrics.airQuality.pm25} µg/m³ PM2.5
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <Metric icon={Thermometer} label="Temperature" value={formatTemp(currentMetrics.temperature.current, 'C')} color="text-orange-300" />
            <Metric icon={Thermometer} label="Feels like" value={formatTemp(currentMetrics.temperature.feelsLike, 'C')} color="text-amber-300" />
            <Metric icon={Droplets} label="Humidity" value={`${currentMetrics.humidity.percentage}%`} color="text-sky-300" />
            <Metric icon={Wind} label="Wind speed" value={`${currentMetrics.wind.speedKmh} km/h`} color="text-cyan-300" />
            <Metric icon={CloudRain} label="Precipitation" value={`${currentMetrics.rain.volumeMm} mm`} color="text-blue-300" />
            <Metric icon={Sun} label="UV index" value={currentMetrics.uv.index.toFixed(1)} color="text-yellow-300" />
            <Metric icon={AirIcon} label="US AQI" value={`${currentMetrics.airQuality.aqi} · ${currentMetrics.airQuality.category}`} color="text-teal-300" wide />
            <Metric icon={AirIcon} label="PM2.5" value={`${currentMetrics.airQuality.pm25} µg/m³`} color="text-rose-300" />
            <Metric icon={AirIcon} label="PM10" value={`${currentMetrics.airQuality.pm10} µg/m³`} color="text-fuchsia-300" />
          </div>
        </>
      )}
    </section>
  );
};

const Metric: React.FC<{ icon: React.ElementType; label: string; value: string; color: string; wide?: boolean }> = ({ icon: Icon, label, value, color, wide }) => (
  <div className={`rounded-2xl bg-slate-900/70 border border-slate-800 p-3 ${wide ? 'md:col-span-2' : ''}`}>
    <div className={`flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <div className="mt-2 text-base font-bold text-white truncate">{value}</div>
  </div>
);
