import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveAlert,
  ClimateLocation,
  EarlyWarning,
  EnvironmentalMetrics,
  PersonaProfile,
  RiskLevel,
  SelectedLocation,
  UserProfile,
} from '../types/climate';
import { PRESET_LOCATIONS, PERSONA_PROFILES, LocationDataset } from '../data/mockLocations';
import { fetchLiveEnvironmentalData, LiveEnvironmentalData } from '../services/openMeteo';
import {
  deriveMetrics,
  deriveRiskDrivers,
  deriveHealthImpact,
  deriveHourlyForecast,
  summarizePeakRisk,
  deriveDailyForecast,
  deriveAlerts,
  deriveRecommendations,
  deriveScenarios,
} from '../utils/climateDerivation';
import { calculateClimateShieldRisk, CSRIResult } from '../utils/riskCalculator';
import { calculatePersonalRisk, profileFromPersona, PersonalizedRiskResult } from '../utils/personalProfile';
import { deriveEarlyWarnings } from '../utils/earlyWarning';
import { DEFAULT_PERSONA } from '../utils/riskCalculator';

export interface CustomAlertRule {
  id: string;
  name: string;
  condition: 'AQI_GREATER' | 'TEMP_GREATER' | 'UV_GREATER' | 'RISK_GREATER';
  threshold: number;
  channels: { push: boolean; email: boolean; sms: boolean };
  enabled: boolean;
  createdAt: string;
}

export type LiveStatus = 'idle' | 'loading' | 'success' | 'error';

interface ClimateContextType {
  // --- Active location (single source of truth) ---
  activeLocation: SelectedLocation;
  /** Legacy: preset station id-based selection. Selecting a preset now activates it as the live location. */
  currentLocation: ClimateLocation;
  currentDataset: LocationDataset;
  currentMetrics: EnvironmentalMetrics;

  // --- Live fetch lifecycle ---
  liveStatus: LiveStatus;
  liveError: string | null;
  isLiveFeedActive: boolean;
  setIsLiveFeedActive: (active: boolean) => void;
  refreshLive: () => void;
  lastUpdated: Date;

  // --- Legacy preset selection (now routed through the same live pipeline) ---
  availableLocations: ClimateLocation[];
  selectLocation: (locationId: string) => void;
  detectLocation: () => Promise<string>;
  isDetectingLocation: boolean;
  searchLocations: (query: string) => ClimateLocation[];

  // --- Search-selected location (drives everything) ---
  selectedSearchLocation: SelectedLocation | null;
  setSelectedSearchLocation: (location: SelectedLocation | null) => void;

  // --- Preferences ---
  selectedPersona: PersonaProfile;
  /** Legacy persona picker: maps the preset to a personal profile and applies it. */
  setSelectedPersona: (persona: PersonaProfile) => void;
  /** Personal risk profile (Step 6) — the primary personalization control. */
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  /** General-population baseline score for comparison. */
  baselineRiskScore: number;
  tempUnit: 'C' | 'F';
  setTempUnit: (unit: 'C' | 'F') => void;
  aqiStandard: 'US_EPA' | 'IN_NAAQS' | 'WHO';
  setAqiStandard: (std: 'US_EPA' | 'IN_NAAQS' | 'WHO') => void;

  // --- Alerts & saves ---
  activeAlerts: ActiveAlert[];
  dismissAlert: (alertId: string) => void;
  savedLocationIds: string[];
  toggleSaveLocation: (locationId: string) => void;
  customAlertRules: CustomAlertRule[];
  addAlertRule: (rule: Omit<CustomAlertRule, 'id' | 'createdAt'>) => void;
  deleteAlertRule: (id: string) => void;
  toggleAlertRule: (id: string) => void;

  // --- Derived risk (transparent CSRI, personalized) ---
  activeRiskScore: number;
  activeRiskLevel: RiskLevel;
  /** Full transparent result: components, weights, narrative, version, profile impacts. */
  activeRiskResult: PersonalizedRiskResult | null;
  /** Transparency metadata about the live inputs feeding the index. */
  liveDataInfo: { observedAt: string | null; source: string; experimental: boolean };
  /** Plain-English peak-risk explanation for the next 24h (Step 7). Null while loading/error. */
  peakRiskSummary: string | null;
  /** Step 8: forecast-derived early warnings for the next 24h. Empty = all clear. */
  earlyWarnings: EarlyWarning[];
}

const ClimateContext = createContext<ClimateContextType | undefined>(undefined);

const DEFAULT_PRESET_ID = 'pune-india';

export const ClimateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSearchLocation, setSelectedSearchLocation] = useState<SelectedLocation | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_PRESET_ID);
  const [selectedPersona, setSelectedPersonaState] = useState<PersonaProfile>(PERSONA_PROFILES[0]);
  // Personal profile derived from the initial (general) persona; edited directly or via legacy persona picker.
  const [userProfile, setUserProfileState] = useState<UserProfile>(
    () =>
      profileFromPersona(PERSONA_PROFILES[0]) ?? {
        ageGroup: 'adult',
        outdoorActivityLevel: 'moderate',
        sensitivityToHeat: 'medium',
        sensitivityToAirPollution: 'medium',
        vulnerabilityFactors: [],
      },
  );
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [aqiStandard, setAqiStandard] = useState<'US_EPA' | 'IN_NAAQS' | 'WHO'>('US_EPA');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [savedLocationIds, setSavedLocationIds] = useState<string[]>(['pune-india', 'tokyo-japan', 'delhi-india']);
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(true);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  // --- Live data lifecycle (drives everything downstream) ---
  const [liveSnapshot, setLiveSnapshot] = useState<LiveEnvironmentalData | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('loading');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // The active location: searched/device location wins; otherwise the selected preset.
  const activeLocation: SelectedLocation = useMemo(() => {
    if (selectedSearchLocation) return selectedSearchLocation;
    const preset = PRESET_LOCATIONS[selectedPresetId] ?? PRESET_LOCATIONS[DEFAULT_PRESET_ID];
    return {
      id: preset.location.id,
      city: preset.location.city,
      state: preset.location.state,
      country: preset.location.country,
      lat: preset.location.lat,
      lng: preset.location.lng,
      source: 'search',
    };
  }, [selectedSearchLocation, selectedPresetId]);

  // Fetch live data whenever the active location changes (or manual refresh / resume)
  useEffect(() => {
    const controller = new AbortController();
    setLiveStatus('loading');
    setLiveError(null);

    fetchLiveEnvironmentalData(activeLocation, controller.signal)
      .then((snapshot) => {
        setLiveSnapshot(snapshot);
        setLiveStatus('success');
        setLastUpdated(new Date());
      })
      .catch((requestError: unknown) => {
        if ((requestError as DOMException)?.name === 'AbortError') return;
        setLiveSnapshot(null);
        setLiveStatus('error');
        setLiveError('Live environmental data is unavailable right now. Check your connection and try again.');
      });

    return () => controller.abort();
  }, [activeLocation.lat, activeLocation.lng, refreshNonce]);

  // Optional auto-refresh every 5 minutes while the live feed is enabled
  useEffect(() => {
    if (!isLiveFeedActive) return;
    const interval = setInterval(() => setRefreshNonce((n) => n + 1), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLiveFeedActive]);

  const refreshLive = useCallback(() => setRefreshNonce((n) => n + 1), []);

  // Legacy persona picker: applying a preset also updates the personal profile.
  const setSelectedPersona = useCallback((persona: PersonaProfile) => {
    setSelectedPersonaState(persona);
    const mapped = profileFromPersona(persona);
    if (mapped) setUserProfileState(mapped);
  }, []);

  // Direct profile edits keep the legacy persona label in sync (closest preset = general).
  const setUserProfile = useCallback((profile: UserProfile) => {
    setUserProfileState(profile);
  }, []);

  // --- Derive the full dataset from the live snapshot ---
  const currentDataset: LocationDataset = useMemo(() => {
    const preset = PRESET_LOCATIONS[selectedPresetId] ?? PRESET_LOCATIONS[DEFAULT_PRESET_ID];

    if (!liveSnapshot || liveStatus !== 'success') {
      // While loading/error: show preset structure shell with zeroed live values.
      // Pages render loading/error states instead of stale mock numbers.
      return {
        ...preset,
        location: {
          ...preset.location,
          city: activeLocation.city,
          state: activeLocation.state ?? '',
          country: activeLocation.country,
          lat: activeLocation.lat,
          lng: activeLocation.lng,
        },
        metrics: PRESET_LOCATIONS[DEFAULT_PRESET_ID].metrics,
      } as LocationDataset;
    }

    const metrics = deriveMetrics(liveSnapshot);
    const generalRisk = calculateClimateShieldRisk(metrics); // neutral general-population baseline
    const personalRisk = calculatePersonalRisk(metrics, userProfile);
    const drivers = deriveRiskDrivers(metrics, personalRisk);
    const health = deriveHealthImpact(metrics);

    return {
      location: {
        id: activeLocation.id,
        city: activeLocation.city,
        state: activeLocation.state ?? '',
        country: activeLocation.country,
        lat: activeLocation.lat,
        lng: activeLocation.lng,
        elevationMeters: liveSnapshot.elevationMeters ?? preset.location.elevationMeters,
        population: preset.location.population,
        riskScore: personalRisk.score,
        riskLevel: personalRisk.level,
        primaryHazard: drivers.length
          ? drivers.reduce((a, b) => (a.contributionPercent >= b.contributionPercent ? a : b)).factor
          : preset.location.primaryHazard,
      },
      metrics,
      riskDrivers: drivers,
      healthImpact: health,
      hourlyForecast: deriveHourlyForecast(metrics, liveSnapshot, userProfile),
      dailyForecast: deriveDailyForecast(metrics, liveSnapshot),
      scenarios: deriveScenarios(metrics, generalRisk.score),
      alerts: deriveAlerts(metrics, activeLocation),
      recommendations: deriveRecommendations(metrics),
    };
  }, [liveSnapshot, liveStatus, activeLocation, selectedPresetId, userProfile]);

  // Profile change re-scales the active risk score/level without re-fetching.
  // While loading or on error, no risk number is surfaced (null) — never mock values.
  const activeRiskResult: PersonalizedRiskResult | null = useMemo(
    () =>
      liveStatus === 'success'
        ? calculatePersonalRisk(currentDataset.metrics, userProfile)
        : null,
    [currentDataset.metrics, userProfile, liveStatus],
  );

  const activeRiskScore = activeRiskResult?.score ?? 0;
  const activeRiskLevel = activeRiskResult?.level ?? 'LOW';
  const baselineRiskScore = activeRiskResult?.baselineScore ?? 0;

  // Step 7: plain-English peak-risk explanation for the next 24 hours,
  // derived from the personalized hourly curve. Empty while loading/error.
  const peakRiskSummary: string | null = useMemo(
    () =>
      liveStatus === 'success' && currentDataset.hourlyForecast.length > 0
        ? summarizePeakRisk(currentDataset.hourlyForecast)
        : null,
    [currentDataset.hourlyForecast, liveStatus],
  );

  // Step 8: early warnings derived from the SAME personalized 24h forecast.
  // Automatically updates when the location, live data, or profile changes —
  // and is empty (all clear) while loading/error so nothing stale is shown.
  const earlyWarnings: EarlyWarning[] = useMemo(
    () =>
      liveStatus === 'success'
        ? deriveEarlyWarnings(currentDataset.hourlyForecast, currentDataset.metrics, userProfile)
        : [],
    [currentDataset.hourlyForecast, currentDataset.metrics, userProfile, liveStatus],
  );

  // Legacy view-model for pages that still read `currentLocation`
  const currentLocation: ClimateLocation = currentDataset.location;

  // Legacy preset switcher now routes through the same live pipeline
  const selectLocation = useCallback((locationId: string) => {
    if (PRESET_LOCATIONS[locationId]) {
      setSelectedSearchLocation(null); // preset selection overrides any searched city
      setSelectedPresetId(locationId);
    }
  }, []);

  const searchLocations = useCallback((query: string): ClimateLocation[] => {
    const availableLocations = Object.values(PRESET_LOCATIONS).map((ds) => ds.location);
    if (!query.trim()) return availableLocations;
    const q = query.toLowerCase();
    return availableLocations.filter(
      (loc) =>
        loc.city.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q)
    );
  }, []);

  const detectLocation = useCallback(async (): Promise<string> => {
    setIsDetectingLocation(true);
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setSelectedSearchLocation({
              id: `device-${latitude.toFixed(5)}-${longitude.toFixed(5)}`,
              city: 'Current location',
              state: undefined,
              country: 'Device coordinates',
              lat: latitude,
              lng: longitude,
              source: 'device',
            });
            setIsDetectingLocation(false);
            resolve('device-location');
          },
          () => {
            // Permission denied or unavailable -> fall back to default preset
            setSelectedSearchLocation(null);
            setSelectedPresetId(DEFAULT_PRESET_ID);
            setIsDetectingLocation(false);
            resolve(DEFAULT_PRESET_ID);
          },
          { timeout: 5000 }
        );
      } else {
        setSelectedSearchLocation(null);
        setSelectedPresetId(DEFAULT_PRESET_ID);
        setIsDetectingLocation(false);
        resolve(DEFAULT_PRESET_ID);
      }
    });
  }, []);

  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>(currentDataset.alerts);
  // Re-sync dismissals only when the derived alert set actually changes (by id),
  // so persona toggles or metric jitter don't resurrect dismissed alerts.
  const alertIds = currentDataset.alerts.map((a) => a.id).join('|');
  useEffect(() => setActiveAlerts(currentDataset.alerts), [alertIds]);

  const dismissAlert = useCallback((alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const toggleSaveLocation = useCallback((locationId: string) => {
    setSavedLocationIds((prev) =>
      prev.includes(locationId) ? prev.filter((id) => id !== locationId) : [...prev, locationId]
    );
  }, []);

  const [customAlertRules, setCustomAlertRules] = useState<CustomAlertRule[]>([
    {
      id: 'rule-1',
      name: 'Severe Smog Inhalation Warning',
      condition: 'AQI_GREATER',
      threshold: 150,
      channels: { push: true, email: true, sms: false },
      enabled: true,
      createdAt: '2026-09-10',
    },
    {
      id: 'rule-2',
      name: 'High Thermal Heat Stress Trigger',
      condition: 'TEMP_GREATER',
      threshold: 38,
      channels: { push: true, email: false, sms: true },
      enabled: true,
      createdAt: '2026-09-11',
    },
    {
      id: 'rule-3',
      name: 'Extreme UV Burn Threshold',
      condition: 'UV_GREATER',
      threshold: 9,
      channels: { push: true, email: false, sms: false },
      enabled: true,
      createdAt: '2026-09-12',
    },
  ]);

  const addAlertRule = useCallback((rule: Omit<CustomAlertRule, 'id' | 'createdAt'>) => {
    const newRule: CustomAlertRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomAlertRules((prev) => [newRule, ...prev]);
  }, []);

  const deleteAlertRule = useCallback((id: string) => {
    setCustomAlertRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleAlertRule = useCallback((id: string) => {
    setCustomAlertRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  return (
    <ClimateContext.Provider
      value={{
        activeLocation,
        currentLocation,
        currentDataset,
        currentMetrics: currentDataset.metrics,
        liveStatus,
        liveError,
        isLiveFeedActive,
        setIsLiveFeedActive,
        refreshLive,
        lastUpdated,
        availableLocations: Object.values(PRESET_LOCATIONS).map((ds) => ds.location),
        selectLocation,
        detectLocation,
        isDetectingLocation,
        searchLocations,
        selectedSearchLocation,
        setSelectedSearchLocation,
        selectedPersona,
        setSelectedPersona,
        userProfile,
        setUserProfile,
        baselineRiskScore,
        tempUnit,
        setTempUnit,
        aqiStandard,
        setAqiStandard,
        activeAlerts,
        dismissAlert,
        savedLocationIds,
        toggleSaveLocation,
        customAlertRules,
        addAlertRule,
        deleteAlertRule,
        toggleAlertRule,
        activeRiskScore,
        activeRiskLevel,
        activeRiskResult,
        peakRiskSummary,
        earlyWarnings,
        liveDataInfo: {
          observedAt: liveSnapshot?.observedAt ?? null,
          source: 'Open-Meteo (weather + air quality), fetched live for the selected location',
          experimental: true,
        },
      }}
    >
      {children}
    </ClimateContext.Provider>
  );
};

export const useClimate = () => {
  const context = useContext(ClimateContext);
  if (!context) {
    throw new Error('useClimate must be used within a ClimateProvider');
  }
  return context;
};
