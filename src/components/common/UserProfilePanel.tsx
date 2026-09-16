import React from 'react';
import { Info, UserCheck, RotateCcw } from 'lucide-react';
import { useClimate } from '../../context/ClimateContext';
import { UserProfile } from '../../types/climate';
import { VULNERABILITY_FACTORS, describeProfile } from '../../utils/personalProfile';

const DEFAULT_PROFILE: UserProfile = {
  ageGroup: 'adult',
  outdoorActivityLevel: 'moderate',
  sensitivityToHeat: 'medium',
  sensitivityToAirPollution: 'medium',
  vulnerabilityFactors: [],
};

const AGE_GROUPS: Array<{ id: UserProfile['ageGroup']; label: string; hint: string }> = [
  { id: 'child', label: 'Child', hint: 'Under 13' },
  { id: 'teen', label: 'Teen', hint: '13-19' },
  { id: 'adult', label: 'Adult', hint: '20-64' },
  { id: 'senior', label: 'Senior', hint: '65+' },
];

const ACTIVITY_LEVELS: Array<{ id: UserProfile['outdoorActivityLevel']; label: string; hint: string }> = [
  { id: 'low', label: 'Low', hint: 'Mostly indoors' },
  { id: 'moderate', label: 'Moderate', hint: 'Daily walks, errands' },
  { id: 'high', label: 'High', hint: 'Regular outdoor sport or work' },
];

const SENSITIVITY_LEVELS: Array<{ id: UserProfile['sensitivityToHeat']; label: string; hint: string }> = [
  { id: 'low', label: 'Low', hint: 'Rarely bothered' },
  { id: 'medium', label: 'Medium', hint: 'Average tolerance' },
  { id: 'high', label: 'High', hint: 'Heat affects me quickly' },
];

export const UserProfilePanel: React.FC = () => {
  const { userProfile, setUserProfile, activeRiskResult } = useClimate();
  const personal = activeRiskResult;

  const update = (partial: Partial<UserProfile>) => setUserProfile({ ...userProfile, ...partial });

  const toggleFactor = (id: (typeof VULNERABILITY_FACTORS)[number]['id']) => {
    const exists = userProfile.vulnerabilityFactors.some((f) => f.id === id);
    const next = exists
      ? userProfile.vulnerabilityFactors.filter((f) => f.id !== id)
      : [...userProfile.vulnerabilityFactors, { id }];
    update({ vulnerabilityFactors: next });
  };

  return (
    <section className="rounded-3xl glass-panel-glow bg-gradient-to-r from-teal-950/30 via-slate-900/80 to-cyan-950/20 border border-teal-500/25 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-300">
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Personal Risk Profile</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Shapes how live conditions translate into your personal risk index.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 max-w-[320px] truncate" title={describeProfile(userProfile)}>
            {describeProfile(userProfile)}
          </span>
          <button
            onClick={() => setUserProfile({ ...DEFAULT_PROFILE })}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Reset profile to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selection grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age group */}
        <SelectorRow
          label="Age group"
          options={AGE_GROUPS}
          value={userProfile.ageGroup}
          onSelect={(ageGroup) => update({ ageGroup })}
        />
        {/* Activity */}
        <SelectorRow
          label="Outdoor activity level"
          options={ACTIVITY_LEVELS}
          value={userProfile.outdoorActivityLevel}
          onSelect={(outdoorActivityLevel) => update({ outdoorActivityLevel })}
        />
        {/* Heat sensitivity */}
        <SelectorRow
          label="Sensitivity to heat"
          options={SENSITIVITY_LEVELS}
          value={userProfile.sensitivityToHeat}
          onSelect={(sensitivityToHeat) => update({ sensitivityToHeat })}
        />
        {/* Air sensitivity */}
        <SelectorRow
          label="Sensitivity to air pollution"
          options={SENSITIVITY_LEVELS.map((s) => ({ ...s, id: s.id as UserProfile['sensitivityToAirPollution'] }))}
          value={userProfile.sensitivityToAirPollution}
          onSelect={(sensitivityToAirPollution) => update({ sensitivityToAirPollution })}
        />
      </div>

      {/* Vulnerability factors */}
      <div className="mt-4">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
          Optional vulnerability factors
        </div>
        <div className="flex flex-wrap gap-2">
          {VULNERABILITY_FACTORS.map((factor) => {
            const active = userProfile.vulnerabilityFactors.some((f) => f.id === factor.id);
            return (
              <button
                key={factor.id}
                onClick={() => toggleFactor(factor.id)}
                title={factor.description}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.25)]'
                    : 'bg-slate-900/70 border-slate-700 text-slate-400 hover:text-white hover:border-teal-500/40'
                }`}
              >
                {factor.label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">
          Self-reported context only — optional and never used for medical assessment.
        </p>
      </div>

      {/* Profile impact summary */}
      {personal && personal.factorImpacts.length > 0 && (
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-mono font-bold text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Which profile factors increased your risk (live conditions)
          </div>
          <div className="flex flex-wrap gap-2">
            {personal.factorImpacts.map((impact) => (
              <span
                key={impact.factor}
                title={`${impact.detail} — affects ${impact.componentLabel.toLowerCase()}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-mono text-rose-200"
              >
                {impact.factor}
                <span className="text-rose-400 font-bold">+{impact.pointsAdded}</span>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Compared with the general-population index of {personal.baselineScore}/100.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          The personal index is an experimental environmental estimate based on your selected profile and live
          Open-Meteo data. It is not a medical diagnosis and not an official government classification.
        </span>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Generic option-row subcomponent                                    */
/* ------------------------------------------------------------------ */

interface Option<T extends string> {
  id: T;
  label: string;
  hint: string;
}

function SelectorRow<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: Array<Option<T>>;
  value: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div>
      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            title={opt.hint}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              value === opt.id
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900/70 border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/40'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
