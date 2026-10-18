/**
 * OmniScribe Pre-Audit Auto-Tagging & Heuristic Text Analysis Engine
 * Analyzes shipment text and manifest descriptors before the full audit is triggered.
 * Suggests tags like 'Urgent', 'Hazardous', 'Requires Duty Review', 'Dual-Use Item', 'High Valuation'.
 */

export interface PreAuditSuggestedTag {
  id: string;
  label: 'Urgent' | 'Hazardous' | 'Requires Duty Review' | 'Dual-Use Item' | 'High Valuation' | string;
  confidence: number; // 0 - 100%
  category: 'hazard' | 'urgency' | 'duty' | 'dual-use' | 'valuation';
  rationale: string;
  matchedKeywords: string[];
  colorClasses: {
    badge: string;
    border: string;
    text: string;
    iconBg: string;
  };
}

export function analyzePreAuditText(
  text: string = '',
  fileName: string = '',
  documentType: string = ''
): PreAuditSuggestedTag[] {
  const content = `${text} ${fileName} ${documentType}`.toLowerCase();
  if (!content.trim()) return [];

  const results: PreAuditSuggestedTag[] = [];

  // 1. Hazardous Indicator Check
  const hazardousKeywords = [
    'un3480',
    'un3481',
    'un3090',
    'un3091',
    'un1263',
    'un1993',
    'lithium',
    'battery',
    'batteries',
    'class 9',
    'class 3',
    'class 8',
    'hazardous',
    'hazmat',
    'dangerous goods',
    'dg declaration',
    'electrolyte',
    'flammable',
    'corrosive',
    'toxic',
    'chemical',
    'explosive',
    'imdg',
    'un 38.3',
  ];
  const hazMatches = hazardousKeywords.filter((k) => content.includes(k));
  if (hazMatches.length > 0) {
    const isLithium = hazMatches.some((m) => m.includes('lithium') || m.includes('3480') || m.includes('battery'));
    results.push({
      id: 'tag-hazardous',
      label: 'Hazardous',
      confidence: Math.min(99, 70 + hazMatches.length * 8),
      category: 'hazard',
      rationale: isLithium
        ? 'Lithium energy cells / Class 9 dangerous goods (UN3480/UN3481) detected. Mandatory UN 38.3 test summary required.'
        : `Dangerous Goods / HazMat classification indicators identified (${hazMatches.slice(0, 3).join(', ')}).`,
      matchedKeywords: Array.from(new Set(hazMatches)).slice(0, 4),
      colorClasses: {
        badge: 'bg-rose-950/60 text-rose-300 border-rose-500/50',
        border: 'border-rose-500/60',
        text: 'text-rose-400',
        iconBg: 'bg-rose-500/20 text-rose-300',
      },
    });
  }

  // 2. Urgent / Time-Sensitive Indicator Check
  const urgentKeywords = [
    'urgent',
    'perishable',
    'cold chain',
    'temperature-controlled',
    'insulin',
    'vaccine',
    'biological',
    'pharmaceutical',
    'biotech',
    'express',
    'air waybill',
    'expedite',
    'expedited',
    'immediate',
    'time-sensitive',
    'emergency',
    '+2°c',
    '+8°c',
    'reefer',
    'datalogger',
    'live cargo',
    'short shelf life',
  ];
  const urgentMatches = urgentKeywords.filter((k) => content.includes(k));
  if (urgentMatches.length > 0) {
    const isPharma = urgentMatches.some((m) => m.includes('insulin') || m.includes('vaccine') || m.includes('biolog') || m.includes('cold chain') || m.includes('+2°c'));
    results.push({
      id: 'tag-urgent',
      label: 'Urgent',
      confidence: Math.min(98, 72 + urgentMatches.length * 8),
      category: 'urgency',
      rationale: isPharma
        ? 'Time-sensitive cold chain biological or pharmaceutical shipment requiring expedited customs processing.'
        : `High-priority / express consignment markings detected (${urgentMatches.slice(0, 3).join(', ')}).`,
      matchedKeywords: Array.from(new Set(urgentMatches)).slice(0, 4),
      colorClasses: {
        badge: 'bg-amber-950/60 text-amber-300 border-amber-500/50',
        border: 'border-amber-500/60',
        text: 'text-amber-400',
        iconBg: 'bg-amber-500/20 text-amber-300',
      },
    });
  }

  // 3. Requires Duty Review Indicator Check
  const dutyKeywords = [
    'section 301',
    'tariff',
    'anti-dumping',
    'countervailing',
    'surcharge',
    'ad valorem',
    '25%',
    'cbam',
    'carbon border',
    'dual-use',
    'eccn',
    '5a002',
    'crypto',
    'transceiver',
    'amplifier',
    'origin test',
    'taric',
    'gst bond',
    'duty unpaid',
  ];
  const dutyMatches = dutyKeywords.filter((k) => content.includes(k));
  const hasHighValueRegex = /\$\s?[1-9]\d{2},\d{3}|\b[1-9]\d{5,}\b|value:\s?[1-9]\d{5}/i.test(content);

  if (dutyMatches.length > 0 || hasHighValueRegex) {
    const matchedList = [...dutyMatches];
    if (hasHighValueRegex) matchedList.push('High Declared Cargo Value (> $100K)');
    results.push({
      id: 'tag-duty-review',
      label: 'Requires Duty Review',
      confidence: Math.min(96, 65 + dutyMatches.length * 10 + (hasHighValueRegex ? 15 : 0)),
      category: 'duty',
      rationale: dutyMatches.some((m) => m.includes('section 301') || m.includes('25%'))
        ? 'Subject to USTR Section 301 ad valorem duty surcharges (25%) or specialized trade remedy assessment.'
        : 'Statutory duty adjustments, high-value valuation thresholds, or preferential tariff rules apply.',
      matchedKeywords: Array.from(new Set(matchedList)).slice(0, 4),
      colorClasses: {
        badge: 'bg-purple-950/60 text-purple-300 border-purple-500/50',
        border: 'border-purple-500/60',
        text: 'text-purple-400',
        iconBg: 'bg-purple-500/20 text-purple-300',
      },
    });
  }

  // 4. Strategic Dual-Use Munitions Check
  const dualUseKeywords = [
    '5a002',
    'dual-use',
    'cryptographic',
    'encryption',
    'satellite',
    'ka-band',
    'rf power',
    'transceiver',
    'munitions',
    'wassenaar',
    'eccn',
  ];
  const dualMatches = dualUseKeywords.filter((k) => content.includes(k));
  if (dualMatches.length > 0) {
    results.push({
      id: 'tag-dual-use',
      label: 'Dual-Use Item',
      confidence: 95,
      category: 'dual-use',
      rationale: 'Military-grade frequency or cryptographic apparatus classified under strategic export controls (ECCN 5A002).',
      matchedKeywords: Array.from(new Set(dualMatches)).slice(0, 4),
      colorClasses: {
        badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50',
        border: 'border-cyan-500/60',
        text: 'text-cyan-400',
        iconBg: 'bg-cyan-500/20 text-cyan-300',
      },
    });
  }

  // 5. High Declared Valuation Check
  if (hasHighValueRegex) {
    results.push({
      id: 'tag-high-valuation',
      label: 'High Valuation',
      confidence: 90,
      category: 'valuation',
      rationale: 'Declared consignment value exceeds $100,000 threshold, subject to formal customs entry bond.',
      matchedKeywords: ['Valuation > $100,000'],
      colorClasses: {
        badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50',
        border: 'border-emerald-500/60',
        text: 'text-emerald-400',
        iconBg: 'bg-emerald-500/20 text-emerald-300',
      },
    });
  }

  return results;
}
