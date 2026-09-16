import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Radio,
  Send,
  Sparkles,
  Smartphone,
  Mail,
  MessageSquare,
  Clock,
  X,
  Siren,
  Flame,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useClimate } from '../context/ClimateContext';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { NO_WARNING_MESSAGE } from '../utils/earlyWarning';
import { EarlyWarning } from '../types/climate';

const levelStyle = (level: EarlyWarning['level']) =>
  level === 'CRITICAL'
    ? { chip: 'bg-rose-500/20 text-rose-300 border-rose-500/50', bar: 'bg-rose-500', edge: 'border-rose-500/40' }
    : level === 'WARNING'
    ? { chip: 'bg-amber-500/20 text-amber-300 border-amber-500/50', bar: 'bg-amber-400', edge: 'border-amber-500/40' }
    : { chip: 'bg-sky-500/20 text-sky-300 border-sky-500/50', bar: 'bg-sky-400', edge: 'border-sky-500/40' };

export const AlertsPage: React.FC = () => {
  const {
    currentDataset,
    currentLocation,
    activeAlerts,
    dismissAlert,
    customAlertRules,
    addAlertRule,
    deleteAlertRule,
    toggleAlertRule,
    activeRiskScore,
    earlyWarnings,
    liveStatus,
    liveError,
    refreshLive,
  } = useClimate();

  const [ruleName, setRuleName] = useState('');
  const [condition, setCondition] = useState<'AQI_GREATER' | 'TEMP_GREATER' | 'UV_GREATER' | 'RISK_GREATER'>('AQI_GREATER');
  const [threshold, setThreshold] = useState<number>(150);
  const [channelPush, setChannelPush] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSms, setChannelSms] = useState(false);
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    addAlertRule({
      name: ruleName,
      condition,
      threshold,
      channels: {
        push: channelPush,
        email: channelEmail,
        sms: channelSms,
      },
      enabled: true,
    });

    setRuleName('');
    setIsSuccessToast(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setIsSuccessToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Early Warning & Alert Dispatch Engine
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Predictive Civil Advisories & Automated User Threshold Alarms</span>
                <span>•</span>
                <span className="text-cyan-400">{currentLocation.city}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Alert Monitoring Engine: Active</span>
        </div>
      </div>

      {/* 1. ACTIVE CRITICAL ADVISORIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Active Priority Advisories ({activeAlerts.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Issued by Regional Environmental Authorities
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel border border-emerald-500/30 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Critical Active Advisories</h3>
            <p className="text-xs text-slate-400">
              Atmospheric and particulate levels in {currentLocation.city} are currently within regulatory alert thresholds.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-5 rounded-2xl glass-panel-glow bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-amber-950/30 border border-rose-500/30 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="risk" riskLevel="HIGH" size="md">
                      {alert.severity}
                    </Badge>
                    <h3 className="text-base font-bold text-white">{alert.title}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Issued: {alert.issuedAt}
                    </span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                      title="Dismiss Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {alert.message}
                </p>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    Required Action: {alert.actionRequired}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    Source: {alert.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1.5 24-HOUR EARLY WARNING OUTLOOK (Step 8 — live forecast-derived) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Siren className="w-5 h-5 text-amber-400" />
            24-Hour Early Warning Outlook
          </h2>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono text-amber-300">
            Experimental environmental alerts — not official medical or government warnings
          </span>
        </div>

        {liveStatus === 'loading' && (
          <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 flex items-center gap-2 text-xs font-mono text-cyan-300">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>SCANNING THE 24-HOUR FORECAST FOR {currentLocation.city.toUpperCase()}…</span>
          </div>
        )}

        {liveStatus === 'error' && (
          <div role="alert" className="p-5 rounded-2xl glass-panel border border-rose-500/30 flex flex-wrap items-center gap-2 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Early warning scan unavailable — {liveError ?? 'live data error'}.</span>
            <button onClick={refreshLive} className="ml-auto px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 font-bold transition-colors">
              Retry
            </button>
          </div>
        )}

        {liveStatus === 'success' && earlyWarnings.length === 0 && (
          <div className="p-8 rounded-2xl glass-panel border border-emerald-500/30 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">{NO_WARNING_MESSAGE}</h3>
            <p className="text-xs text-slate-400">
              No high-risk heat, air-quality, UV or composite periods detected for {currentLocation.city} in the next 24 hours.
            </p>
          </div>
        )}

        {liveStatus === 'success' && earlyWarnings.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>
                Scan active · {earlyWarnings.length} warning window{earlyWarnings.length === 1 ? '' : 's'} detected · personalized to your risk profile
              </span>
            </div>
            <div className="space-y-3">
              {[...earlyWarnings].sort((a, b) => Number(b.isPeakPeriod) - Number(a.isPeakPeriod)).map((w) => {
                const style = levelStyle(w.level);
                return (
                  <div
                    key={w.id}
                    className={`relative p-5 pl-6 rounded-2xl glass-panel border space-y-3 overflow-hidden ${style.edge} ${w.isPeakPeriod ? 'ring-1 ring-amber-400/60' : ''}`}
                  >
                    <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bar}`} />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide border ${style.chip}`}>
                          {w.level}
                        </span>
                        <h3 className="text-sm font-bold text-white">{w.cause}</h3>
                        {w.isPeakPeriod && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/50 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                            <Flame className="w-3 h-3" /> Highest-risk period
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Expected: {w.windowLabel} · Index {w.riskScore}/100 ({w.riskLevel})
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">{w.explanation}</p>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-cyan-300 font-semibold flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        Recommended: {w.action}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        Peak values — feels {w.peakValues.feelsLike}°C · AQI {w.peakValues.aqi} · PM2.5 {w.peakValues.pm25} · UV {w.peakValues.uv}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 2. CUSTOM THRESHOLD ALERT BUILDER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Builder Form */}
        <div className="lg:col-span-6">
          <GlassCard className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Configure Custom Risk Trigger
              </h3>
              <p className="text-xs text-slate-400">
                Set personalized thresholds to receive instant push, email, or SMS dispatches.
              </p>
            </div>

            {isSuccessToast && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Custom alert trigger created and activated successfully!</span>
              </div>
            )}

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Trigger Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Pune Asthma Smog Alarm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none placeholder-slate-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="AQI_GREATER">If AQI Index &gt;</option>
                    <option value="TEMP_GREATER">If Temperature (°C) &gt;</option>
                    <option value="UV_GREATER">If UV Index &gt;</option>
                    <option value="RISK_GREATER">If Risk Score &gt;</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Threshold Value</label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* Notification channels */}
              <div className="space-y-1.5 pt-1">
                <label className="text-slate-300 font-semibold block">Notification Channels</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannelPush(!channelPush)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                      channelPush
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Push App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannelEmail(!channelEmail)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                      channelEmail
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannelSms(!channelSms)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                      channelSms
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
              >
                Save & Activate Alert Rule
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Existing Custom Rules List */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Configured Alert Rules ({customAlertRules.length})
          </h3>

          <div className="space-y-2.5">
            {customAlertRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{rule.name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded ${
                        rule.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rule.enabled ? 'ACTIVE' : 'MUTED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Trigger when {rule.condition} {rule.threshold}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlertRule(rule.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      rule.enabled
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                    }`}
                  >
                    {rule.enabled ? 'Mute' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteAlertRule(rule.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
