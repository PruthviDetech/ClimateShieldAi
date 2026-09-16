import React from 'react';
import {
  Database,
  Radio,
  Satellite,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code2,
  Server,
  Cpu,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { DATA_SOURCES } from '../data/dataSourcesMeta';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

export const DataSourcesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Data Sources, Telemetry & Mathematical Methodology
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Multi-Satellite Ingestion Grid & ClimateShield Risk Index (CSRI v2.4) Formulation</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs font-mono text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>5/5 Upstream Telemetry Feeds Online</span>
        </div>
      </div>

      {/* 1. MATHEMATICAL FORMULATION OF THE CLIMATESHIELD RISK INDEX */}
      <GlassCard glow="cyan" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">
            Mathematical Formulation: ClimateShield Risk Index (CSRI v2.4)
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The ClimateShield Risk Index (CSRI) synthesizes thermodynamic heat accumulation, respiratory particulate deposition, ultraviolet erythema kinetics, and atmospheric boundary layer ventilation into a calibrated scalar domain ($0 \le \text&#123;CSRI&#125; \le 100$).
        </p>

        {/* Formula Box */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto shadow-inner">
          <div className="text-slate-400 text-[11px] mb-1">// Mathematical Model:</div>
          <code>
            CSRI = [ w_T · f(T_feels, WBGT) + w_A · g(AQI, PM2.5) + w_UV · h(UV) + w_W · k(Wind_Dispersion) ] × Persona_Vulnerability
          </code>
        </div>

        {/* Model Weights Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-rose-400 font-bold font-mono">w_A = 0.40 (40%)</span>
            <div className="text-white font-semibold">Air Quality & PM2.5</div>
            <p className="text-[10px] text-slate-400">Alveolar micro-inhalation hazard function.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold font-mono">w_T = 0.32 (32%)</span>
            <div className="text-white font-semibold">Thermal & Wet-Bulb</div>
            <p className="text-[10px] text-slate-400">Sweat vapor pressure deficit & WBGT.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-yellow-400 font-bold font-mono">w_UV = 0.18 (18%)</span>
            <div className="text-white font-semibold">Solar UV Radiance</div>
            <p className="text-[10px] text-slate-400">Cellular photo-dimerization & burn time.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold font-mono">w_W = 0.10 (10%)</span>
            <div className="text-white font-semibold">Wind Stagnation</div>
            <p className="text-[10px] text-slate-400">Topographic boundary layer trapping.</p>
          </div>
        </div>
      </GlassCard>

      {/* 2. EARTH OBSERVATION DATASETS DIRECTORY */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Satellite className="w-5 h-5 text-teal-400" />
          Upstream Earth Observation & In-Situ Sensor Telemetry
        </h2>

        <div className="space-y-4">
          {DATA_SOURCES.map((source) => (
            <GlassCard key={source.id} className="p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{source.name}</h3>
                    <Badge variant="status" size="sm">
                      {source.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono">{source.organization}</span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {source.status} ({source.latencyMs}ms)
                  </span>
                  <span className="text-slate-400">Confidence: {source.accuracyConfidence}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {source.description}
              </p>

              {/* Parameters measured */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Parameters Extracted:</span>
                <div className="flex flex-wrap gap-1.5">
                  {source.parameters.map((param, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Update Interval: {source.updateInterval}</span>
                <a
                  href={source.apiEndpointDoc}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>API Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* 3. BACKEND & DATABASE ARCHITECTURE BLUEPRINTS */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">
            Backend & Database Architecture Preparation
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The application codebase includes production-ready architecture starter templates located in <code className="text-cyan-300 font-mono">backend-architecture/</code> for rapid deployment to Node.js/Express and Supabase (PostgreSQL).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-cyan-400 font-bold block">1. PostgreSQL / Supabase Schema (schema.sql)</span>
            <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
              <li><strong className="text-slate-200">locations:</strong> Geocoded stations with coordinates & elevation</li>
              <li><strong className="text-slate-200">sensor_telemetry_logs:</strong> Real-time timeseries table with timescale partitioning</li>
              <li><strong className="text-slate-200">risk_scores:</strong> Cached precomputed weighted risk scores</li>
              <li><strong className="text-slate-200">alert_triggers:</strong> User configured threshold webhook rules</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-teal-400 font-bold block">2. Express.js Telemetry Ingestion (server.example.ts)</span>
            <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
              <li><strong className="text-slate-200">POST /api/v1/telemetry:</strong> Webhook ingest from CPCB & OpenAQ</li>
              <li><strong className="text-slate-200">GET /api/v1/risk/current:</strong> Returns weighted 0-100 composite index</li>
              <li><strong className="text-slate-200">WebSocket /ws/live:</strong> Real-time streaming push notifications to frontend clients</li>
              <li><strong className="text-slate-200">AI Synthesizer:</strong> Integrates OpenAI/Gemini for clinical copilot reasoning</li>
            </ul>
          </div>
        </div>
      </GlassCard>

    </div>
  );
};
