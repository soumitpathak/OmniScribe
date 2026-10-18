import React, { useState } from 'react';
import { RecommendedAction, DiscrepancyItem } from '../types/compliance';
import {
  CheckSquare,
  Square,
  ArrowRightCircle,
  FileCheck2,
  Building,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ActionItemsCardProps {
  actions: string[];
  actionDetails: RecommendedAction[];
  destinationCountry?: string;
  discrepancies?: DiscrepancyItem[];
}

export const ActionItemsCard: React.FC<ActionItemsCardProps> = ({
  actions,
  actionDetails,
  destinationCountry = 'USA',
  discrepancies = [],
}) => {
  const toast = useToast();

  // Setup state for interactive checkboxes
  const initialItems: RecommendedAction[] =
    actionDetails && actionDetails.length > 0
      ? actionDetails.map((a, i) => ({ ...a, id: a.id || `act-${i}`, completed: false }))
      : actions.map((act, i) => ({
          id: `act-${i}`,
          priority:
            act.toLowerCase().includes('urgent') || act.toLowerCase().includes('immediately')
              ? 'URGENT'
              : act.toLowerCase().includes('obtain') || act.toLowerCase().includes('submit')
              ? 'REQUIRED'
              : 'ADVISORY',
          action: act,
          target_agency: 'Customs & Border Control',
          required_document: 'Customs Amendment Notice',
          completed: false,
        }));

  const [items, setItems] = useState<RecommendedAction[]>(initialItems);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);
  const [isSimulatingAI, setIsSimulatingAI] = useState<string | null>(null);

  const toggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = items.filter((i) => i.completed).length;

  // AI-suggested statutory mitigation advice tailored by destination country
  const getTailoredStatutoryAdvice = (action: RecommendedAction, country: string) => {
    const act = action.action.toLowerCase();
    const c = country.toUpperCase();

    if (act.includes('un 38.3') || act.includes('battery') || act.includes('lithium')) {
      return {
        authority: c === 'USA' ? 'U.S. DOT PHMSA & CBP' : c === 'EU' ? 'EASA & National Aviation/Maritime Authority' : 'Civil Aviation Authority & Port Security',
        statutoryFiling: c === 'USA' ? '49 CFR § 173.185(a) Test Summary Upload via ACE' : 'ICAO TI / IMDG Code Dangerous Goods Declaration',
        timeline: 'Before vessel departure / 48 hrs prior to entry filing',
        remedyStep: `Direct exporter factory QA to furnish an ISO 17025 accredited laboratory UN 38.3 summary. Declare UN3480 HazMat line with proper State of Charge (<30%) in ${country} clearance dossier.`,
      };
    }

    if (act.includes('section 301') || act.includes('tariff') || act.includes('7501') || act.includes('duty')) {
      return {
        authority: c === 'USA' ? 'CBP Automated Commercial Environment (ACE)' : 'Customs Declaration Service (CDS / TARIC)',
        statutoryFiling: c === 'USA' ? 'CBP Form 7501 Post-Summary Correction (PSC)' : 'TARIC Amendment Article 173 UCC',
        timeline: 'Within 300 days of entry or prior to liquidation',
        remedyStep: `Submit supplementary tariff classification line under chapter 99 remedies. Ensure calculated ad valorem deposits are deposited via ACH debit to avoid liquidated damages penalties under 19 CFR § 113.`,
      };
    }

    if (act.includes('tsca') || act.includes('chemical') || act.includes('epa')) {
      return {
        authority: 'EPA Office of Pollution Prevention & CBP',
        statutoryFiling: 'EPA TSCA Section 13 Positive Certification Statement',
        timeline: 'At time of formal electronic entry submission',
        remedyStep: `Validate chemical components against active TSCA Inventory. Provide certifying official digital signature stating all chemical substances in shipment comply with Section 13.`,
      };
    }

    if (act.includes('eudr') || act.includes('deforestation') || act.includes('polygon')) {
      return {
        authority: 'European Commission TRACES-NT Portal',
        statutoryFiling: 'EUDR Due Diligence Statement (DDS Ref)',
        timeline: 'Mandatory prior to entry release into EU Single Market',
        remedyStep: `Acquire origin farm geolocation polygon coordinates from Brazilian grower cooperative. Generate unique Reference Number on TRACES-NT and transmit to customs declarant.`,
      };
    }

    if (act.includes('hsa') || act.includes('pharma') || act.includes('health') || act.includes('permit')) {
      return {
        authority: c === 'SINGAPORE' ? 'Singapore Health Sciences Authority (HSA)' : 'National Health Products Regulatory Agency',
        statutoryFiling: 'TradeNet In-Payment Permit with Therapeutic Product License',
        timeline: '3 days prior to flight touchdown at Changi (SIN)',
        remedyStep: `Attach manufacturer GMP certificate and continuous cold-chain temperature logger telemetry. Obtain Electronic Customs Permit (CCP) endorsed by HSA Therapeutic Products Branch.`,
      };
    }

    return {
      authority: `${country} Central Customs Administration`,
      statutoryFiling: 'Formal Customs Entry Amendment Docket',
      timeline: 'Within 14 calendar days of discrepancy notice',
      remedyStep: `Furnish manufacturer documentation, updated commercial invoice reflecting CIF valuation, and cross-reference destination tariff schedules to clear statutory compliance flags.`,
    };
  };

  const handleSimulateAISuggestion = (id: string) => {
    setIsSimulatingAI(id);
    setTimeout(() => {
      setIsSimulatingAI(null);
      setExpandedStrategyId(expandedStrategyId === id ? null : id);
      toast.success('AI Remediation Plan Ready', `Tailored statutory corrective pathway generated for ${destinationCountry}.`);
    }, 450);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>AI Statutory Mitigation Action Plan</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {destinationCountry} Customized
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Agent-generated corrective actions aligned to destination customs statutes
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <span>Remediated:</span>
              <span className={`font-bold ${completedCount === items.length ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {completedCount}/{items.length}
              </span>
            </div>

            <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        {items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No pending action items. Consignment is cleared for customs processing.
          </div>
        ) : (
          <div className="space-y-3.5">
            {items.map((item) => {
              let priorityColor = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
              if (item.priority === 'URGENT') {
                priorityColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
              } else if (item.priority === 'REQUIRED') {
                priorityColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
              }

              const isExpanded = expandedStrategyId === item.id;
              const isSimulating = isSimulatingAI === item.id;
              const advice = getTailoredStatutoryAdvice(item, destinationCountry);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    item.completed
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-4 flex items-start gap-3">
                    {/* Interactive Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleComplete(item.id || '')}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title={item.completed ? 'Mark pending' : 'Mark remediated'}
                    >
                      {item.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600 hover:text-slate-400 shrink-0" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${priorityColor}`}
                          >
                            {item.priority}
                          </span>

                          {item.completed && (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              ✓ Remediated
                            </span>
                          )}
                        </div>

                        {/* Interactive AI Suggestion Button */}
                        <button
                          type="button"
                          onClick={() => handleSimulateAISuggestion(item.id || '')}
                          disabled={isSimulating}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 transition-all cursor-pointer"
                        >
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isSimulating ? 'Analyzing...' : isExpanded ? 'Hide AI Plan' : 'AI Action Blueprint'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      <p
                        className={`text-xs font-semibold mt-2 leading-relaxed ${
                          item.completed ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {item.action}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                        {item.target_agency && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Building className="w-3 h-3 text-slate-500" />
                            Agency: <strong className="text-slate-200">{item.target_agency}</strong>
                          </span>
                        )}
                        {item.required_document && (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <FileCheck2 className="w-3 h-3 text-cyan-400" />
                            Doc: {item.required_document}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Tailored AI Mitigation Strategy Drawer */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800/80 space-y-2.5 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono text-[11px]">
                        <Bot className="w-3.5 h-3.5" />
                        <span>Statutory Remediation Protocol for {destinationCountry} Customs:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block uppercase text-[10px] font-mono">Target Authority & System:</span>
                          <span className="text-white font-medium">{advice.authority}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block uppercase text-[10px] font-mono">Mandated Form / Filing:</span>
                          <span className="text-amber-400 font-mono font-medium">{advice.statutoryFiling}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px]">
                        <span className="text-slate-500 block uppercase text-[10px] font-mono mb-1">
                          Action Mandate:
                        </span>
                        <p className="text-slate-200 leading-relaxed">{advice.remedyStep}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500" />
                          Compliance Timeline: {advice.timeline}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleComplete(item.id || '')}
                          className="text-emerald-400 hover:underline cursor-pointer"
                        >
                          {item.completed ? 'Re-open Item' : 'Mark Action Complete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
