import React, { useEffect, useState } from 'react';
import { Cpu, FileSearch, ShieldCheck, Scale, CheckCircle2 } from 'lucide-react';

interface AuditPipelineAnimationProps {
  country: string;
}

const STEPS = [
  {
    id: 1,
    title: 'Multimodal Document Ingestion & OCR',
    subtitle: 'Extracting Shipper, Consignee, B/L numbers & Declared Values',
    icon: FileSearch,
    durationMs: 800,
  },
  {
    id: 2,
    title: 'Harmonized Tariff (HTS) Cross-Validation',
    subtitle: 'Resolving 6-10 digit HS Codes against destination tariff schedule',
    icon: Scale,
    durationMs: 1000,
  },
  {
    id: 3,
    title: 'Dangerous Goods & Strategic Export Controls',
    subtitle: 'Screening UN3480 DG HazMat, Wassenaar dual-use & Section 301/CBAM',
    icon: ShieldCheck,
    durationMs: 1200,
  },
  {
    id: 4,
    title: 'Autonomous Synthesis & Risk Scoring',
    subtitle: 'Synthesizing decision (APPROVED / FLAGGED / REJECTED) and action items',
    icon: Cpu,
    durationMs: 800,
  },
];

export const AuditPipelineAnimation: React.FC<AuditPipelineAnimationProps> = ({ country }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background radar sweep glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="text-center max-w-lg mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Autonomous Compliance Loop Active</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">
          Cross-Border Logistics Regulatory Audit in Progress
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Evaluating consignment manifest against <strong className="text-emerald-400">{country}</strong> statutory import controls using Gemini 3.8 Flash.
        </p>
      </div>

      {/* Step pipeline cards */}
      <div className="max-w-xl mx-auto space-y-3">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < activeStep;
          const isCurrent = idx === activeStep;

          let cardBorder = 'border-slate-800/80 bg-slate-950/40 opacity-50';
          let iconColor = 'text-slate-600 bg-slate-900';

          if (isCompleted) {
            cardBorder = 'border-emerald-500/40 bg-emerald-950/20 opacity-90';
            iconColor = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30';
          } else if (isCurrent) {
            cardBorder = 'border-emerald-500 bg-slate-950 shadow-lg ring-1 ring-emerald-500/30 opacity-100';
            iconColor = 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 animate-pulse';
          }

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${cardBorder}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Stage 0{step.id}
                    </span>
                    <h4 className="text-xs font-bold text-white">{step.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{step.subtitle}</p>
                </div>
              </div>

              <div className="shrink-0 text-xs font-mono font-medium">
                {isCompleted ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Verified</span>
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="hidden sm:inline">Processing</span>
                  </span>
                ) : (
                  <span className="text-slate-600">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-[11px] text-slate-500 font-mono">
        Average execution latency: ~1.2s • Zero data leakage guarantee
      </div>
    </div>
  );
};
