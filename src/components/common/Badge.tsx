import React from 'react';
import { RiskLevel } from '../../types/climate';
import { getRiskColor } from '../../utils/formatters';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'risk' | 'status' | 'hazard' | 'outline' | 'glow';
  riskLevel?: RiskLevel;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'risk',
  riskLevel = 'MODERATE',
  className = '',
  size = 'md',
}) => {
  const riskColors = getRiskColor(riskLevel);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-mono font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-mono font-semibold tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 rounded-xl font-mono font-bold tracking-wider',
  };

  if (variant === 'risk') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 border ${riskColors.bg} ${riskColors.text} ${riskColors.border} ${riskColors.glow} ${sizeClasses[size]} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {children || riskLevel}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-slate-800/80 text-cyan-300 border border-cyan-500/20 ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};
