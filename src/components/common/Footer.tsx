import React from 'react';
import { Shield, Database, HeartPulse, Activity, Sparkles, ExternalLink } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="mt-20 border-t border-cyan-500/15 bg-[#030611] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-extrabold text-white text-sm tracking-wider">
                CLIMATESHIELD <span className="text-cyan-400">AI</span>
              </span>
            </div>
            <p className="text-slate-300 font-medium text-xs leading-relaxed">
              "See the climate risk before it affects you."
            </p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              AI-powered environmental intelligence combining satellite telemetry, multi-hazard modeling, and biometeorology.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase font-mono text-cyan-400">
              Intelligence Modules
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => setActiveTab('dashboard')} className="hover:text-cyan-300 transition-colors">
                  Climate Intelligence Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('live-risk')} className="hover:text-cyan-300 transition-colors">
                  Live Multi-Hazard Risk
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('forecast')} className="hover:text-cyan-300 transition-colors">
                  Forecast & Climate Scenarios (RCP 4.5/8.5)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('climate-map')} className="hover:text-cyan-300 transition-colors">
                  Geospatial Climate Map
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('health-insights')} className="hover:text-cyan-300 transition-colors">
                  Health & Biometeorology Insights
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: AI & Analytics */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase font-mono text-teal-400">
              AI & Governance
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => setActiveTab('ai-assistant')} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>ShieldAI Climate Copilot</span>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('analytics')} className="hover:text-cyan-300 transition-colors">
                  Historical Anomaly Analytics
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('alerts')} className="hover:text-cyan-300 transition-colors">
                  Early Warning Alert Engine
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('data-sources')} className="hover:text-cyan-300 transition-colors">
                  Methodology & Data Transparency
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('settings')} className="hover:text-cyan-300 transition-colors">
                  Vulnerability Profile Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Data Sources */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase font-mono text-emerald-400">
              Sensor Feeds
            </h4>
            <p className="text-[11px] text-slate-400">
              Ingesting real-time data from European Space Agency (ESA Copernicus Sentinel-5P), NASA MODIS & VIIRS, NOAA GFS, and 48,000+ OpenAQ stations.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800">
                Copernicus S5P
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800">
                NASA VIIRS
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800">
                NOAA GFS
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800">
                OpenAQ IoT
              </span>
            </div>
          </div>

        </div>

        {/* Mandatory Health & Environmental Disclaimer Box */}
        <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <HeartPulse className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-200/90 leading-relaxed">
            <span className="font-bold text-amber-300 uppercase tracking-wide mr-1 font-mono">
              Medical & Environmental Disclaimer:
            </span>
            This platform provides general environmental awareness and does not provide medical diagnosis. Always consult certified healthcare professionals and local civil emergency directives during severe climate or hazardous air quality events.
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} CLIMATESHIELD AI. Built for hackathons & climate resilience.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-cyan-400/70">React • TypeScript • Vite • Tailwind • Three.js</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
