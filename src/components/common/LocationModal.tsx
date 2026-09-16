import React, { useState } from 'react';
import { X, Search, MapPin, Navigation, Check } from 'lucide-react';
import { useClimate } from '../../context/ClimateContext';
import { Badge } from './Badge';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const {
    availableLocations,
    currentLocation,
    selectLocation,
    detectLocation,
    isDetectingLocation,
    searchLocations,
  } = useClimate();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = searchLocations(searchQuery);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl glass-panel-glow bg-[#080e22] border border-cyan-500/30 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Select Environmental Monitoring Station
            </h3>
            <p className="text-xs text-slate-400">
              Switch regional telemetry or search across global climate observatory nodes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & GPS Action */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, state, or country (e.g. Pune, Delhi, Tokyo)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium placeholder-slate-500 transition-all shadow-inner"
            />
          </div>

          <button
            onClick={async () => {
              await detectLocation();
              onClose();
            }}
            disabled={isDetectingLocation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition-all shadow-sm group"
          >
            <Navigation className={`w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>{isDetectingLocation ? 'Triangulating GPS Coordinates...' : 'Auto-Detect My Current Location (GPS)'}</span>
          </button>
        </div>

        {/* Location List */}
        <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
            Available Monitoring Stations ({filtered.length})
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching locations found for "{searchQuery}". Try "Pune" or "Delhi".
            </div>
          ) : (
            filtered.map((loc) => {
              const isSelected = loc.id === currentLocation.id;

              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    selectLocation(loc.id);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">
                          {loc.city}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {loc.state ? `${loc.state}, ` : ''}{loc.country}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                        Primary Threat: {loc.primaryHazard}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Badge riskLevel={loc.riskLevel} size="sm">
                      {loc.riskScore}/100
                    </Badge>
                    {isSelected && (
                      <div className="p-1 rounded-full bg-cyan-500 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
