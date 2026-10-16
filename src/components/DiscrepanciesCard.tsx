import React, { useState } from 'react';
import { DiscrepancyItem } from '../types/compliance';
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, Scale, ExternalLink } from 'lucide-react';

interface DiscrepanciesCardProps {
  discrepancies: string[];
  discrepancyDetails: DiscrepancyItem[];
}

export const DiscrepanciesCard: React.FC<DiscrepanciesCardProps> = ({
  discrepancies,
  discrepancyDetails,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // Fallback if discrepancyDetails is empty but discrepancies string array is present
  const items: DiscrepancyItem[] =
    discrepancyDetails && discrepancyDetails.length > 0
      ? discrepancyDetails
      : discrepancies.map((desc, idx) => ({
          code: `DISC-${idx + 1}`,
          severity: desc.toLowerCase().includes('critical') || desc.toLowerCase().includes('license')
            ? 'HIGH'
            : desc.toLowerCase().includes('tariff') || desc.toLowerCase().includes('missing')
            ? 'MEDIUM'
            : 'LOW',
          title: desc.split(':')[0] || 'Compliance Variance',
          description: desc,
          regulation_ref: 'General Import & Customs Regulations',
        }));

  const filteredItems = items.filter((item) => {
    if (filter === 'ALL') return true;
    return item.severity === filter;
  });

  const highCount = items.filter((i) => i.severity === 'HIGH').length;
  const medCount = items.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = items.filter((i) => i.severity === 'LOW').length;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Compliance Discrepancies & Regulatory Variances ({items.length})
          </h3>
        </div>

        {/* Severity filter badges */}
        {items.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            {highCount > 0 && (
              <button
                onClick={() => setFilter('HIGH')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  filter === 'HIGH'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                High ({highCount})
              </button>
            )}
            {medCount > 0 && (
              <button
                onClick={() => setFilter('MEDIUM')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  filter === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                Medium ({medCount})
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-5">
        {items.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">Zero Compliance Discrepancies Detected</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              All line items, HS tariff classifications, valuation Incoterms, and mandatory regulatory declarations align with import requirements.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, idx) => {
              let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
              let icon = <Info className="w-4 h-4 text-slate-400 shrink-0" />;

              if (item.severity === 'HIGH') {
                badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
                icon = <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
              } else if (item.severity === 'MEDIUM') {
                badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
              }

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${badgeColor}`}>
                            {item.severity} SEVERITY
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">{item.code}</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 mt-1.5">{item.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      {item.regulation_ref && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1 font-mono">
                            <Scale className="w-3 h-3 text-slate-400" />
                            Statute: <strong className="text-slate-200">{item.regulation_ref}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
