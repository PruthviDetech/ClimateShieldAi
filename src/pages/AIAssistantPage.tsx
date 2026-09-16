import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  MapPin,
  Activity,
  HeartPulse,
  ArrowRight,
  Shield,
  HelpCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { useClimate } from '../context/ClimateContext';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

interface AIAssistantPageProps {
  setActiveTab: (tab: string) => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ setActiveTab }) => {
  const { messages, isGenerating, sendMessage, clearHistory, quickPrompts, providerLabel } = useAI();
  const { currentLocation, selectedPersona, activeRiskScore, activeRiskLevel } = useClimate();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleQuickPromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-[#040813] text-slate-100 py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-5rem)] animate-fade-in">
      
      {/* Header & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              ShieldAI Climate Assistant
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                {providerLabel.toUpperCase()}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Context-aware answers from live telemetry — environmental info, risk assessment & general safety guidance (no medical advice)
            </p>
          </div>
        </div>

        {/* Real-time sync tags */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentLocation.city}</span>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            <span>{activeRiskScore}/100</span>
          </span>
          <button
            onClick={clearHistory}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="py-3 overflow-x-auto flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Quick Prompts:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPromptClick(qp)}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-200 transition-all shrink-0 text-left max-w-xs truncate"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 py-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-mono text-slate-400">
                <span>{isUser ? 'You' : 'ShieldAI Intelligence'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-3xl p-5 text-xs leading-relaxed space-y-3 ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-medium rounded-tr-none shadow-lg'
                    : 'glass-panel-glow bg-[#091127] border border-cyan-500/25 text-slate-200 rounded-tl-none shadow-xl'
                }`}
              >
                {/* Markdown text representation */}
                <div className="whitespace-pre-line space-y-2">
                  {msg.text}
                </div>

                {/* AI Structured Recommendations */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <span className="text-cyan-300 font-bold block font-mono text-[11px] uppercase">
                      Actionable Safety Recommendations:
                    </span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                      {msg.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Citations & Verified Sources */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <span>Verified Telemetry:</span>
                    {msg.citations.map((cite, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                        {cite}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Action Navigation Chips */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {msg.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(qa.action)}
                        className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <span>{qa.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing / Generating Indicator */}
        {isGenerating && (
          <div className="flex flex-col items-start space-y-1">
            <div className="px-1 text-[11px] font-mono text-cyan-400">
              ShieldAI is synthesizing satellite datasets...
            </div>
            <div className="glass-panel p-4 rounded-2xl rounded-tl-none flex items-center gap-2 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce delay-150"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-300"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-800 shrink-0">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask ShieldAI about environmental risks, health precautions, or climate forecasts in ${currentLocation.city}...`}
            className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-900 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium placeholder-slate-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="absolute right-2 p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
};
