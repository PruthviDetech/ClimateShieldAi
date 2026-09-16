import React from 'react';
import {
  Shield,
  Activity,
  ArrowRight,
  Sparkles,
  Zap,
  Globe2,
  HeartPulse,
  Bell,
  Bot,
  Layers,
  Database,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Wind,
  Sun,
  Droplets,
  AlertTriangle
} from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { Globe3D } from '../components/globe/Globe3D';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { RiskGauge } from '../components/common/RiskGauge';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
  onOpenLocationModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setActiveTab,
  onOpenLocationModal,
}) => {
  const { currentLocation, activeRiskScore, activeRiskLevel, currentMetrics, currentDataset, activeRiskResult } = useClimate();

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Glow ambient lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Live Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
              LIVE ENVIRONMENTAL INTELLIGENCE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              CLIMATESHIELD <span className="text-gradient-cyan">AI</span>
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-slate-200 leading-snug">
              "See the climate risk before it affects you."
            </p>

            <p className="text-base text-slate-400 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
              AI-powered environmental intelligence for a safer tomorrow. We fuse satellite atmospheric telemetry, hyper-local sensor networks, and predictive biometeorology to forecast hyper-local climate and health hazards in real-time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-sm shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Check My Climate Risk</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('climate-map')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-semibold text-sm transition-all"
              >
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <span>Explore Climate Intelligence</span>
              </button>
            </div>

            {/* Quick Live Preview Mini-Bar */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Current: <strong className="text-white">{currentLocation.city}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>Risk: <strong className="text-cyan-300">{activeRiskScore}/100 [{activeRiskLevel}]</strong></span>
              </span>
            </div>
          </div>

          {/* Hero Right: 3D Interactive Climate Globe */}
          <div className="lg:col-span-6 relative">
            <Globe3D height="clamp(360px, 54vw, 480px)" onSelectCity={() => setActiveTab('dashboard')} />
          </div>
        </div>
      </section>

      {/* 2. WHAT CLIMATESHIELD AI DOES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Capabilities
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            What ClimateShield AI Does
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Unlike generic weather forecasts, ClimateShield AI translates raw meteorological and pollution data into actionable health risk intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard glow="cyan" hoverEffect onClick={() => setActiveTab('dashboard')}>
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 w-fit mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              ClimateShield Risk Index
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              A proprietary multi-modal algorithm fusing Wet-Bulb heat stress, PM2.5 alveolar infiltration, solar UV radiation, and atmospheric stagnation into a single 0–100 index.
            </p>
          </GlassCard>

          <GlassCard glow="amber" hoverEffect onClick={() => setActiveTab('forecast')}>
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              AI Prediction & Early Warning
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Machine learning models detect micro-inversion traps, thermal surges, and hazardous smog accumulation up to 14 days in advance to trigger early alerts.
            </p>
          </GlassCard>

          <GlassCard glow="emerald" hoverEffect onClick={() => setActiveTab('health-insights')}>
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-fit mb-4">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Personalized Health Vulnerability
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dynamically scales risk calculations and creates custom hydration, sun safety, and outdoor exposure windows tailored to asthmatics, children, seniors, and athletes.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* 3. CLIMATE RISK INDEX SHOWCASE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl glass-panel-glow bg-gradient-to-br from-[#081129]/90 to-[#040815]/90 border border-cyan-500/30 p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold uppercase">
                <AlertTriangle className="w-3.5 h-3.5" /> High Precision Algorithm
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Understand The "Why" Behind Your Risk Score
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Generic weather apps say "34°C and Hazy". ClimateShield AI explains that {currentLocation.city} is currently at <strong className="text-cyan-300">{activeRiskScore} / 100 {activeRiskLevel} RISK</strong> because {currentDataset.riskDrivers[0]?.factor.toLowerCase() ?? 'particulate inhalation'} is the dominant live stressor, followed by thermal and solar radiation load.
              </p>

              <div className="space-y-3 pt-2">
                {currentDataset.riskDrivers.slice(0, 3).map((driver, index) => (
                  <div key={driver.factor} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{index + 1}. {driver.factor}</span>
                    <span className={`font-mono font-bold ${index === 0 ? 'text-rose-400' : index === 1 ? 'text-amber-400' : 'text-cyan-400'}`}>{driver.contributionPercent}% Impact</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-semibold text-xs transition-all flex items-center gap-2"
                >
                  <span>Inspect Live Breakdown for {currentLocation.city}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20">
              <RiskGauge score={activeRiskScore} level={activeRiskLevel} size="hero" sublabel="Live ClimateShield Risk Index · Experimental" />
              <p className="mt-2 text-[10px] text-slate-500 text-center max-w-[240px]">
                {activeRiskResult ? activeRiskResult.version : 'CSRI'} — computed live from Open-Meteo telemetry for {currentLocation.city}. Not an official medical or governmental classification.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS 4-STEP PIPELINE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/10 text-teal-400 font-mono text-xs font-bold uppercase">
            Pipeline Architecture
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            How ClimateShield AI Works
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            From orbiting satellites to immediate preventative action in under 200 milliseconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Multi-Sensor Ingestion',
              desc: 'Continuous real-time ingestion from Copernicus S5P, NASA MODIS, NOAA GFS, and 48k+ IoT ground air sensors.',
              icon: Database,
            },
            {
              step: '02',
              title: 'Multi-Modal AI Engine',
              desc: 'Ensemble machine learning models detect atmospheric inversions, thermal island traps, and chemical plume dispersals.',
              icon: Sparkles,
            },
            {
              step: '03',
              title: 'Dynamic Risk Indexing',
              desc: 'Calculates the standardized 0-100 ClimateShield Risk Index weighted by user vulnerability profile.',
              icon: Activity,
            },
            {
              step: '04',
              title: 'Proactive Early Action',
              desc: 'Dispatches automated threshold alerts, safe outdoor window recommendations, and smart hydration guidance.',
              icon: Shield,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl glass-panel border border-slate-800 relative group hover:border-cyan-500/40 transition-all"
              >
                <span className="text-3xl font-mono font-black text-cyan-500/30 group-hover:text-cyan-400/60 transition-colors">
                  {item.step}
                </span>
                <div className="mt-3 p-2.5 rounded-xl bg-cyan-500/15 text-cyan-300 w-fit mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. AI COPILOT & GLOBAL MAP PREVIEWS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: AI Assistant */}
          <GlassCard glow="cyan" hoverEffect onClick={() => setActiveTab('ai-assistant')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Bot className="w-6 h-6" />
              </div>
              <Badge variant="risk" riskLevel="LOW" size="sm">
                ShieldAI Copilot
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Ask ShieldAI Anything
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              "Is it safe for my asthmatic child to play outside today?"
              "Analyze Pune's 7-day heatwave risk."
              Conversational climate intelligence tailored to your exact location and health persona.
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400">
              <span>Open AI Climate Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </GlassCard>

          {/* Card 2: Climate Map */}
          <GlassCard glow="teal" hoverEffect onClick={() => setActiveTab('climate-map')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Globe2 className="w-6 h-6" />
              </div>
              <Badge variant="status" size="sm">
                Geospatial
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Interactive Geospatial Map
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Explore high-resolution CartoDB dark maps with layer toggles for PM2.5 air pollution heatmaps, surface thermal islands, active wildfire plumes, and UV radiation flux.
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold text-teal-400">
              <span>Launch Climate Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 6. DATA SOURCES CREDIBILITY BADGES */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-8">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Powered by Global Earth Observation & Climate Reanalysis Data
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-300">
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>ESA Copernicus Sentinel-5P</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>NASA MODIS & VIIRS Thermal</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>NOAA Global Forecast System (GFS)</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>OpenAQ IoT Ground Network</span>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl glass-panel-glow bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-teal-950/60 border border-cyan-500/40 p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Take Control of Your Environmental Health Today
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Experience real-time climate risk assessment built with next-generation AI and satellite intelligence.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all"
            >
              Launch Climate Intelligence Dashboard
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
