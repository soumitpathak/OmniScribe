import React from 'react';
import { DutyTariffEstimate } from '../types/compliance';
import { Percent, ShieldCheck, FileText, Leaf, Building2 } from 'lucide-react';

interface DutyTariffCardProps {
  tariffAnalysis?: DutyTariffEstimate;
  destinationCountry: string;
}

export const DutyTariffCard: React.FC<DutyTariffCardProps> = ({
  tariffAnalysis,
  destinationCountry,
}) => {
  if (!tariffAnalysis) return null;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Tariff Assessment & Partner Government Agencies (PGA)
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {destinationCountry} Schedule
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Duty Rate Estimate */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Estimated Tariff & Duty Rate
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
              {tariffAnalysis.estimated_duty_rate || '0.0% MFN'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium text-slate-500 block">Carbon / CBAM</span>
            <span
              className={`text-xs font-bold font-mono ${
                tariffAnalysis.cbam_or_carbon_applicable ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {tariffAnalysis.cbam_or_carbon_applicable ? '⚠️ Active CBAM Filing' : 'Exempt'}
            </span>
          </div>
        </div>

        {/* PGAs involved */}
        {tariffAnalysis.applicable_agencies && tariffAnalysis.applicable_agencies.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Partner Government Agencies (PGAs)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tariffAnalysis.applicable_agencies.map((agency, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200"
                >
                  🏛️ {agency}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special Permits */}
        {tariffAnalysis.special_permits_required && tariffAnalysis.special_permits_required.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Mandatory Permits & Certifications
            </span>
            <ul className="space-y-1">
              {tariffAnalysis.special_permits_required.map((permit, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 font-mono flex items-center gap-1.5 p-1.5 rounded bg-slate-950/40 border border-slate-800/60"
                >
                  <span className="text-amber-400">▪</span>
                  <span>{permit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
