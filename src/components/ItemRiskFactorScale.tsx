import React, { useState } from 'react';
import { LineItem, AuditResponse } from '../types/compliance';
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Filter, Info, Flame, ChevronRight } from 'lucide-react';

interface ItemRiskFactorScaleProps {
  items: LineItem[];
  auditStatus: string;
  auditRiskScore: number;
  destinationCountry: string;
}

export interface ItemRiskEvaluation {
  item: LineItem;
  score: number;
  tier: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  colorClass: string;
  barColor: string;
  bgClass: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  triggers: string[];
  isHighRisk: boolean;
}

export function evaluateItemRisk(
  item: LineItem,
  overallRisk: number,
  status: string
): ItemRiskEvaluation {
  let score = 12; // baseline clean item score
  const triggers: string[] = [];

  const lowerDesc = (item.item_description || '').toLowerCase();
  const haz = (item.hazardous_class || '').toLowerCase();
  const flags = item.compliance_flags || [];

  // Check dangerous goods or munitions
  if (
    haz.includes('class 9') ||
    haz.includes('un3480') ||
    haz.includes('un3481') ||
    haz.includes('lithium') ||
    lowerDesc.includes('lithium') ||
    lowerDesc.includes('battery')
  ) {
    score += 48;
    triggers.push('Class 9 Dangerous Goods (Lithium Energy Storage UN3480/UN3481)');
  }

  if (
    haz.includes('5a002') ||
    haz.includes('dual-use') ||
    haz.includes('munitions') ||
    lowerDesc.includes('ka-band') ||
    lowerDesc.includes('cryptographic') ||
    lowerDesc.includes('transceiver') ||
    lowerDesc.includes('amplifier')
  ) {
    score += 65;
    triggers.push('Strategic Dual-Use / Munitions Export Controls (ECCN 5A002 Cryptography)');
  }

  if (
    haz.includes('biological') ||
    haz.includes('pharma') ||
    haz.includes('temperature') ||
    lowerDesc.includes('insulin') ||
    lowerDesc.includes('vaccine')
  ) {
    score += 35;
    triggers.push('Temperature-Controlled Active Cold Chain (+2°C to +8°C Biological)');
  }

  // Compliance flags analysis
  for (const flag of flags) {
    const fLower = flag.toLowerCase();
    if (fLower.includes('unlicensed') || fLower.includes('high-risk') || fLower.includes('quarantine')) {
      score += 25;
      triggers.push(`Critical Flag: ${flag}`);
    } else if (fLower.includes('missing') || fLower.includes('absent') || fLower.includes('section 301')) {
      score += 20;
      triggers.push(`Statutory Variance: ${flag}`);
    } else if (fLower.includes('required') || fLower.includes('needed') || fLower.includes('pre-clearance')) {
      score += 15;
      triggers.push(`Agency Condition: ${flag}`);
    }
  }

  // Tariff code mismatch / evasion check
  if (item.verified_hs_code && item.declared_hs_code) {
    const cleanDeclared = item.declared_hs_code.replace(/[^0-9]/g, '').slice(0, 4);
    const cleanVerified = item.verified_hs_code.replace(/[^0-9]/g, '').slice(0, 4);
    if (cleanDeclared !== cleanVerified) {
      score += 24;
      triggers.push(`Tariff Classification Discrepancy (Declared ${item.declared_hs_code} vs Verified ${item.verified_hs_code})`);
    }
  }

  // Status calibration
  if (status === 'REJECTED') {
    score = Math.max(score, 75);
  } else if (status === 'APPROVED' && triggers.length === 0) {
    score = Math.min(score, 18);
  } else if (status === 'FLAGGED' && triggers.length === 0) {
    score = Math.max(score, 38);
  }

  // Clamp 5 to 99
  score = Math.min(99, Math.max(5, score));

  // Determine intensity tier & palette
  let tier: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  let colorClass: string;
  let barColor: string;
  let bgClass: string;
  let borderClass: string;
  let badgeBg: string;
  let badgeText: string;

  if (score >= 85) {
    tier = 'CRITICAL';
    colorClass = 'text-rose-400';
    barColor = 'bg-rose-500';
    bgClass = 'bg-rose-950/20';
    borderClass = 'border-rose-500/50 shadow-rose-950/40';
    badgeBg = 'bg-rose-500/20';
    badgeText = 'text-rose-300 border-rose-500/40';
  } else if (score >= 70) {
    tier = 'HIGH';
    colorClass = 'text-orange-400';
    barColor = 'bg-orange-500';
    bgClass = 'bg-orange-950/20';
    borderClass = 'border-orange-500/40 shadow-orange-950/30';
    badgeBg = 'bg-orange-500/20';
    badgeText = 'text-orange-300 border-orange-500/40';
  } else if (score >= 50) {
    tier = 'ELEVATED';
    colorClass = 'text-amber-400';
    barColor = 'bg-amber-500';
    bgClass = 'bg-amber-950/15';
    borderClass = 'border-amber-500/30';
    badgeBg = 'bg-amber-500/20';
    badgeText = 'text-amber-300 border-amber-500/40';
  } else if (score >= 26) {
    tier = 'MODERATE';
    colorClass = 'text-cyan-400';
    barColor = 'bg-cyan-500';
    bgClass = 'bg-cyan-950/10';
    borderClass = 'border-cyan-500/30';
    badgeBg = 'bg-cyan-500/15';
    badgeText = 'text-cyan-300 border-cyan-500/30';
  } else {
    tier = 'LOW';
    colorClass = 'text-emerald-400';
    barColor = 'bg-emerald-500';
    bgClass = 'bg-emerald-950/10';
    borderClass = 'border-emerald-500/30';
    badgeBg = 'bg-emerald-500/15';
    badgeText = 'text-emerald-300 border-emerald-500/30';
  }

  return {
    item,
    score,
    tier,
    colorClass,
    barColor,
    bgClass,
    borderClass,
    badgeBg,
    badgeText,
    triggers,
    isHighRisk: score >= 70,
  };
}

export const ItemRiskFactorScale: React.FC<ItemRiskFactorScaleProps> = ({
  items,
  auditStatus,
  auditRiskScore,
  destinationCountry,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'high_risk' | 'low_risk'>('all');

  const evaluations: ItemRiskEvaluation[] = (items || []).map((item) =>
    evaluateItemRisk(item, auditRiskScore, auditStatus)
  );

  const highRiskCount = evaluations.filter((e) => e.isHighRisk).length;
  const elevatedCount = evaluations.filter((e) => e.tier === 'ELEVATED').length;
  const compliantCount = evaluations.filter((e) => e.tier === 'LOW' || e.tier === 'MODERATE').length;

  const filteredEvaluations = evaluations.filter((e) => {
    if (filterMode === 'high_risk') return e.isHighRisk;
    if (filterMode === 'low_risk') return !e.isHighRisk;
    return true;
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Item Risk-Factor Intensity Matrix</span>
              {highRiskCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-bold">
                  {highRiskCount} High-Risk Item{highRiskCount > 1 ? 's' : ''} Flagged
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Statutory risk intensity scale cross-referenced with tariff & hazardous mandates for {destinationCountry}
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items ({evaluations.length})
          </button>
          <button
            onClick={() => setFilterMode('high_risk')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'high_risk'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            High Risk ({highRiskCount})
          </button>
          <button
            onClick={() => setFilterMode('low_risk')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'low_risk'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Compliant ({compliantCount})
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Color-Coded Intensity Scale Gauge / Legend */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-400 font-mono">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Statutory Intensity Scale (0 — 100)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Low: &lt;25 | Elevated: 50-69 | High: 70-84 | Critical: 85+
            </span>
          </div>

          {/* Continuous Multi-Stop Gradient Scale Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-full bg-slate-800 p-0.5 overflow-hidden flex">
              <div className="h-full w-1/4 bg-gradient-to-r from-emerald-500 to-teal-400" title="Low Risk (0-25)" />
              <div className="h-full w-1/4 bg-gradient-to-r from-teal-400 to-cyan-400" title="Moderate (26-50)" />
              <div className="h-full w-1/5 bg-gradient-to-r from-cyan-400 to-amber-500" title="Elevated (51-70)" />
              <div className="h-full w-1/6 bg-gradient-to-r from-amber-500 to-orange-500" title="High (71-85)" />
              <div className="h-full flex-1 bg-gradient-to-r from-orange-500 to-rose-600 animate-pulse" title="Critical (86-100)" />
            </div>

            {/* Scale Ticks and Labels */}
            <div className="grid grid-cols-5 text-[10px] font-mono font-medium text-slate-400 pt-0.5">
              <div className="text-left flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-emerald-400">0 - 25 Low</span>
              </div>
              <div className="text-center flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                <span className="text-cyan-300">26 - 50 Moderate</span>
              </div>
              <div className="text-center flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span className="text-amber-300">51 - 70 Elevated</span>
              </div>
              <div className="text-center flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                <span className="text-orange-300">71 - 85 High</span>
              </div>
              <div className="text-right flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span className="text-rose-400 font-bold">86 - 100 Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items List with Intensity Scales */}
        {filteredEvaluations.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredEvaluations.map((evalItem, index) => {
              const { item, score, tier, isHighRisk, colorClass, barColor, bgClass, borderClass, badgeBg, badgeText, triggers } = evalItem;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${bgClass} ${borderClass} relative ${
                    isHighRisk ? 'ring-1 ring-rose-500/40 shadow-lg' : ''
                  }`}
                >
                  {/* High Risk Callout Badge on Top Corner */}
                  {isHighRisk && (
                    <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black tracking-wider uppercase font-mono shadow-md flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" />
                      HIGH-RISK CARGO
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Item Information */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          Item #{index + 1}
                        </span>

                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          HS: {item.declared_hs_code}
                        </span>

                        {item.verified_hs_code && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified: {item.verified_hs_code}
                          </span>
                        )}

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${badgeBg} ${badgeText}`}>
                          {tier} RISK INTENSITY
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">
                        {item.item_description}
                      </h4>

                      {/* Triggers / Reasons for intensity */}
                      {triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {triggers.map((trigger, tIdx) => (
                            <span
                              key={tIdx}
                              className={`text-[10px] px-2 py-0.5 rounded border font-mono flex items-center gap-1 ${
                                isHighRisk
                                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{trigger}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Intensity Scale Gauge for this item */}
                    <div className="md:w-64 shrink-0 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Risk Factor:</span>
                        <span className={`text-base font-black ${colorClass}`}>
                          {score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                        </span>
                      </div>

                      {/* Intensity Progress Bar */}
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                        <span>Qty: {item.quantity} {item.unit || 'PCS'}</span>
                        <span className="font-semibold text-slate-200">
                          ${Number(item.total_value || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-200">No matching items in this filter</p>
            <p className="text-xs text-slate-400">Try switching back to "All Items" to view the full manifest.</p>
          </div>
        )}
      </div>
    </div>
  );
};
