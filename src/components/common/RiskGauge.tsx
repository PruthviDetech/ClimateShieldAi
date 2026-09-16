import React from 'react';
import { RiskLevel } from '../../types/climate';
import { getRiskColor } from '../../utils/formatters';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  /** Optional live comparison vs the previous fetch. No fake defaults. */
  showDelta?: boolean;
  delta?: number;
  sublabel?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level,
  size = 'lg',
  showDelta = false,
  delta = 0,
  sublabel = 'Experimental Environmental Risk Index'
}) => {
  const colors = getRiskColor(level);

  // Dimensions
  const dimMap = {
    sm: { size: 100, stroke: 8, fontSize: 'text-2xl', labelSize: 'text-[10px]' },
    md: { size: 150, stroke: 10, fontSize: 'text-4xl', labelSize: 'text-xs' },
    lg: { size: 210, stroke: 14, fontSize: 'text-5xl', labelSize: 'text-sm' },
    hero: { size: 260, stroke: 16, fontSize: 'text-6xl', labelSize: 'text-base' },
  };

  const current = dimMap[size];
  const radius = (current.size - current.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // Make gauge an open arc (270 degrees or full circle)
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: current.size, height: current.size }}
      >
        <svg
          className="transform -rotate-90"
          width={current.size}
          height={current.size}
        >
          {/* Background Track */}
          <circle
            cx={current.size / 2}
            cy={current.size / 2}
            r={radius}
            stroke="rgba(30, 41, 59, 0.6)"
            strokeWidth={current.stroke}
            fill="transparent"
          />

          {/* Active Gradient Track */}
          <circle
            cx={current.size / 2}
            cy={current.size / 2}
            r={radius}
            stroke="url(#riskGradient)"
            strokeWidth={current.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />

          <defs>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="85%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="flex items-baseline justify-center gap-1 font-mono font-black">
            <span className={`${current.fontSize} text-white tracking-tight`}>
              {score}
            </span>
            <span className="text-slate-400 text-sm font-semibold">/100</span>
          </div>

          <div
            className={`mt-1 font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full text-xs border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {level}
          </div>

          {showDelta && delta !== 0 && (
            <div className={`mt-1 flex items-center gap-1 text-[11px] font-mono ${delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <span>{delta > 0 ? `+${delta}` : delta}%</span>
              <span className="text-slate-400 text-[9px]">vs last sync</span>
            </div>
 )}
        </div>
      </div>

      {sublabel && (
        <p className="mt-2 text-xs text-slate-400 text-center font-medium max-w-[200px]">
          {sublabel}
        </p>
      )}
    </div>
  );
};
