import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChatMessage, RiskLevel } from '../types/climate';
import { useClimate } from './ClimateContext';
import {
  AssistantContext,
  AssistantProvider,
  AssistantReply,
  resolveProvider,
} from '../services/assistantProvider';
import { getActiveSimulation } from '../utils/whatIfSimulator';

interface AIContextType {
  messages: ChatMessage[];
  isGenerating: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => void;
  quickPrompts: string[];
  /** Which provider is currently answering (shown in the UI mode chip). */
  providerLabel: string;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentDataset,
    currentLocation,
    activeRiskResult,
    activeRiskScore,
    activeRiskLevel,
    baselineRiskScore,
    userProfile,
    peakRiskSummary,
    earlyWarnings,
    liveDataInfo,
    activeAlerts,
  } = useClimate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [providerLabel, setProviderLabel] = useState<string>('Context Engine (local)');

  // The provider is resolved once; swapping implementations later (e.g. a
  // real LLM proxy) requires no changes anywhere else in the app.
  const providerRef = useRef<AssistantProvider | null>(null);
  if (providerRef.current === null) {
    providerRef.current = resolveProvider();
    setProviderLabel(providerRef.current.label);
  }

  /**
   * The CURRENT ClimateShield context, rebuilt on every relevant state change.
   * This is the single object any provider (local or LLM) receives — answers
   * are always grounded in the selected location's real live data.
   */
  const assistantContext: AssistantContext = useMemo(
    () => ({
      location: {
        city: currentLocation.city,
        state: currentLocation.state || undefined,
        country: currentLocation.country,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      },
      observedAt: liveDataInfo.observedAt,
      metrics: currentDataset.metrics,
      risk: {
        score: activeRiskScore,
        level: activeRiskLevel,
        baselineScore: baselineRiskScore,
        result: activeRiskResult,
        drivers: currentDataset.riskDrivers,
      },
      hourlyForecast: currentDataset.hourlyForecast,
      peakRiskSummary,
      warnings: earlyWarnings,
      profile: userProfile,
      simulation: getActiveSimulation(),
      alerts: activeAlerts,
    }),
    [
      currentLocation,
      liveDataInfo.observedAt,
      currentDataset.metrics,
      currentDataset.riskDrivers,
      currentDataset.hourlyForecast,
      activeRiskResult,
      activeRiskScore,
      activeRiskLevel,
      baselineRiskScore,
      peakRiskSummary,
      earlyWarnings,
      userProfile,
      activeAlerts,
    ],
  );

  // Suggested questions (requirement #5) — context-aware, demo-friendly.
  const quickPrompts = useMemo(
    () => [
      'Why is my risk high?',
      'Is it safe to go outside?',
      'What is causing my risk score?',
      'When is the safest time today?',
      'What if temperature increases by 5°C?',
      'Which environmental factor is most dangerous right now?',
      'Any active warnings for the next 24 hours?',
    ],
    [],
  );

  // Welcome message: rebuilt when the location changes so it reflects the
  // current city, live score and profile.
  useEffect(() => {
    if (messages.length === 0) {
      const m = currentDataset.metrics;
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          text: `👋 **I am ShieldAI**, your Climate Intelligence Assistant.\n\nI am connected to **live telemetry for ${currentLocation.city}, ${currentLocation.country}** and your personal risk profile.\n\n- **Personal risk index:** ${activeRiskScore}/100 (${activeRiskLevel}) — experimental, not an official classification\n- **Main factor right now:** ${currentDataset.riskDrivers[0]?.factor ?? 'computing…'}\n- **Conditions:** ${m.temperature.current}°C (feels ${m.temperature.feelsLike}°C), AQI ${m.airQuality.aqi}, UV ${m.uv.index}, ${m.humidity.percentage}% humidity\n${earlyWarnings.length > 0 ? `- **⚠ ${earlyWarnings.length} early-warning window(s)** in the next 24h\n` : '- No early-warning windows in the next 24h\n'}\nI separate **environmental information**, **risk assessment** and **general safety recommendations** in every answer. I do not provide medical diagnosis or emergency advice — and if data is missing, I say so rather than guess.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          riskBadge: {
            score: activeRiskScore,
            level: activeRiskLevel,
          },
          citations: ['Open-Meteo live telemetry', 'CSRI v3.1-personal'],
          quickActions: [
            { label: 'View Live Risk', action: 'live-risk' },
            { label: 'Early-Warning Outlook', action: 'alerts' },
          ],
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation.city]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);

      const provider = providerRef.current ?? resolveProvider();
      setProviderLabel(provider.label);

      const history = messages.slice(-8);
      const snapshot = assistantContext;

      try {
        const reply: AssistantReply = await provider.generate(text, snapshot, history);

        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: reply.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          riskBadge: { score: reply.riskScore, level: reply.riskLevel as RiskLevel },
          recommendations: reply.recommendations,
          citations: reply.citations,
          quickActions: reply.actions,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠ I could not reach the assistant provider. Your question was: "${text}". The local context engine is the default provider — please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsGenerating(false);
      }
    },
    [assistantContext, messages, isGenerating],
  );

  const clearHistory = useCallback(() => setMessages([]), []);

  return (
    <AIContext.Provider
      value={{
        messages,
        isGenerating,
        sendMessage,
        clearHistory,
        quickPrompts,
        providerLabel,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
