import React, { useState } from 'react';
import {
  Shield,
  Activity,
  MapPin,
  Compass,
  HeartPulse,
  LineChart,
  Bell,
  Bot,
  Settings,
  Database,
  Layers,
  Menu,
  X,
  Navigation,
  UserCheck,
  ChevronDown,
  FlaskConical
} from 'lucide-react';
import { useClimate } from '../../context/ClimateContext';
import { PERSONA_PROFILES } from '../../data/mockLocations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLocationModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLocationModal,
}) => {
  const {
    currentLocation,
    detectLocation,
    isDetectingLocation,
    selectedPersona,
    setSelectedPersona,
    activeAlerts,
    activeRiskScore,
    activeRiskLevel,
  } = useClimate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'landing', label: 'Home', icon: Shield },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'live-risk', label: 'Live Risk', icon: Layers },
    { id: 'forecast', label: 'Forecast', icon: Compass },
    { id: 'climate-map', label: 'Climate Map', icon: Navigation },
    { id: 'health-insights', label: 'Health', icon: HeartPulse },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlerts.length > 0 ? activeAlerts.length : undefined },
    { id: 'ai-assistant', label: 'AI Copilot', icon: Bot, isSpecial: true },
    { id: 'data-sources', label: 'Data Sources', icon: Database },
    { id: 'what-if', label: 'What-If', icon: FlaskConical },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#040813]/90 backdrop-blur-xl border-b border-cyan-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 group-hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">
                  CLIMATESHIELD
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
                Environmental Intelligence
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-semibold'
                      : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50'
                  } ${
                    link.isSpecial
                      ? 'border border-cyan-500/40 text-cyan-400 bg-cyan-950/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : ''
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-rose-500 text-white animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Widgets */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Active Location Quick Switcher */}
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/40 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
              title="Click to change location"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-semibold text-white max-w-[110px] truncate">
                {currentLocation.city}
              </span>
              <span className="text-[11px] font-mono text-cyan-400/80 border-l border-slate-700 pl-1.5 ml-0.5">
                {activeRiskScore}
              </span>
            </button>

            {/* Persona Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all"
                title="Select health & vulnerability persona"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span className="max-w-[85px] truncate">{selectedPersona.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {personaDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel-glow bg-[#070e24] p-2 z-50 border border-cyan-500/30 shadow-2xl">
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-mono text-cyan-400 font-bold uppercase">
                    Vulnerability Persona
                  </div>
                  <div className="mt-1 space-y-1">
                    {PERSONA_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPersona(p);
                          setPersonaDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col transition-colors ${
                          selectedPersona.id === p.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Detect Button */}
            <button
              onClick={() => detectLocation()}
              disabled={isDetectingLocation}
              className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all text-xs"
              title="Detect my location"
            >
              <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Mobile menu hamburger button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs font-semibold text-cyan-300"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentLocation.city}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#070c1c] border-b border-cyan-500/20 px-4 py-4 space-y-2 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
            <button
              onClick={() => {
                detectLocation();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-xs font-semibold text-cyan-300"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Detect GPS</span>
            </button>
            <button
              onClick={() => {
                onOpenLocationModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search City</span>
            </button>
          </div>

          <div className="py-2 text-[11px] font-mono text-slate-400 uppercase">
            Navigation
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-auto px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-rose-500 text-white">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
