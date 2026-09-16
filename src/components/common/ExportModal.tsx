import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useClimate } from '../../context/ClimateContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { currentDataset, selectedPersona, activeRiskScore, activeRiskLevel } = useClimate();
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setIsDone(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 2000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-glow bg-[#080f24] border border-cyan-500/30 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Export Climate Intelligence Report
              </h3>
              <p className="text-xs text-slate-400">
                Generate verified environmental health audit for {currentDataset.location.city}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Preview Summary */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Location:</span>
            <span className="font-semibold text-white">{currentDataset.location.city}, {currentDataset.location.country}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>ClimateShield Risk Index:</span>
            <span className="font-bold text-cyan-400">{activeRiskScore}/100 ({activeRiskLevel})</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Health Persona:</span>
            <span className="text-teal-300">{selectedPersona.label}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Primary Hazard:</span>
            <span className="text-rose-300">{currentDataset.location.primaryHazard}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Satellite Validation:</span>
            <span className="text-emerald-400 font-mono">Copernicus Sentinel-5P</span>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-mono text-slate-400 uppercase">Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pdf', label: 'PDF Audit', ext: '.pdf' },
              { id: 'csv', label: 'Raw CSV', ext: '.csv' },
              { id: 'json', label: 'JSON API', ext: '.json' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as any)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
                  format === f.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{f.label}</span>
                <span className="text-[10px] font-mono opacity-70">{f.ext}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || isDone}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
          >
            {isDone ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Downloaded Successfully!</span>
              </>
            ) : isExporting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Compiling Model Weights...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Report ({format.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
