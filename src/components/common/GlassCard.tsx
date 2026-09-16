import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'amber' | 'rose' | 'emerald' | 'teal' | 'none';
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none',
  hoverEffect = false,
  ...props
}) => {
  const glowStyles = {
    none: '',
    cyan: 'border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.12)]',
    teal: 'border-teal-500/30 shadow-[0_0_25px_rgba(20,184,166,0.12)]',
    amber: 'border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.12)]',
    rose: 'border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.15)]',
    emerald: 'border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.12)]',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'glass-panel rounded-2xl p-5 relative overflow-hidden transition-all duration-300',
          glowStyles[glow],
          hoverEffect && 'glass-panel-hover cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
