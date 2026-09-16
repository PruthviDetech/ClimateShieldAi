import React, { useEffect, useState } from 'react';
import { Check, LoaderCircle, MapPin, Navigation, Search, WifiOff, X } from 'lucide-react';
import { useClimate } from '../../context/ClimateContext';
import { SelectedLocation } from '../../types/climate';

interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

const formatCoordinates = (location: SelectedLocation) => `${location.lat.toFixed(3)}°, ${location.lng.toFixed(3)}°`;

export const LocationSearchPanel: React.FC = () => {
  const { selectedSearchLocation, setSelectedSearchLocation } = useClimate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ name: normalizedQuery, count: '6', language: 'en', format: 'json' });
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Location search is temporarily unavailable.');
        const data = await response.json() as GeocodingResponse;
        setResults((data.results ?? []).map((result) => ({
          id: `geo-${result.id}`,
          city: result.name,
          state: result.admin1,
          country: result.country ?? 'Unknown country',
          lat: result.latitude,
          lng: result.longitude,
          source: 'search',
        })));
      } catch (requestError) {
        if ((requestError as DOMException).name !== 'AbortError') {
          setResults([]);
          setError('We could not reach location search. Check your connection and try again.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const selectLocation = (location: SelectedLocation) => {
    setSelectedSearchLocation(location);
    setQuery('');
    setResults([]);
    setError(null);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('This browser does not support device location.');
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        selectLocation({
          id: `device-${coords.latitude.toFixed(5)}-${coords.longitude.toFixed(5)}`,
          city: 'Current location',
          country: 'Device coordinates',
          lat: coords.latitude,
          lng: coords.longitude,
          source: 'device',
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError('We could not access your location. Check browser permissions and try again.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <section className="rounded-3xl glass-panel-glow bg-gradient-to-r from-cyan-950/30 via-slate-900/80 to-teal-950/20 border border-cyan-500/25 p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="min-w-0 lg:w-64">
          <div className="flex items-center gap-2 text-cyan-300">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Location anchor</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Search any city to place it on the global risk globe.</p>
        </div>

        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
          {isLoading && <LoaderCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a city or place — e.g. Mumbai, India"
            className="w-full rounded-2xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 outline-none pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-500 transition-all"
            aria-label="Search for a city or location"
          />
          {query && !isLoading && <button onClick={() => setQuery('')} aria-label="Clear location search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>

        <button onClick={useMyLocation} disabled={isLocating} className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all disabled:opacity-60">
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Locating…' : 'Use my location'}
        </button>
      </div>

      {(query.trim().length >= 2 || error || selectedSearchLocation) && <div className="mt-3">
        {error && <div role="alert" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200"><WifiOff className="w-4 h-4 shrink-0" />{error}</div>}
        {!error && !isLoading && query.trim().length >= 2 && results.length === 0 && <div className="px-3 py-3 rounded-xl bg-slate-950/50 text-xs text-slate-400">No locations matched “{query.trim()}”. Try adding a country or region.</div>}
        {results.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {results.map((result) => <button key={result.id} onClick={() => selectLocation(result)} className="text-left p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all group">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="min-w-0"><span className="block text-sm font-semibold text-white truncate">{result.city}</span><span className="block mt-0.5 text-xs text-slate-400 truncate">{[result.state, result.country].filter(Boolean).join(', ')}</span></span>
            </div>
          </button>)}
        </div>}
        {selectedSearchLocation && !query && <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <div className="flex items-center gap-2 min-w-0"><span className="p-1 rounded-full bg-cyan-400 text-slate-950"><Check className="w-3 h-3 stroke-[3]" /></span><span className="text-xs text-slate-200 truncate"><strong className="text-cyan-300">{selectedSearchLocation.city}</strong> · {[selectedSearchLocation.state, selectedSearchLocation.country].filter(Boolean).join(', ')} · {formatCoordinates(selectedSearchLocation)}</span></div>
          <span className="text-[10px] font-mono text-slate-400">PINNED TO GLOBE · LIVE LOOKUP ENABLED</span>
        </div>}
      </div>}
    </section>
  );
};
