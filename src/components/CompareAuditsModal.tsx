import React, { useState, useMemo } from 'react';
import { AuditResponse, DiscrepancyItem } from '../types/compliance';
import {
  X,
  ArrowLeftRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Download,
  Printer,
  Scale,
  FileText,
  DollarSign,
  Globe,
  Truck,
  Building,
  Check,
  AlertOctagon,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { escapeCSVCell } from './BulkExportModal';
import { useToast } from '../context/ToastContext';

export interface CompareAuditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AuditResponse[];
  initialAuditAId?: string;
  initialAuditBId?: string;
  onSelectAudit?: (audit: AuditResponse) => void;
}

export const CompareAuditsModal: React.FC<CompareAuditsModalProps> = ({
  isOpen,
  onClose,
  history,
  initialAuditAId,
  initialAuditBId,
  onSelectAudit,
}) => {
  const toast = useToast();

  // Pick first two audits by default if not specified
  const [auditAId, setAuditAId] = useState<string>(() => {
    if (initialAuditAId) return initialAuditAId;
    return history[0]?.audit_id || '';
  });

  const [auditBId, setAuditBId] = useState<string>(() => {
    if (initialAuditBId && initialAuditBId !== initialAuditAId) return initialAuditBId;
    if (history.length > 1) {
      return history.find((h) => h.audit_id !== initialAuditAId)?.audit_id || history[1].audit_id;
    }
    return history[0]?.audit_id || '';
  });

  const [activeTab, setActiveTab] = useState<'discrepancies' | 'entities' | 'actions' | 'reasoning'>('discrepancies');
  const [filterMode, setFilterMode] = useState<'all' | 'differences_only' | 'shared_only'>('all');

  // Update selection if initial IDs change when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialAuditAId) setAuditAId(initialAuditAId);
      if (initialAuditBId && initialAuditBId !== initialAuditAId) {
        setAuditBId(initialAuditBId);
      } else if (history.length > 1) {
        const other = history.find((h) => h.audit_id !== (initialAuditAId || auditAId));
        if (other) setAuditBId(other.audit_id);
      }
    }
  }, [isOpen, initialAuditAId, initialAuditBId, history]);

  const auditA = useMemo(() => history.find((h) => h.audit_id === auditAId) || history[0], [history, auditAId]);
  const auditB = useMemo(
    () => history.find((h) => h.audit_id === auditBId) || (history.length > 1 ? history[1] : history[0]),
    [history, auditBId]
  );

  if (!isOpen) return null;

  // Swap Left and Right audits
  const handleSwap = () => {
    const tempA = auditAId;
    setAuditAId(auditBId);
    setAuditBId(tempA);
    toast.info('Audits Swapped', 'Interchanged Left and Right audit dossiers for comparison.');
  };

  // Helper for country flags
  const getFlag = (country?: string) => {
    if (!country) return '🌐';
    const c = country.toLowerCase();
    if (c.includes('usa') || c.includes('united states')) return '🇺🇸';
    if (c.includes('eu') || c.includes('germany') || c.includes('netherlands')) return '🇪🇺';
    if (c.includes('singapore')) return '🇸🇬';
    if (c.includes('uae') || c.includes('dubai')) return '🇦🇪';
    if (c.includes('uk') || c.includes('britain')) return '🇬🇧';
    if (c.includes('japan')) return '🇯🇵';
    if (c.includes('australia')) return '🇦🇺';
    if (c.includes('china')) return '🇨🇳';
    if (c.includes('india')) return '🇮🇳';
    return '🌐';
  };

  // Discrepancy comparison data preparation
  const discrepanciesA = auditA?.discrepancy_details || [];
  const discrepanciesB = auditB?.discrepancy_details || [];
  const stringDiscrepanciesA = auditA?.compliance_discrepancies || [];
  const stringDiscrepanciesB = auditB?.compliance_discrepancies || [];

  // Build a merged discrepancy table
  interface DiscrepancyComparisonRow {
    id: string;
    topic: string;
    severityA: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    severityB: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    detailA?: string;
    detailB?: string;
    regulationA?: string;
    regulationB?: string;
    type: 'shared' | 'a_only' | 'b_only';
  }

  const comparisonRows: DiscrepancyComparisonRow[] = [];

  // Map known structured discrepancy items
  const matchedBIds = new Set<string>();

  discrepanciesA.forEach((itemA, index) => {
    // Try to find matching discrepancy in B by code or title similarity
    const matchB = discrepanciesB.find((itemB) => {
      if (itemB.code === itemA.code) return true;
      const tA = itemA.title.toLowerCase();
      const tB = itemB.title.toLowerCase();
      return tA === tB || (tA.includes('battery') && tB.includes('battery')) || (tA.includes('tariff') && tB.includes('tariff'));
    });

    if (matchB) {
      matchedBIds.add(matchB.code);
      comparisonRows.push({
        id: `match-${itemA.code}-${index}`,
        topic: itemA.title,
        severityA: itemA.severity,
        severityB: matchB.severity,
        detailA: itemA.description,
        detailB: matchB.description,
        regulationA: itemA.regulation_ref,
        regulationB: matchB.regulation_ref,
        type: 'shared',
      });
    } else {
      comparisonRows.push({
        id: `a-only-${itemA.code || index}`,
        topic: itemA.title || `Flagged Issue #${index + 1}`,
        severityA: itemA.severity,
        severityB: 'NONE',
        detailA: itemA.description,
        detailB: 'Compliant / No violation recorded',
        regulationA: itemA.regulation_ref,
        regulationB: undefined,
        type: 'a_only',
      });
    }
  });

  // Remaining B discrepancies
  discrepanciesB.forEach((itemB, index) => {
    if (!matchedBIds.has(itemB.code)) {
      comparisonRows.push({
        id: `b-only-${itemB.code || index}`,
        topic: itemB.title || `Flagged Issue #${index + 1}`,
        severityA: 'NONE',
        severityB: itemB.severity,
        detailA: 'Compliant / No violation recorded',
        detailB: itemB.description,
        regulationA: undefined,
        regulationB: itemB.regulation_ref,
        type: 'b_only',
      });
    }
  });

  // Also catch string-based discrepancies if structured items are empty
  if (comparisonRows.length === 0 && (stringDiscrepanciesA.length > 0 || stringDiscrepanciesB.length > 0)) {
    stringDiscrepanciesA.forEach((textA, idx) => {
      comparisonRows.push({
        id: `str-a-${idx}`,
        topic: textA.slice(0, 50) + (textA.length > 50 ? '...' : ''),
        severityA: 'HIGH',
        severityB: 'NONE',
        detailA: textA,
        detailB: 'Compliant / No discrepancy detected',
        type: 'a_only',
      });
    });
    stringDiscrepanciesB.forEach((textB, idx) => {
      comparisonRows.push({
        id: `str-b-${idx}`,
        topic: textB.slice(0, 50) + (textB.length > 50 ? '...' : ''),
        severityA: 'NONE',
        severityB: 'HIGH',
        detailA: 'Compliant / No discrepancy detected',
        detailB: textB,
        type: 'b_only',
      });
    });
  }

  // Filter discrepancy rows based on filterMode
  const filteredRows = comparisonRows.filter((row) => {
    if (filterMode === 'differences_only') return row.type !== 'shared';
    if (filterMode === 'shared_only') return row.type === 'shared';
    return true;
  });

  // Risk Score Delta
  const riskDelta = (auditA?.risk_score || 0) - (auditB?.risk_score || 0);
  const valueA = Number(auditA?.extracted_entities?.total_declared_value) || 0;
  const valueB = Number(auditB?.extracted_entities?.total_declared_value) || 0;
  const valueDelta = valueA - valueB;

  // Export CSV of side-by-side comparison
  const handleExportCSV = () => {
    if (!auditA || !auditB) return;

    const headers = [
      'Comparison Category',
      `Audit A: ${auditA.audit_id} (${auditA.destination_country})`,
      `Audit B: ${auditB.audit_id} (${auditB.destination_country})`,
      'Variance / Difference Verdict',
    ];

    const lines: string[] = [headers.map(escapeCSVCell).join(',')];

    // Core Metrics
    lines.push([escapeCSVCell('Audit Reference ID'), escapeCSVCell(auditA.audit_id), escapeCSVCell(auditB.audit_id), escapeCSVCell('Direct Comparison')].join(','));
    lines.push([
      escapeCSVCell('Compliance Status'),
      escapeCSVCell(auditA.audit_status),
      escapeCSVCell(auditB.audit_status),
      escapeCSVCell(auditA.audit_status === auditB.audit_status ? 'Identical Status' : `Status Divergence (${auditA.audit_status} vs ${auditB.audit_status})`),
    ].join(','));
    lines.push([
      escapeCSVCell('Risk Score (0-100)'),
      escapeCSVCell(auditA.risk_score),
      escapeCSVCell(auditB.risk_score),
      escapeCSVCell(`Delta: ${riskDelta > 0 ? `+${riskDelta}` : riskDelta} pts`),
    ].join(','));
    lines.push([
      escapeCSVCell('Risk Classification Tier'),
      escapeCSVCell(auditA.risk_level),
      escapeCSVCell(auditB.risk_level),
      escapeCSVCell(auditA.risk_level === auditB.risk_level ? 'Identical Tier' : 'Different Tier'),
    ].join(','));
    lines.push([
      escapeCSVCell('Destination Jurisdiction'),
      escapeCSVCell(auditA.destination_country),
      escapeCSVCell(auditB.destination_country),
      escapeCSVCell(auditA.destination_country === auditB.destination_country ? 'Same Jurisdiction' : 'Different Jurisdiction'),
    ].join(','));
    lines.push([
      escapeCSVCell('Total Declared Value (USD)'),
      escapeCSVCell(valueA),
      escapeCSVCell(valueB),
      escapeCSVCell(`Delta: ${valueDelta >= 0 ? `+$${valueDelta.toLocaleString()}` : `-$${Math.abs(valueDelta).toLocaleString()}`}`),
    ].join(','));
    lines.push([
      escapeCSVCell('Total Discrepancies Count'),
      escapeCSVCell(comparisonRows.filter(r => r.severityA !== 'NONE').length),
      escapeCSVCell(comparisonRows.filter(r => r.severityB !== 'NONE').length),
      escapeCSVCell(`Variance: ${comparisonRows.filter(r => r.severityA !== 'NONE').length - comparisonRows.filter(r => r.severityB !== 'NONE').length}`),
    ].join(','));

    // Discrepancy details
    lines.push([escapeCSVCell('--- COMPLIANCE DISCREPANCIES ---'), escapeCSVCell(''), escapeCSVCell(''), escapeCSVCell('')].join(','));
    comparisonRows.forEach((row) => {
      lines.push([
        escapeCSVCell(`Discrepancy: ${row.topic}`),
        escapeCSVCell(`[${row.severityA}] ${row.detailA || 'None'} ${row.regulationA ? `(${row.regulationA})` : ''}`),
        escapeCSVCell(`[${row.severityB}] ${row.detailB || 'None'} ${row.regulationB ? `(${row.regulationB})` : ''}`),
        escapeCSVCell(row.type === 'shared' ? 'Shared Flag' : row.type === 'a_only' ? 'Present only in Audit A' : 'Present only in Audit B'),
      ].join(','));
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omniscribe_audit_comparison_${auditA.audit_id}_vs_${auditB.audit_id}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Comparison Exported', `Downloaded side-by-side CSV comparison between ${auditA.audit_id} and ${auditB.audit_id}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Compare Compliance Audits
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Side-by-Side Analysis
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect compliance discrepancies, risk scoring deltas, and cargo entity variances between dossiers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/40 text-xs font-bold font-mono transition-colors cursor-pointer"
              title="Download Side-by-Side CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden md:flex"
              title="Print / Save PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Selection Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800/80">
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* Audit A Selector */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-[11px] font-mono text-indigo-300 flex items-center justify-between font-bold">
                <span>AUDIT DOSSIER A (LEFT)</span>
                <span className="text-slate-500 font-normal">
                  {auditA ? `${getFlag(auditA.destination_country)} ${auditA.destination_country}` : ''}
                </span>
              </label>
              <div className="relative">
                <select
                  value={auditAId}
                  onChange={(e) => setAuditAId(e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
                >
                  {history.map((h) => (
                    <option key={`a-${h.audit_id}`} value={h.audit_id}>
                      {h.audit_id} • {h.destination_country} • Risk {h.risk_score}/100 [{h.audit_status}] • {new Date(h.timestamp).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Swap & Variance Center Control */}
            <div className="md:col-span-1 flex flex-col items-center justify-center pt-2 md:pt-4">
              <button
                type="button"
                onClick={handleSwap}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700 hover:border-indigo-500 flex items-center justify-center transition-all cursor-pointer shadow-md group"
                title="Swap Audit A and Audit B"
              >
                <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-wider">Swap</span>
            </div>

            {/* Audit B Selector */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-[11px] font-mono text-teal-300 flex items-center justify-between font-bold">
                <span>AUDIT DOSSIER B (RIGHT)</span>
                <span className="text-slate-500 font-normal">
                  {auditB ? `${getFlag(auditB.destination_country)} ${auditB.destination_country}` : ''}
                </span>
              </label>
              <div className="relative">
                <select
                  value={auditBId}
                  onChange={(e) => setAuditBId(e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer appearance-none"
                >
                  {history.map((h) => (
                    <option key={`b-${h.audit_id}`} value={h.audit_id}>
                      {h.audit_id} • {h.destination_country} • Risk {h.risk_score}/100 [{h.audit_status}] • {new Date(h.timestamp).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Comparison Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Executive Scoreboard & Risk Delta Card */}
          {auditA && auditB ? (
            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-stretch">
              {/* Card A */}
              <div className="md:col-span-5 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                      Audit Dossier A
                    </span>
                    <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                      <span>{auditA.audit_id}</span>
                      <span className="text-sm">{getFlag(auditA.destination_country)}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {auditA.extracted_entities?.document_number || 'Manifest'} · {new Date(auditA.timestamp).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold border uppercase tracking-wider ${
                        auditA.audit_status === 'APPROVED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : auditA.audit_status === 'REJECTED'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {auditA.audit_status}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Risk Score:</span>
                    <span
                      className={`font-bold text-sm ${
                        auditA.risk_score >= 70
                          ? 'text-rose-400'
                          : auditA.risk_score >= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {auditA.risk_score} <span className="text-slate-500 text-xs">/ 100 ({auditA.risk_level})</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        auditA.risk_score >= 70
                          ? 'bg-rose-500'
                          : auditA.risk_score >= 30
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, auditA.risk_score))}%` }}
                    />
                  </div>
                </div>

                {/* Micro metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Declared Value</span>
                    <strong className="text-slate-200">
                      ${valueA.toLocaleString()} {auditA.extracted_entities?.currency || 'USD'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Discrepancies</span>
                    <strong
                      className={
                        (auditA.compliance_discrepancies?.length || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }
                    >
                      {auditA.compliance_discrepancies?.length || 0} Flagged
                    </strong>
                  </div>
                  <div className="text-right">
                    {onSelectAudit && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAudit(auditA);
                          onClose();
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 cursor-pointer pt-2"
                      >
                        <span>Dossier</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Central Delta Comparison Box */}
              <div className="md:col-span-1 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Variance
                </span>

                {/* Score difference pill */}
                <div
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-mono font-bold border ${
                    riskDelta === 0
                      ? 'bg-slate-900 text-slate-300 border-slate-700'
                      : riskDelta > 0
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {riskDelta > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : riskDelta < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : null}
                    <span>{riskDelta > 0 ? `+${riskDelta}` : riskDelta}</span>
                  </div>
                  <span className="text-[9px] block text-slate-400 font-normal">pts delta</span>
                </div>

                <div className="text-[10px] font-mono text-slate-400">
                  {riskDelta === 0 ? (
                    <span className="text-slate-400">Equal Risk</span>
                  ) : riskDelta > 0 ? (
                    <span className="text-rose-400 font-semibold">A is higher risk</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">B is higher risk</span>
                  )}
                </div>
              </div>

              {/* Card B */}
              <div className="md:col-span-5 p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/30 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold">
                      Audit Dossier B
                    </span>
                    <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
                      <span>{auditB.audit_id}</span>
                      <span className="text-sm">{getFlag(auditB.destination_country)}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {auditB.extracted_entities?.document_number || 'Manifest'} · {new Date(auditB.timestamp).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold border uppercase tracking-wider ${
                        auditB.audit_status === 'APPROVED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : auditB.audit_status === 'REJECTED'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {auditB.audit_status}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Risk Score:</span>
                    <span
                      className={`font-bold text-sm ${
                        auditB.risk_score >= 70
                          ? 'text-rose-400'
                          : auditB.risk_score >= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {auditB.risk_score} <span className="text-slate-500 text-xs">/ 100 ({auditB.risk_level})</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        auditB.risk_score >= 70
                          ? 'bg-rose-500'
                          : auditB.risk_score >= 30
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, auditB.risk_score))}%` }}
                    />
                  </div>
                </div>

                {/* Micro metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Declared Value</span>
                    <strong className="text-slate-200">
                      ${valueB.toLocaleString()} {auditB.extracted_entities?.currency || 'USD'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Discrepancies</span>
                    <strong
                      className={
                        (auditB.compliance_discrepancies?.length || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }
                    >
                      {auditB.compliance_discrepancies?.length || 0} Flagged
                    </strong>
                  </div>
                  <div className="text-right">
                    {onSelectAudit && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAudit(auditB);
                          onClose();
                        }}
                        className="text-teal-400 hover:text-teal-300 font-bold inline-flex items-center gap-1 cursor-pointer pt-2"
                      >
                        <span>Dossier</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Please select two audits to compare.</div>
          )}

          {/* Navigation Tabs for Side-by-Side Comparison Details */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveTab('discrepancies')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'discrepancies'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                <span>Compliance Discrepancies</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300">
                  {comparisonRows.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('entities')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'entities'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Consignment & Cargo Diff</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'actions'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Corrective Actions</span>
              </button>
            </div>

            {/* Filter pills for discrepancies */}
            {activeTab === 'discrepancies' && (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-500 text-[11px] hidden sm:inline">Filter:</span>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-1 rounded-lg text-[11px] cursor-pointer transition-colors ${
                    filterMode === 'all'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({comparisonRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('differences_only')}
                  className={`px-2 py-1 rounded-lg text-[11px] cursor-pointer transition-colors ${
                    filterMode === 'differences_only'
                      ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Divergences ({comparisonRows.filter((r) => r.type !== 'shared').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('shared_only')}
                  className={`px-2 py-1 rounded-lg text-[11px] cursor-pointer transition-colors ${
                    filterMode === 'shared_only'
                      ? 'bg-teal-600/30 text-teal-300 font-bold border border-teal-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Shared ({comparisonRows.filter((r) => r.type === 'shared').length})
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: SIDE-BY-SIDE COMPLIANCE DISCREPANCIES TABLE */}
          {activeTab === 'discrepancies' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/70">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-1/4">Discrepancy / Rule Subject</th>
                      <th className="py-3 px-4 w-[35%] border-l border-slate-800 text-indigo-300">
                        Audit Dossier A ({auditA?.audit_id})
                      </th>
                      <th className="py-3 px-4 w-[35%] border-l border-slate-800 text-teal-300">
                        Audit Dossier B ({auditB?.audit_id})
                      </th>
                      <th className="py-3 px-3 text-right w-[5%]">Variance</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/80 text-xs">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <p className="font-semibold text-white">No Matching Discrepancies</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {filterMode === 'differences_only'
                              ? 'Both audits have identical discrepancy findings.'
                              : 'Neither audit has active discrepancies for this filter.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const isShared = row.type === 'shared';
                        const isAOnly = row.type === 'a_only';
                        const isBOnly = row.type === 'b_only';

                        return (
                          <tr key={row.id} className="hover:bg-slate-850/30 transition-colors">
                            {/* Subject */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="font-bold text-white text-xs leading-snug">{row.topic}</div>
                              <div className="mt-1">
                                <span
                                  className={`inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                                    isShared
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                      : isAOnly
                                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                                      : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                                  }`}
                                >
                                  {isShared ? 'Shared Violation' : isAOnly ? 'Audit A Only' : 'Audit B Only'}
                                </span>
                              </div>
                            </td>

                            {/* Audit A Column */}
                            <td className="py-3.5 px-4 align-top border-l border-slate-800 bg-indigo-950/5">
                              {row.severityA !== 'NONE' ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                        row.severityA === 'HIGH'
                                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      }`}
                                    >
                                      {row.severityA} SEVERITY
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-xs leading-relaxed">{row.detailA}</p>
                                  {row.regulationA && (
                                    <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                                      Ref: {row.regulationA}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>Fully Compliant (No Flag)</span>
                                </div>
                              )}
                            </td>

                            {/* Audit B Column */}
                            <td className="py-3.5 px-4 align-top border-l border-slate-800 bg-teal-950/5">
                              {row.severityB !== 'NONE' ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                        row.severityB === 'HIGH'
                                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      }`}
                                    >
                                      {row.severityB} SEVERITY
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-xs leading-relaxed">{row.detailB}</p>
                                  {row.regulationB && (
                                    <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                                      Ref: {row.regulationB}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>Fully Compliant (No Flag)</span>
                                </div>
                              )}
                            </td>

                            {/* Diff Verdict */}
                            <td className="py-3.5 px-3 align-top text-right whitespace-nowrap">
                              {isShared ? (
                                <span className="text-[11px] font-mono text-amber-400 font-bold">Match</span>
                              ) : isAOnly ? (
                                <span className="text-[11px] font-mono text-indigo-400 font-bold">A Flag</span>
                              ) : (
                                <span className="text-[11px] font-mono text-teal-400 font-bold">B Flag</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Systematic Risk Dimensions Table */}
              <div className="rounded-2xl border border-slate-800 p-4 bg-slate-900/60 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Statutory Risk Dimensions & Clearance Factors</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left A Risk Analysis */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <strong className="text-indigo-300 font-mono">{auditA?.audit_id} Risk Profile</strong>
                      <span className="text-xs font-bold font-mono text-white">Score: {auditA?.risk_score}/100</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300 text-[11px]">
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-500">•</span>
                        <span>
                          <strong>Jurisdiction:</strong> {auditA?.destination_country} ({auditA?.regulatory_framework?.split('&')[0]})
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-500">•</span>
                        <span>
                          <strong>Hazardous Goods:</strong>{' '}
                          {auditA?.extracted_entities?.items?.some((i) => i.hazardous_class)
                            ? `Identified (${auditA.extracted_entities.items.find((i) => i.hazardous_class)?.hazardous_class})`
                            : 'Standard Non-Hazardous Cargo'}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-500">•</span>
                        <span>
                          <strong>Tariff Remedies:</strong>{' '}
                          {auditA?.duty_tariff_analysis?.special_permits_required?.join(', ') ||
                            (auditA?.risk_score >= 70 ? 'Remedy enter under trade remedy provisions' : 'Standard MFN entry')}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Right B Risk Analysis */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-teal-500/20 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <strong className="text-teal-300 font-mono">{auditB?.audit_id} Risk Profile</strong>
                      <span className="text-xs font-bold font-mono text-white">Score: {auditB?.risk_score}/100</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300 text-[11px]">
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-500">•</span>
                        <span>
                          <strong>Jurisdiction:</strong> {auditB?.destination_country} ({auditB?.regulatory_framework?.split('&')[0]})
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-500">•</span>
                        <span>
                          <strong>Hazardous Goods:</strong>{' '}
                          {auditB?.extracted_entities?.items?.some((i) => i.hazardous_class)
                            ? `Identified (${auditB.extracted_entities.items.find((i) => i.hazardous_class)?.hazardous_class})`
                            : 'Standard Non-Hazardous Cargo'}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-500">•</span>
                        <span>
                          <strong>Tariff Remedies:</strong>{' '}
                          {auditB?.duty_tariff_analysis?.special_permits_required?.join(', ') ||
                            (auditB?.risk_score >= 70 ? 'Remedy enter under trade remedy provisions' : 'Standard MFN entry')}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSIGNMENT ENTITIES & CARGO DIFF */}
          {activeTab === 'entities' && auditA && auditB && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/70">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-1/4">Entity Attribute</th>
                      <th className="py-3 px-4 w-[35%] border-l border-slate-800 text-indigo-300">
                        Audit A ({auditA.audit_id})
                      </th>
                      <th className="py-3 px-4 w-[35%] border-l border-slate-800 text-teal-300">
                        Audit B ({auditB.audit_id})
                      </th>
                      <th className="py-3 px-3 text-right w-[5%] font-mono">Diff</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/80">
                    {/* Document Number */}
                    <tr className="hover:bg-slate-850/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">Document Number</td>
                      <td className="py-3 px-4 border-l border-slate-800 font-mono text-white">
                        {auditA.extracted_entities?.document_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4 border-l border-slate-800 font-mono text-white">
                        {auditB.extracted_entities?.document_number || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                        {auditA.extracted_entities?.document_number === auditB.extracted_entities?.document_number ? 'Identical' : 'Unique'}
                      </td>
                    </tr>

                    {/* Document Type */}
                    <tr className="hover:bg-slate-850/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">Document Type</td>
                      <td className="py-3 px-4 border-l border-slate-800 text-slate-200">
                        {auditA.extracted_entities?.document_type || 'Manifest'}
                      </td>
                      <td className="py-3 px-4 border-l border-slate-800 text-slate-200">
                        {auditB.extracted_entities?.document_type || 'Manifest'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                        {auditA.extracted_entities?.document_type === auditB.extracted_entities?.document_type ? 'Match' : 'Diff'}
                      </td>
                    </tr>

                    {/* Total Declared Value */}
                    <tr className="hover:bg-slate-850/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">Declared Value</td>
                      <td className="py-3 px-4 border-l border-slate-800 font-mono font-bold text-white">
                        ${valueA.toLocaleString()} {auditA.extracted_entities?.currency || 'USD'}
                      </td>
                      <td className="py-3 px-4 border-l border-slate-800 font-mono font-bold text-white">
                        ${valueB.toLocaleString()} {auditB.extracted_entities?.currency || 'USD'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px]">
                        <span className={valueDelta !== 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                          {valueDelta !== 0 ? `$${Math.abs(valueDelta).toLocaleString()} Δ` : 'Same'}
                        </span>
                      </td>
                    </tr>

                    {/* Destination Country */}
                    <tr className="hover:bg-slate-850/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">Destination Jurisdiction</td>
                      <td className="py-3 px-4 border-l border-slate-800 text-white font-medium">
                        {getFlag(auditA.destination_country)} {auditA.destination_country}
                      </td>
                      <td className="py-3 px-4 border-l border-slate-800 text-white font-medium">
                        {getFlag(auditB.destination_country)} {auditB.destination_country}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px]">
                        {auditA.destination_country === auditB.destination_country ? 'Same' : 'Diff'}
                      </td>
                    </tr>

                    {/* Shipper */}
                    <tr className="hover:bg-slate-850/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">Shipper / Exporter</td>
                      <td className="py-3 px-4 border-l border-slate-800 text-slate-200">
                        <div>{auditA.extracted_entities?.shipper_name || 'Shipper Not Listed'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{auditA.extracted_entities?.shipper_country}</div>
                      </td>
                      <td className="py-3 px-4 border-l border-slate-800 text-slate-200">
                        <div>{auditB.extracted_entities?.shipper_name || 'Shipper Not Listed'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{auditB.extracted_entities?.shipper_country}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                        {auditA.extracted_entities?.shipper_name === auditB.extracted_entities?.shipper_name ? 'Match' : 'Diff'}
                      </td>
                    </tr>

                    {/* Consignee */}
                    <tr className="hover:bg-slate-850/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">Consignee / Importer</td>
                      <td className="py-3 px-4 border-l border-slate-800 text-slate-200">
                        <div>{auditA.extracted_entities?.consignee_name || 'Consignee Not Listed'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{auditA.extracted_entities?.consignee_country}</div>
                      </td>
                      <td className="py-3 px-4 border-l border-slate-800 text-slate-200">
                        <div>{auditB.extracted_entities?.consignee_name || 'Consignee Not Listed'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{auditB.extracted_entities?.consignee_country}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                        {auditA.extracted_entities?.consignee_name === auditB.extracted_entities?.consignee_name ? 'Match' : 'Diff'}
                      </td>
                    </tr>

                    {/* Transport & Ports */}
                    <tr className="hover:bg-slate-850/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">Logistics Corridor</td>
                      <td className="py-3 px-4 border-l border-slate-800 text-slate-300 font-mono text-[11px]">
                        <div>{auditA.extracted_entities?.mode_of_transport || 'Freight'}</div>
                        <div className="text-slate-500">{auditA.extracted_entities?.port_of_loading} → {auditA.extracted_entities?.port_of_discharge}</div>
                      </td>
                      <td className="py-3 px-4 border-l border-slate-800 text-slate-300 font-mono text-[11px]">
                        <div>{auditB.extracted_entities?.mode_of_transport || 'Freight'}</div>
                        <div className="text-slate-500">{auditB.extracted_entities?.port_of_loading} → {auditB.extracted_entities?.port_of_discharge}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">—</td>
                    </tr>

                    {/* Classified Cargo Line Items */}
                    <tr className="hover:bg-slate-850/30">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">Classified Line Items</td>
                      <td className="py-3 px-4 border-l border-slate-800 space-y-2">
                        {(auditA.extracted_entities?.items || []).map((item, idx) => (
                          <div key={`item-a-${idx}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px]">
                            <div className="font-semibold text-white">{item.item_description}</div>
                            <div className="text-slate-400 mt-0.5">
                              Declared HS: <strong className="text-indigo-400">{item.declared_hs_code}</strong>
                              {item.verified_hs_code && <span> → Verified: <strong className="text-emerald-400">{item.verified_hs_code}</strong></span>}
                            </div>
                            {item.hazardous_class && (
                              <div className="text-rose-400 font-bold mt-0.5">{item.hazardous_class}</div>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 border-l border-slate-800 space-y-2">
                        {(auditB.extracted_entities?.items || []).map((item, idx) => (
                          <div key={`item-b-${idx}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px]">
                            <div className="font-semibold text-white">{item.item_description}</div>
                            <div className="text-slate-400 mt-0.5">
                              Declared HS: <strong className="text-teal-400">{item.declared_hs_code}</strong>
                              {item.verified_hs_code && <span> → Verified: <strong className="text-emerald-400">{item.verified_hs_code}</strong></span>}
                            </div>
                            {item.hazardous_class && (
                              <div className="text-rose-400 font-bold mt-0.5">{item.hazardous_class}</div>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CORRECTIVE ACTIONS */}
          {activeTab === 'actions' && auditA && auditB && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Audit A Actions */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-mono text-xs font-bold text-indigo-300">
                    Audit A Recommended Actions ({auditA.audit_id})
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {auditA.recommended_actions?.length || 0} Actions
                  </span>
                </div>

                <div className="space-y-2">
                  {(auditA.action_details?.length ? auditA.action_details : (auditA.recommended_actions || []).map((a, i) => ({ action: a, priority: 'REQUIRED' as const, target_agency: 'Customs' }))).map((act: any, idx: number) => (
                    <div key={`act-a-${idx}`} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                          act.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {act.priority || 'REQUIRED'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{act.target_agency || 'Customs'}</span>
                      </div>
                      <p className="text-slate-200">{act.action}</p>
                    </div>
                  ))}
                  {(auditA.recommended_actions?.length || 0) === 0 && (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No mandatory corrective actions required. Consignment is cleared.
                    </div>
                  )}
                </div>
              </div>

              {/* Audit B Actions */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-mono text-xs font-bold text-teal-300">
                    Audit B Recommended Actions ({auditB.audit_id})
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {auditB.recommended_actions?.length || 0} Actions
                  </span>
                </div>

                <div className="space-y-2">
                  {(auditB.action_details?.length ? auditB.action_details : (auditB.recommended_actions || []).map((a, i) => ({ action: a, priority: 'REQUIRED' as const, target_agency: 'Customs' }))).map((act: any, idx: number) => (
                    <div key={`act-b-${idx}`} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                          act.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {act.priority || 'REQUIRED'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{act.target_agency || 'Customs'}</span>
                      </div>
                      <p className="text-slate-200">{act.action}</p>
                    </div>
                  ))}
                  {(auditB.recommended_actions?.length || 0) === 0 && (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No mandatory corrective actions required. Consignment is cleared.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="text-slate-400">
            Comparing <strong className="text-indigo-400">{auditA?.audit_id}</strong> against{' '}
            <strong className="text-teal-400">{auditB?.audit_id}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer font-bold"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Comparison CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
