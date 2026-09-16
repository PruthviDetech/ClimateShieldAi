import {
  ActiveAlert,
  ChatMessage,
  EarlyWarning,
  UserProfile,
} from '../types/climate';
import { LocationDataset } from '../data/mockLocations';
import { PersonalizedRiskResult } from '../utils/personalProfile';
import { WhatIfResult } from '../utils/whatIfSimulator';

/**
 * ============================================================
 *  AI CLIMATE ASSISTANT — PROVIDER ARCHITECTURE (Step 10)
 * ============================================================
 *
 * The assistant is provider-based: the default `local-assistant`
 * provider answers entirely from the app's REAL live data (no
 * network calls, no keys). If a real LLM is configured later,
 * implement the same interface (or use `createHttpAssistantProvider`)
 * and swap it in `resolveProvider()` — nothing else changes.
 *
 * No API keys exist in this project. An HTTP LLM provider activates
 * ONLY when VITE_ASSISTANT_API_URL is set at build time, and the
 * key is expected to live on the backend proxy it calls — never in
 * frontend code. .env files are git-ignored.
 */

/* ---------------- Context snapshot ---------------- */

export interface WhatIfContext {
  scenarioLabel: string;
  overridesSummary: string[];
  result: WhatIfResult;
}

/** Everything the assistant is allowed to know about the CURRENT app state. */
export interface AssistantContext {
  location: {
    city: string;
    state?: string;
    country: string;
    lat: number;
    lng: number;
  };
  observedAt: string | null;
  metrics: LocationDataset['metrics'];
  /** Personalized, transparent CSRI result (Steps 5–6). */
  risk: {
    score: number;
    level: string;
    baselineScore: number;
    result: PersonalizedRiskResult | null;
    drivers: LocationDataset['riskDrivers'];
  };
  /** Personalized 24h hourly forecast (Step 7). */
  hourlyForecast: LocationDataset['hourlyForecast'];
  peakRiskSummary: string | null;
  /** Live early warnings (Step 8). */
  warnings: EarlyWarning[];
  /** The user's self-reported personal risk profile (Step 6). */
  profile: UserProfile;
  /** Active What-If simulation, if the user has one running (Step 9). */
  simulation: WhatIfContext | null;
  /** Current-condition advisories already derived by the app. */
  alerts: ActiveAlert[];
}

/** The assistant's answer, with required content-type labeling. */
export interface AssistantReply {
  /** Markdown text. Sections are labeled by kind, see `sections`. */
  text: string;
  riskScore: number;
  riskLevel: string;
  /** Environmental information only (facts, readings). */
  environmental: string[];
  /** Risk assessment statements (experimental index interpretation). */
  assessment: string[];
  /** General safety recommendations (non-medical). */
  recommendations: string[];
  citations: string[];
  actions: { label: string; action: string }[];
  /** Label of the provider that produced this reply. */
  providerLabel: string;
}

export interface AssistantProvider {
  /** Stable id used for display and routing. */
  id: string;
  /** Human-readable label shown in the UI mode chip. */
  label: string;
  /** True when the provider needs network/LLM access. */
  requiresNetwork: boolean;
  generate: (
    question: string,
    context: AssistantContext,
    history: ChatMessage[],
  ) => Promise<AssistantReply>;
}

/* ============================================================
 *  Built-in provider: local, context-aware, data-driven
 * ============================================================ */

const round1 = (v: number) => Math.round(v * 10) / 10;

const bandOf = (score: number): string =>
  score < 40 ? 'LOW' : score < 60 ? 'MODERATE' : score < 80 ? 'HIGH' : 'SEVERE';

const levelPhrase = (level: string): string =>
  ({
    LOW: 'low',
    MODERATE: 'moderate',
    HIGH: 'high',
    SEVERE: 'severe',
  })[level] ?? level.toLowerCase();

export const createLocalAssistantProvider = (): AssistantProvider => ({
  id: 'local-assistant',
  label: 'Context Engine (local)',
  requiresNetwork: false,
  generate: async (question, context) => {
    const reply = answerFromData(question, context);
    return { ...reply, providerLabel: 'Context Engine (local)' };
  },
});

/* ============================================================
 *  Optional HTTP LLM provider (activated only via env var)
 * ============================================================ */

/**
 * Creates a provider that POSTs { question, context } to a backend
 * endpoint (a proxy that holds the real LLM API key server-side).
 * To activate: set VITE_ASSISTANT_API_URL at build time.
 */
export const createHttpAssistantProvider = (endpoint: string): AssistantProvider => ({
  id: 'http-llm',
  label: 'LLM via backend proxy',
  requiresNetwork: true,
  generate: async (question, context, history) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        context,
        history: history.slice(-8).map((m) => ({ role: m.sender, text: m.text })),
      }),
    });
    if (!response.ok) throw new Error(`Assistant endpoint returned ${response.status}`);
    const data = await response.json();
    return {
      text: String(data.text ?? ''),
      riskScore: Number(data.riskScore ?? context.risk.score),
      riskLevel: String(data.riskLevel ?? context.risk.level),
      environmental: Array.isArray(data.environmental) ? data.environmental : [],
      assessment: Array.isArray(data.assessment) ? data.assessment : bulletsOf(data.text),
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      citations: ['LLM via backend proxy', 'Open-Meteo live telemetry'],
      actions: Array.isArray(data.actions) ? data.actions : [],
      providerLabel: 'LLM via backend proxy',
    };
  },
});

/** Resolve which provider is active. Falls back to the local engine. */
export const resolveProvider = (): AssistantProvider => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const endpoint = env.VITE_ASSISTANT_API_URL;
  if (endpoint && endpoint.trim()) {
    return createHttpAssistantProvider(endpoint.trim());
  }
  return createLocalAssistantProvider();
};

/* ============================================================
 *  Local engine: intent detection + data-driven answers
 * ============================================================ */

type Intent =
  | 'why_high'
  | 'safe_outside'
  | 'safest_time'
  | 'what_if'
  | 'most_dangerous'
  | 'why_increase'
  | 'air_quality'
  | 'weather_now'
  | 'warnings'
  | 'profile'
  | 'capabilities'
  | 'unknown';

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

const detectIntent = (raw: string): Intent => {
  const q = raw.toLowerCase();

  if (has(q, 'what if', 'what-if', 'simulate', 'simulation', 'scenario')) return 'what_if';
  if (has(q, 'why is my risk', 'why did my risk', 'why did the risk', 'why did it increase', 'why is the risk', 'why did risk', 'risk increase', 'went up', 'why high', 'why so high'))
    return q.includes('increase') || q.includes('went up') ? 'why_increase' : 'why_high';
  if (has(q, 'safest time', 'best time', 'when is it safe', 'when should i', 'when can i')) return 'safest_time';
  if (has(q, 'safe to go outside', 'safe to go out', 'is it safe', 'can i go', 'should i go', 'safe for', 'okay to', 'ok to'))
    return 'safe_outside';
  if (has(q, 'most dangerous', 'biggest risk', 'biggest concern', 'main cause', 'what is causing', "what's causing", 'what drives', 'biggest factor', 'most harmful'))
    return 'most_dangerous';
  if (has(q, 'warning', 'alert')) return 'warnings';
  if (has(q, 'aqi', 'pm2.5', 'pm10', 'air quality', 'pollution', 'pollen')) return 'air_quality';
  if (has(q, 'temperature', 'weather', 'hot', 'cold', 'rain', 'precipitation', 'humid', 'wind', 'uv')) return 'weather_now';
  if (has(q, 'profile', 'sensitivity', 'vulnerab')) return 'profile';
  if (has(q, 'what can you', 'help', 'how do you work')) return 'capabilities';

  return 'unknown';
};

const bulletsOf = (text: string): string[] =>
  text
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

/** Compact stat line for a factor's live value. */
const driverValue = (key: string, m: AssistantContext['metrics']): string => {
  switch (key) {
    case 'air': return `US AQI ${m.airQuality.aqi} (${m.airQuality.category}), PM2.5 ${m.airQuality.pm25} µg/m³`;
    case 'thermal': return `feels-like ${m.temperature.feelsLike}°C, wet-bulb ${m.wetBulb.tempC}°C, ${m.humidity.percentage}% humidity`;
    case 'uv': return `UV index ${m.uv.index} (${m.uv.category})`;
    case 'wind': return `wind ${m.wind.speedKmh} km/h (${m.wind.dispersionCapacity} dispersion)`;
    case 'rain': return `${m.rain.probability}% rain probability`;
    default: return 'live conditions';
  }
};

const FACT_SECTIONS = {
  env: '📊 Environmental information (live readings)',
  assess: '🧮 Risk assessment (experimental index — not an official classification)',
  rec: '🛡️ General safety recommendations (not medical advice)',
};

const answerFromData = (question: string, context: AssistantContext): AssistantReply => {
  const { metrics: m, risk, profile, warnings, hourlyForecast, simulation } = context;
  const intent = detectIntent(question);
  const city = context.location.city;

  const environmental: string[] = [];
  const assessment: string[] = [];
  const recommendations: string[] = [];
  let text = '';
  const actions: { label: string; action: string }[] = [];

  /* ---------- Shared building blocks ---------- */

  const topDriver = risk.drivers[0];
  const secondDriver = risk.drivers[1];
  const profileDelta = risk.result?.profileDelta ?? 0;
  const topImpacts = risk.result?.factorImpacts?.slice(0, 2) ?? [];

  const formatHour = (t: string) => {
    const h = Number.parseInt(t.slice(0, 2), 10);
    if (Number.isNaN(h)) return t;
    return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
  };

  /** Lowest-risk 3-hour window in the next 12h. */
  const safestWindow = () => {
    if (hourlyForecast.length === 0) return null;
    const now = hourlyForecast[0].hour;
    const window = hourlyForecast.filter((h) => h.hour <= now + 12);
    const pool = window.length >= 3 ? window : hourlyForecast.slice(0, 3);
    let best: { start: string; end: string; avg: number; level: string } | null = null;
    let bestAvg = Infinity;
    for (let i = 0; i <= pool.length - 3; i++) {
      const slice = pool.slice(i, i + 3);
      const avg3 = slice.reduce((s, h) => s + h.riskScore, 0) / 3;
      if (avg3 < bestAvg) {
        bestAvg = avg3;
        best = { start: slice[0].time, end: slice[2].time, avg: Math.round(avg3), level: slice[1].riskLevel };
      }
    }
    return best;
  };

  /* ---------- Intent handlers ---------- */

  if (intent === 'why_high' || intent === 'most_dangerous') {
    if (!topDriver) {
      text = `I don't have enough computed risk data for ${city} right now. Please wait for the live telemetry to finish loading, then ask again.`;
      return base('', [], [], text, context);
    }
    environmental.push(`${topDriver.factor}: ${topDriver.currentValue} (safe threshold: ${topDriver.safeThreshold})`);
    if (secondDriver) environmental.push(`${secondDriver.factor}: ${secondDriver.currentValue}`);
    assessment.push(
      `Your personal index is ${risk.score}/100 (${levelPhrase(risk.level)}) — ${
        risk.result?.narrative ?? `driven mainly by ${topDriver.factor.toLowerCase()}.`
      }`,
    );
    if (profileDelta !== 0) {
      assessment.push(
        `Your profile shifts this by ${profileDelta > 0 ? '+' : ''}${profileDelta} points vs the general-population baseline of ${risk.baselineScore}.`,
      );
    }
    if (topImpacts.length > 0) {
      assessment.push(
        `Profile factors raising it: ${topImpacts.map((i) => `${i.factor.toLowerCase()} (+${i.pointsAdded})`).join(', ')}.`,
      );
    }
    recommendations.push(topDriver.impactDescription);
    if (secondDriver) recommendations.push(secondDriver.impactDescription);
    text = [
      `### What is causing your risk score in ${city}`,
      '',
      `The dominant factor right now is **${topDriver.factor}** — ${topDriver.severity} severity, contributing **${topDriver.contributionPercent}%** of your composite index.`,
      '',
      FACT_SECTIONS.env,
      ...environmental.map((e) => `- ${e}`),
      '',
      FACT_SECTIONS.assess,
      ...assessment.map((a) => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map((r) => `- ${r}`),
      '',
      '_If a factor has no live reading or is missing from telemetry, I will say so rather than estimate._',
    ].join('\n');
    actions.push({ label: 'Open Live Risk breakdown', action: 'live-risk' });
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'safe_outside') {
    const aqi = m.airQuality.aqi;
    const heat = m.temperature.feelsLike;
    const uv = m.uv.index;
    const envLines = [
      `US AQI ${aqi} (${m.airQuality.category}), PM2.5 ${m.airQuality.pm25} µg/m³, PM10 ${m.airQuality.pm10} µg/m³`,
      `Feels like ${heat}°C (wet-bulb ${m.wetBulb.tempC}°C, ${m.humidity.percentage}% humidity)`,
      `UV index ${uv} (${m.uv.category}); wind ${m.wind.speedKmh} km/h; ${m.rain.probability}% rain chance`,
    ];
    environmental.push(...envLines);

    const concerns: string[] = [];
    if (aqi > 100 || m.airQuality.pm25 > 35.4) concerns.push('elevated particulate pollution');
    if (heat >= 35 || m.wetBulb.tempC >= 28) concerns.push('dangerous heat stress');
    if (uv >= 8) concerns.push('very high UV');
    if (warnings.some((w) => w.level === 'CRITICAL')) concerns.push('an active critical warning window');

    assessment.push(
      `Personal index ${risk.score}/100 (${levelPhrase(risk.level)}) for your profile${
        profileDelta !== 0 ? ` (profile shift ${profileDelta > 0 ? '+' : ''}${profileDelta})` : ''
      }.`,
    );
    if (warnings.length > 0) {
      assessment.push(
        `Active warnings: ${warnings.map((w) => `${w.level} — ${w.cause.toLowerCase()} around ${w.windowLabel}`).join('; ')}.`,
      );
    } else {
      assessment.push('No early-warning windows in the next 24 hours for your thresholds.');
    }

    if (concerns.length === 0) {
      recommendations.push(
        `Conditions look broadly favorable for outdoor activity in ${city} for your profile right now.`,
      );
      recommendations.push(`UV-safe exposure is about ${m.uv.safeExposureMinutes} minutes unshaded at current UV.`);
    } else {
      recommendations.push(
        `Consider limiting prolonged outdoor exertion while ${concerns.join(' and ')} persist(s).`,
      );
      if (warnings[0]) recommendations.push(warnings[0].action);
    }
    recommendations.push('Use your own judgment for vulnerable dependents; this is general environmental guidance, not medical advice.');

    text = [
      `### Is it safe to go outside in ${city}?`,
      '',
      concerns.length === 0
        ? `✅ Broadly yes for your profile — with normal precautions.`
        : `⚠️ Partly — there are ${concerns.length} active concern(s) for your profile.`,
      '',
      FACT_SECTIONS.env,
      ...envLines.map((e) => `- ${e}`),
      '',
      FACT_SECTIONS.assess,
      ...assessment.map((a) => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map((r) => `- ${r}`),
    ].join('\n');
    actions.push({ label: 'See 24h forecast', action: 'forecast' });
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'safest_time') {
    const best = safestWindow();
    if (!best || hourlyForecast.length === 0) {
      text = `I don't have enough hourly forecast data for ${city} right now to determine a safest window. Please wait for the live telemetry to load and try again.`;
      return base('', [], [], text, context);
    }
    environmental.push(`Hourly personalized risk range next 12h: ${Math.min(...hourlyForecast.slice(0, 12).map((h) => h.riskScore))}–${Math.max(...hourlyForecast.slice(0, 12).map((h) => h.riskScore))}/100`);
    environmental.push(`Currently: feels like ${m.temperature.feelsLike}°C, AQI ${m.airQuality.aqi}, UV ${m.uv.index}`);
    assessment.push(context.peakRiskSummary ?? 'Peak-risk summary unavailable for this cycle.');
    assessment.push(`Safest 3-hour window: **${best.start} – ${best.end}** (avg index ${best.avg}/100, ${best.level}).`);
    if (warnings.length > 0) {
      assessment.push(`Avoid ${warnings.map((w) => `${w.windowLabel} (${w.cause.toLowerCase()})`).join(', ')}.`);
    }
    recommendations.push('Schedule outdoor exercise or errands inside the safest window and keep hydration nearby.');
    text = [
      `### Safest time today in ${city}`,
      '',
      `Based on the **personalized 24-hour risk forecast**, the quietest stretch is **${best.start} – ${best.end}**.`,
      '',
      FACT_SECTIONS.env,
      ...environmental.map((e) => `- ${e}`),
      '',
      FACT_SECTIONS.assess,
      ...assessment.map((a) => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map((r) => `- ${r}`),
    ].join('\n');
    actions.push({ label: 'Open forecast chart', action: 'forecast' });
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'what_if') {
    if (simulation) {
      const { result, scenarioLabel, overridesSummary } = simulation;
      environmental.push(...overridesSummary);
      assessment.push(
        `Simulated personal index **${result.after.score}/100 (${result.after.level})** vs live **${result.before.score}/100 (${result.before.level})** — a change of ${result.delta > 0 ? '+' : ''}${result.delta} points.`,
      );
      const topChanged = result.before.topFactors[0]?.factor !== result.after.topFactors[0]?.factor;
      assessment.push(
        `Dominant factor would ${topChanged ? `shift from ${result.before.topFactors[0]?.factor.toLowerCase()} to ${result.after.topFactors[0]?.factor.toLowerCase()}` : `remain ${result.after.topFactors[0]?.factor.toLowerCase()}`}.`,
      );
      recommendations.push('Open the What-If Simulator to adjust the scenario further; the live data is never modified by simulations.');
      text = [
        `### Your active simulation: ${scenarioLabel}`,
        '',
        `**How would the risk change if these conditions occurred?** Under this scenario the index moves ${result.delta > 0 ? 'up' : result.delta < 0 ? 'down' : 'not at all'}.`,
        '',
        FACT_SECTIONS.env,
        ...environmental.map((e) => `- ${e}`),
        '',
        FACT_SECTIONS.assess,
        ...assessment.map((a) => `- ${a}`),
        '',
        FACT_SECTIONS.rec,
        ...recommendations.map((r) => `- ${r}`),
        '',
        '_Scenario exploration only — not a forecast or medical assessment._',
      ].join('\n');
      actions.push({ label: 'Open What-If Simulator', action: 'what-if' });
      return { text, riskScore: result.after.score, riskLevel: result.after.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
    }

    // No active simulation: run a lightweight inline +5°C scenario from live data.
    const delta = risk.result && risk.baselineScore !== undefined ? plus5CEstimate(context) : null;
    if (delta === null) {
      text = `I don't have enough live metrics for ${city} to estimate a +5°C scenario yet. Please wait for the live telemetry to load and try again.`;
      return base('', [], [], text, context);
    }
    environmental.push(`Live feels-like ${m.temperature.feelsLike}°C, wet-bulb ${m.wetBulb.tempC}°C`);
    assessment.push(
      `A hypothetical +5°C (everything else unchanged) would move your personal index from ${risk.score} to about **${delta.after}** (${delta.after - risk.score > 0 ? '+' : ''}${delta.after - risk.score} points) — ${levelPhrase(delta.level)} band.`,
    );
    recommendations.push('Run the full What-If Simulator to combine temperature with humidity, UV, wind and PM2.5 adjustments.');
    text = [
      `### What if temperature increases by 5°C?`,
      '',
      `**How would the risk change if these conditions occurred?** Estimated from the live snapshot for ${city}:`,
      '',
      FACT_SECTIONS.env,
      ...environmental.map((e) => `- ${e}`),
      '',
      FACT_SECTIONS.assess,
      ...assessment.map(a => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map(r => `- ${r}`),
      '',
      '_Scenario estimate on live data — not a forecast._',
    ].join('\n');
    actions.push({ label: 'Open What-If Simulator', action: 'what-if' });
    return { text, riskScore: delta.after, riskLevel: delta.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'why_increase') {
    const profileDelta = risk.result?.profileDelta ?? 0;
    const impacts = risk.result?.factorImpacts ?? [];
    assessment.push(
      profileDelta > 0
        ? `Your personal profile adds **+${profileDelta} points** over the general-population baseline of ${risk.baselineScore}.`
        : `Your profile currently does not add points over the general baseline (${risk.baselineScore}).`,
    );
    if (impacts.length > 0) {
      assessment.push(`Largest profile contributions: ${impacts.slice(0, 3).map((i) => `${i.factor} (+${i.pointsAdded})`).join(', ')}.`);
    }
    environmental.push(
      `Current top contributors: ${risk.drivers.slice(0, 2).map((d) => `${d.factor} (${d.contributionPercent}%)`).join(', ')}.`,
    );
    if (warnings.length > 0) {
      environmental.push(`Upcoming warning windows that could raise it further: ${warnings.map((w) => `${w.windowLabel} ${w.level}`).join(', ')}.`);
    }
    recommendations.push('If conditions change later, the index updates automatically from live telemetry — no action needed.');
    text = [
      `### Why did your risk increase?`,
      '',
      `The index moves when **live conditions or your profile** change. For ${city} right now:`,
      '',
      FACT_SECTIONS.env,
      ...environmental.map((e) => `- ${e}`),
      '',
      FACT_SECTIONS.assess,
      ...assessment.map((a) => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map((r) => `- ${r}`),
      '',
      '_Experimental index — not an official classification._',
    ].join('\n');
    actions.push({ label: 'Inspect personal profile', action: 'dashboard' });
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'air_quality') {
    environmental.push(`US AQI ${m.airQuality.aqi} — ${m.airQuality.category}`);
    environmental.push(`PM2.5 ${m.airQuality.pm25} µg/m³ · PM10 ${m.airQuality.pm10} µg/m³`);
    environmental.push(`NO₂ ${m.airQuality.no2} · O₃ ${m.airQuality.o3} · SO₂ ${m.airQuality.so2} · CO ${m.airQuality.co} (µg/m³)`);
    const aqiShare = risk.drivers.find((d) => d.factor.toLowerCase().includes('air'));
    assessment.push(
      aqiShare
        ? `Air quality contributes ${aqiShare.contributionPercent}% of your composite index (${risk.score}/100, ${levelPhrase(risk.level)}).`
        : `Air quality is currently a minor contributor to your ${risk.score}/100 index.`,
    );
    if (m.airQuality.aqi > 100) {
      recommendations.push('Reduce outdoor exertion and keep windows closed during the pollutant peak; filtration helps indoors.');
    } else if (m.airQuality.aqi > 50) {
      recommendations.push('Fine for most people; sensitive profiles should watch for symptoms during prolonged exertion.');
    } else {
      recommendations.push('Air quality is in the good band — no specific precautions needed.');
    }
    text = [
      `### Air quality in ${city}`,
      '',
      FACT_SECTIONS.env,
      ...environmental.map((e) => `- ${e}`),
      '',
      FACT_SECTIONS.assess,
      ...assessment.map((a) => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map((r) => `- ${r}`),
    ].join('\n');
    actions.push({ label: 'Open data sources', action: 'data-sources' });
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'weather_now') {
    environmental.push(`Temperature ${m.temperature.current}°C (feels like ${m.temperature.feelsLike}°C)`);
    environmental.push(`Humidity ${m.humidity.percentage}% (${m.humidity.comfortLevel}), wet-bulb ${m.wetBulb.tempC}°C (${m.wetBulb.category})`);
    environmental.push(`Wind ${m.wind.speedKmh} km/h ${m.wind.direction}, UV ${m.uv.index} (${m.uv.category})`);
    environmental.push(`Precipitation probability ${m.rain.probability}%, pressure ${m.pressure.hPa} hPa`);
    assessment.push(`Composite personal index ${risk.score}/100 (${levelPhrase(risk.level)}), dominated by ${topDriver?.factor.toLowerCase() ?? 'multiple factors'}.`);
    recommendations.push('No weather-specific precautions beyond the factor guidance above.');
    text = [
      `### Current conditions in ${city}`,
      '',
      FACT_SECTIONS.env,
      ...environmental.map((e) => `- ${e}`),
      '',
      FACT_SECTIONS.assess,
      ...assessment.map((a) => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map((r) => `- ${r}`),
    ].join('\n');
    actions.push({ label: 'Open dashboard', action: 'dashboard' });
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'warnings') {
    if (warnings.length === 0) {
      text = [
        `### Early warnings for ${city}`,
        '',
        `✅ Conditions currently look relatively safe — no early-warning windows detected in the next 24 hours for your profile thresholds.`,
        '',
        FACT_SECTIONS.assess,
        `- Personal index ${risk.score}/100 (${levelPhrase(risk.level)}); hourly range ${Math.min(...hourlyForecast.map((h) => h.riskScore))}–${Math.max(...hourlyForecast.map((h) => h.riskScore))}/100.`,
        '',
        FACT_SECTIONS.rec,
        '- Normal outdoor routines can proceed with standard precautions.',
      ].join('\n');
      return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
    }
    environmental.push(...warnings.map((w) => `${w.level} — ${w.cause}, expected ${w.windowLabel}, index ${w.riskScore}/100`));
    assessment.push(`${warnings.length} warning window(s) in the next 24h; peak period flagged: ${warnings.find((w) => w.isPeakPeriod)?.windowLabel ?? '—'}.`);
    recommendations.push(...warnings.slice(0, 3).map((w) => `${w.windowLabel}: ${w.action}`));
    text = [
      `### Early warnings for ${city} (next 24h)`,
      '',
      FACT_SECTIONS.env,
      ...environmental.map((e) => `- ${e}`),
      '',
      FACT_SECTIONS.assess,
      ...assessment.map((a) => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map((r) => `- ${r}`),
      '',
      '_Experimental environmental alerts — not official medical or government warnings._',
    ].join('\n');
    actions.push({ label: 'Open early-warning outlook', action: 'alerts' });
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'profile') {
    const describeProfileLine = describeProfile(profile);
    assessment.push(`Profile: ${describeProfileLine}.`);
    if (topImpacts.length > 0) {
      assessment.push(`Currently raising your index: ${topImpacts.map((i) => `${i.factor} (+${i.pointsAdded})`).join(', ')}.`);
    } else {
      assessment.push('No profile factor currently raises your index above the general baseline.');
    }
    recommendations.push('Adjust your profile on the dashboard to see how sensitivities change your personal index.');
    text = [
      `### Your personal risk profile`,
      '',
      FACT_SECTIONS.assess,
      ...assessment.map((a) => `- ${a}`),
      '',
      FACT_SECTIONS.rec,
      ...recommendations.map((r) => `- ${r}`),
      '',
      '_Self-reported context — not clinical data._',
    ].join('\n');
    actions.push({ label: 'Edit profile on dashboard', action: 'dashboard' });
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  if (intent === 'capabilities') {
    text = [
      `### What I can do`,
      '',
      `I answer from **${city} live telemetry** and your personal profile — environmental information, experimental risk assessment, and general safety guidance. Ask me things like:`,
      '',
      '- "Why is my risk high?"',
      '- "Is it safe to go outside?"',
      '- "When is the safest time today?"',
      '- "What if temperature increases by 5°C?"',
      '- "Which environmental factor is most dangerous right now?"',
      '',
      'I do not provide medical diagnosis, treatment, or emergency advice. If data is missing, I say so instead of inventing it.',
    ].join('\n');
    return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
  }

  // Unknown question: answer with what we DO know, honestly.
  text = [
    `### About ${city} right now`,
    '',
    `I didn't find a specific match for that question, so here is the current snapshot — I won't invent specifics I can't verify.`,
    '',
    FACT_SECTIONS.env,
    `- Temperature ${m.temperature.current}°C (feels like ${m.temperature.feelsLike}°C), humidity ${m.humidity.percentage}%`,
    `- AQI ${m.airQuality.aqi} (${m.airQuality.category}), PM2.5 ${m.airQuality.pm25} µg/m³, UV ${m.uv.index}`,
    `- Wind ${m.wind.speedKmh} km/h, rain probability ${m.rain.probability}%`,
    '',
    FACT_SECTIONS.assess,
    `- Personal index ${risk.score}/100 (${levelPhrase(risk.level)}), top factor ${topDriver?.factor ?? 'unavailable'}.`,
    warnings.length > 0 ? `- ${warnings.length} early-warning window(s) in the next 24h.` : '- No early-warning windows in the next 24h.',
    '',
    FACT_SECTIONS.rec,
    '- Rephrase with a specific factor (heat, air quality, UV, wind, rain) or ask "what can you do?" for examples.',
  ].join('\n');
  return { text, riskScore: risk.score, riskLevel: risk.level, environmental, assessment, recommendations, citations: citations(context), actions, providerLabel: 'Context Engine (local)' };
};

/* ---------------- Small shared helpers ---------------- */

const citations = (context: AssistantContext): string[] => [
  `Open-Meteo live telemetry · ${context.location.city}`,
  `CSRI v3.1-personal · observed ${context.observedAt ?? 'syncing…'}`,
  context.simulation ? 'What-If simulation (temporary copy)' : 'Personal profile applied',
];

const base = (a: string, b: string[], c: string[], text: string, context: AssistantContext): AssistantReply => ({
  text,
  riskScore: context.risk.score,
  riskLevel: context.risk.level,
  environmental: b,
  assessment: c,
  recommendations: [],
  citations: citations(context),
  actions: [{ label: 'Open dashboard', action: 'dashboard' }],
  providerLabel: 'Context Engine (local)',
});

/** Lightweight inline +5°C estimate (used when no What-If sim is active). */
const plus5CEstimate = (context: AssistantContext): { after: number; level: string } | null => {
  const m = context.metrics;
  if (!m || context.risk.score === undefined) return null;
  const temp = m.temperature.current + 5;
  const humidity = m.humidity.percentage;
  const wetBulb =
    temp * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
    Math.atan(temp + humidity) -
    Math.atan(humidity - 1.676331) +
    0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) -
    4.686035;
  // Approximate the thermal component's response with the same linear
  // relationship used by the CSRI thermal scorer.
  const beforeFeels = m.temperature.feelsLike;
  const afterFeels = beforeFeels + 5;
  const beforeThermal = Math.min(100, Math.max(0, (beforeFeels - 24) * 2.2 + Math.max(0, humidity - 55) * 0.8));
  const afterThermal = Math.min(100, Math.max(0, (afterFeels - 24) * 2.2 + Math.max(0, humidity - 55) * 0.8));
  const thermalWeight = 0.30;
  const afterScore = Math.round(Math.min(100, context.risk.score + (afterThermal - beforeThermal) * thermalWeight));
  return { after: afterScore, level: bandOf(afterScore) };
};

const describeProfile = (p: UserProfile): string =>
  `${p.ageGroup}, ${p.outdoorActivityLevel} outdoor activity, ${p.sensitivityToHeat} heat sensitivity, ${p.sensitivityToAirPollution} air-pollution sensitivity` +
  (p.vulnerabilityFactors.length > 0 ? `, ${p.vulnerabilityFactors.length} vulnerability factor(s)` : ', no vulnerability factors');
