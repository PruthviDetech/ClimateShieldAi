import { RiskLevel } from '../types/climate';

/**
 * ClimateShield Risk Index color tokens, per band.
 * Bands: LOW < 40 | MODERATE 40-59 | HIGH 60-79 | SEVERE >= 80
 */
export function getRiskColor(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  glow: string;
  gradient: string;
} {
  switch (level) {
    case 'LOW':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
        gradient: 'from-emerald-500 to-teal-400',
      };
    case 'MODERATE':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
        gradient: 'from-amber-500 to-yellow-400',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-500/15',
        text: 'text-orange-400',
        border: 'border-orange-500/40',
        glow: 'shadow-[0_0_25px_rgba(249,115,22,0.3)]',
        gradient: 'from-orange-500 to-amber-500',
      };
    case 'SEVERE':
      return {
        bg: 'bg-purple-500/20',
        text: 'text-purple-300',
        border: 'border-purple-500/50',
        glow: 'shadow-[0_0_35px_rgba(168,85,247,0.45)]',
        gradient: 'from-purple-600 via-rose-500 to-red-600',
      };
    default:
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]',
        gradient: 'from-cyan-500 to-blue-500',
      };
  }
}

/** Threshold-based band mapping for the 0-100 ClimateShield Risk Index. */
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score < 40) return 'LOW';
  if (score < 60) return 'MODERATE';
  if (score < 80) return 'HIGH';
  return 'SEVERE';
}

export function formatTemp(tempC: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  }
  return `${tempC.toFixed(1)}°C`;
}

export function getAQICategory(aqi: number): {
  label: string;
  colorClass: string;
} {
  if (aqi <= 50) return { label: 'Good', colorClass: 'text-emerald-400' };
  if (aqi <= 100) return { label: 'Moderate', colorClass: 'text-amber-400' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', colorClass: 'text-orange-400' };
  if (aqi <= 200) return { label: 'Unhealthy', colorClass: 'text-rose-400' };
  if (aqi <= 300) return { label: 'Very Unhealthy', colorClass: 'text-purple-400' };
  return { label: 'Hazardous', colorClass: 'text-red-500' };
}
