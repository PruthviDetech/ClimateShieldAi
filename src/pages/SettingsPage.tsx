import React, { useState } from 'react';
import {
  Settings,
  MapPin,
  HeartPulse,
  Sliders,
  Bell,
  Key,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  Radio,
  UserCheck
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { GlassCard } from '../components/common/GlassCard';
import { PERSONA_PROFILES, PRESET_LOCATIONS } from '../data/mockLocations';

export const SettingsPage: React.FC = () => {
  const {
    currentLocation,
    selectLocation,
    tempUnit,
    setTempUnit,
    aqiStandard,
    setAqiStandard,
    selectedPersona,
    setSelectedPersona,
    savedLocationIds,
    toggleSaveLocation,
  } = useClimate();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [apiKeyOpenWeather, setApiKeyOpenWeather] = useState('');
  const [apiKeyMapbox, setApiKeyMapbox] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('https://api.your-system.org/webhooks/climate-alerts');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Settings & Vulnerability Configuration
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Personalize Health Multipliers, Monitoring Locations & Developer Keys</span>
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences Saved</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* 1. VULNERABILITY PERSONA PROFILE */}
        <GlassCard className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-400" />
              Health & Vulnerability Persona
            </h3>
            <p className="text-xs text-slate-400">
              The ClimateShield Risk Index dynamically recalibrates thresholds according to your chosen profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PERSONA_PROFILES.map((p) => {
              const isSelected = selectedPersona.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersona(p)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{p.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{p.vulnerabilityFactor}x</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{p.label}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 2. UNITS & STANDARDS */}
        <GlassCard className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Display Units & Regulatory Standards
            </h3>
            <p className="text-xs text-slate-400">
              Configure temperature scale and air quality standard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Temperature Scale</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTempUnit('C')}
                  className={`py-2.5 px-4 rounded-xl border font-bold transition-all ${
                    tempUnit === 'C'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Celsius (°C)
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnit('F')}
                  className={`py-2.5 px-4 rounded-xl border font-bold transition-all ${
                    tempUnit === 'F'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Air Quality Standard</label>
              <select
                value={aqiStandard}
                onChange={(e) => setAqiStandard(e.target.value as any)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="US_EPA">US EPA Air Quality Index (0 - 500)</option>
                <option value="IN_NAAQS">Indian NAAQS (CPCB Standard)</option>
                <option value="WHO">WHO 2021 Strict Health Guidelines</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* 3. SAVED OBSERVATORY STATIONS */}
        <GlassCard className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              Saved Monitoring Stations
            </h3>
            <p className="text-xs text-slate-400">
              Quickly bookmark stations for fast switching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.values(PRESET_LOCATIONS).map((ds) => {
              const isSaved = savedLocationIds.includes(ds.location.id);
              const isCurrent = currentLocation.id === ds.location.id;

              return (
                <div
                  key={ds.location.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/50 border-cyan-400 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{ds.location.city}</span>
                    <span className="text-[10px] text-slate-400">{ds.location.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => selectLocation(ds.location.id)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-cyan-300 hover:bg-slate-700 text-[10px] font-semibold"
                    >
                      {isCurrent ? 'Active' : 'Set Active'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 4. DEVELOPER API KEYS & WEBHOOK ARCHITECTURE */}
        <GlassCard className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-rose-400" />
              Developer API Keys & Webhook Endpoints
            </h3>
            <p className="text-xs text-slate-400">
              Integrate external keys and webhook dispatch listeners (.env architectural preparation).
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">OpenWeatherMap / AirVisual API Key</label>
              <input
                type="password"
                value={apiKeyOpenWeather}
                onChange={(e) => setApiKeyOpenWeather(e.target.value)}
                placeholder="owm_live_key_984f87a84c..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none font-mono placeholder-slate-600"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Mapbox Access Token</label>
              <input
                type="password"
                value={apiKeyMapbox}
                onChange={(e) => setApiKeyMapbox(e.target.value)}
                placeholder="pk.eyJ1IjoiY2xpbWF0ZS1zaGllbGQ..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none font-mono placeholder-slate-600"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Automated Alert Webhook URI</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none font-mono"
              />
            </div>
          </div>
        </GlassCard>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
