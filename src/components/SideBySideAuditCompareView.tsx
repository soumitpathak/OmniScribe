import React, { useState, useMemo } from 'react';
import { AuditResponse } from '../types/compliance';
import { useToast } from '../context/ToastContext';
import {
  Columns,
  ArrowLeftRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Scale,
  DollarSign,
  Globe,
  Truck,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Check,
  Filter,
  FileText,
  Printer,
  Sparkles,
} from 'lucide-react';

interface SideBySideAuditCompareViewProps {
  currentAudit: AuditResponse;
  history: AuditResponse[];
  onClose: () => void;
  onSelectAudit?: (audit: AuditResponse) => void;
}

export const SideBySideAuditCompareView: React.FC<SideBySideAuditCompareViewProps> = ({
  currentAudit,
  history,
  onClose,
  onSelectAudit,
}) => {
  const toast = useToast();

  // Audit A defaults to currentAudit
  const [auditAId, setAuditAId] = useState<string>(currentAudit.audit_id);

  // Audit B defaults to the most recent different audit in history (or fallback)
  const [auditBId, setAuditBId] = useState<string>(() => {
    const other = history.find((h) => h.audit_id !== currentAudit.audit_id);
    return other?.audit_id || currentAudit.audit_id;
  });

  const [discrepancyFilter, setDiscrepancyFilter] = useState<'all' | 'differences_only' | 'high_severity_only'>('all');

  const auditA = useMemo(() => {
    return history.find((h) => h.audit_id === auditAId) || currentAudit;
  }, [history, auditAId, currentAudit]);

  const auditB = useMemo(() => {
    return history.find((h) => h.audit_id === auditBId) || history[0] || currentAudit;
  }, [history, auditBId, currentAudit]);

  // Swap Left and Right audits
  const handleSwap = () => {
    const temp = auditAId;
    setAuditAId(auditBId);
    setAuditBId(temp);
    toast.info('Audits Swapped', 'Swapped Left and Right audit dossiers.');
  };

  // Helper flags
  const getFlag = (country?: string) => {
    if (!country) return '🌐';
    const c = country.toLowerCase();
    if (c.includes('usa') || c.includes('united states')) return '🇺🇸';
    if (c.includes('eu') || c.includes('germany') || c.includes('netherlands')) return '🇪🇺';
    if (c.includes('singapore')) return '🇸🇬';
    if (c.includes('uae') || c.includes('dubai')) return '🇦🇪';
    if (c.includes('uk') || c.includes('united kingdom')) return '🇬🇧';
    if (c.includes('japan')) return '🇯🇵';
    if (c.includes('australia')) return '🇦🇺';
    if (c.includes('china')) return '🇨🇳';
    if (c.includes('taiwan')) return '🇹🇼';
    if (c.includes('india')) return '🇮🇳';
    if (c.includes('brazil')) return '🇧🇷';
    return '🌐';
  };

  // Status helper
  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          APPROVED
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-mono font-bold">
          <ShieldAlert className="w-3.5 h-3.5" />
          REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold">
        <AlertTriangle className="w-3.5 h-3.5" />
        FLAGGED
      </span>
    );
  };

  // Discrepancy comparison calculation
  const discsA = auditA.compliance_discrepancies || [];
  const discsB = auditB.compliance_discrepancies || [];

  const isUniqueToA = (disc: string) => {
    const norm = disc.toLowerCase().slice(0, 30);
    return !discsB.some((b) => b.toLowerCase().includes(norm) || norm.includes(b.toLowerCase().slice(0, 30)));
  };

  const isUniqueToB = (disc: string) => {
    const norm = disc.toLowerCase().slice(0, 30);
    return !discsA.some((a) => a.toLowerCase().includes(norm) || norm.includes(a.toLowerCase().slice(0, 30)));
  };

  // Filtered lists
  const filteredDiscsA = useMemo(() => {
    return discsA.filter((d) => {
      if (discrepancyFilter === 'differences_only') return isUniqueToA(d);
      if (discrepancyFilter === 'high_severity_only') {
        const detail = auditA.discrepancy_details?.find((det) => d.includes(det.title) || det.description.includes(d.slice(0, 20)));
        return detail?.severity === 'HIGH';
      }
      return true;
    });
  }, [discsA, discsB, discrepancyFilter, auditA]);

  const filteredDiscsB = useMemo(() => {
    return discsB.filter((d) => {
      if (discrepancyFilter === 'differences_only') return isUniqueToB(d);
      if (discrepancyFilter === 'high_severity_only') {
        const detail = auditB.discrepancy_details?.find((det) => d.includes(det.title) || det.description.includes(d.slice(0, 20)));
        return detail?.severity === 'HIGH';
      }
      return true;
    });
  }, [discsA, discsB, discrepancyFilter, auditB]);

  // Risk Score Delta
  const scoreDelta = (auditA.risk_score || 0) - (auditB.risk_score || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controls & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold mb-1">
              <Columns className="w-4 h-4 text-emerald-400" />
              <span>Split-Pane Regulatory Comparison</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                Side-by-Side Mode
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Compare Historical Audits Side-by-Side
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Select any two audit dossiers to cross-examine risk scores, statutory discrepancies, Incoterms, and remediation requirements in a synchronized dual layout.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSwap}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Swap Left and Right audit dossiers"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>Swap Sides</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              title="Exit Side-by-Side comparison"
            >
              <X className="w-4 h-4" />
              <span>Exit Side-by-Side</span>
            </button>
          </div>
        </div>

        {/* Delta Comparison Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Risk Score Variance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-xl font-extrabold font-mono ${
                  scoreDelta > 0 ? 'text-rose-400' : scoreDelta < 0 ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {scoreDelta > 0 ? `+${scoreDelta}` : `${scoreDelta}`} pts
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {scoreDelta > 0 ? '(A is higher risk)' : scoreDelta < 0 ? '(B is higher risk)' : '(Equal risk)'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Status Divergence</span>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-xs font-bold">
              <span className={auditA.audit_status === 'APPROVED' ? 'text-emerald-400' : auditA.audit_status === 'FLAGGED' ? 'text-amber-400' : 'text-rose-400'}>
                {auditA.audit_status}
              </span>
              <span className="text-slate-500">vs</span>
              <span className={auditB.audit_status === 'APPROVED' ? 'text-emerald-400' : auditB.audit_status === 'FLAGGED' ? 'text-amber-400' : 'text-rose-400'}>
                {auditB.audit_status}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Discrepancy Count</span>
            <div className="flex items-baseline gap-2 mt-1 font-mono">
              <span className="text-base font-bold text-white">
                {discsA.length} vs {discsB.length}
              </span>
              <span className="text-[11px] text-slate-400">
                ({discsA.length - discsB.length > 0 ? `+${discsA.length - discsB.length} in A` : discsA.length - discsB.length < 0 ? `+${discsB.length - discsA.length} in B` : 'same'})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Declared Value</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono text-emerald-400 font-bold truncate">
              <span>${Number(auditA.extracted_entities?.total_declared_value || 0).toLocaleString()}</span>
              <span className="text-slate-500 text-[10px]">vs</span>
              <span>${Number(auditB.extracted_entities?.total_declared_value || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Discrepancy Filter:
            </span>
            <button
              type="button"
              onClick={() => setDiscrepancyFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                discrepancyFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Findings
            </button>
            <button
              type="button"
              onClick={() => setDiscrepancyFilter('differences_only')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                discrepancyFilter === 'differences_only'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Differences Only
            </button>
            <button
              type="button"
              onClick={() => setDiscrepancyFilter('high_severity_only')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                discrepancyFilter === 'high_severity_only'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              High Severity Only
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Comparing <strong className="text-cyan-400">{auditA.audit_id}</strong> against <strong className="text-emerald-400">{auditB.audit_id}</strong>
          </span>
        </div>
      </div>

      {/* Split-Pane Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===================== LEFT PANE: AUDIT A ===================== */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
          {/* Audit Selector Header */}
          <div className="space-y-3 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                PANE A (PRIMARY DOSSIER)
              </span>
              {getStatusBadge(auditA.audit_status)}
            </div>

            <div className="relative">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Select Audit Record A:
              </label>
              <select
                value={auditAId}
                onChange={(e) => setAuditAId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono cursor-pointer"
              >
                {history.map((h) => (
                  <option key={`a-${h.audit_id}`} value={h.audit_id} className="bg-slate-900 text-white">
                    {getFlag(h.destination_country)} {h.audit_id} • {h.destination_country} • Score: {h.risk_score} [{h.audit_status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Risk Score Gauge & Status */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Composite Risk Score</span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-black font-mono ${
                    auditA.risk_score >= 70 ? 'text-rose-400' : auditA.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {auditA.risk_score}
                </span>
                <span className="text-xs font-mono text-slate-400">/ 100</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 ml-1">
                  {auditA.risk_level}
                </span>
              </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="w-28 space-y-1">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    auditA.risk_score >= 70 ? 'bg-rose-500' : auditA.risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, auditA.risk_score)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 text-right block">
                {auditA.risk_score}% Severity
              </span>
            </div>
          </div>

          {/* Consignment Profile */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" />
                <span>Consignment Dossier</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {auditA.extracted_entities?.document_number || auditA.document_file_name || auditA.audit_id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block">Shipper / Origin:</span>
                <span className="font-semibold text-slate-200">
                  {auditA.extracted_entities?.shipper_name || 'N/A'} ({auditA.extracted_entities?.shipper_country || 'N/A'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Consignee / Destination:</span>
                <span className="font-semibold text-slate-200">
                  {auditA.extracted_entities?.consignee_name || 'N/A'} ({auditA.destination_country})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Transport / Incoterms:</span>
                <span className="font-mono text-slate-300">
                  {auditA.extracted_entities?.mode_of_transport || 'Freight'} • {auditA.extracted_entities?.incoterms || 'FOB'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Customs Declared Value:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${Number(auditA.extracted_entities?.total_declared_value || 0).toLocaleString()} {auditA.extracted_entities?.currency || 'USD'}
                </span>
              </div>
            </div>
          </div>

          {/* Discrepancy List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Statutory Discrepancies ({filteredDiscsA.length})</span>
              </h4>
            </div>

            {filteredDiscsA.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-emerald-400 font-mono">
                ✓ No discrepancies matching current filter. Clean regulatory status.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredDiscsA.map((disc, idx) => {
                  const isUnique = isUniqueToA(disc);
                  const detail = auditA.discrepancy_details?.find(
                    (d) => disc.includes(d.title) || d.description.includes(disc.slice(0, 20))
                  );

                  return (
                    <div
                      key={`disc-a-${idx}`}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                        isUnique
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-200 leading-snug">
                          {detail?.title || `Finding #${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {detail?.severity && (
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                detail.severity === 'HIGH'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {detail.severity}
                            </span>
                          )}
                          {isUnique && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              UNIQUE TO A
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed">{disc}</p>

                      {detail?.regulation_ref && (
                        <span className="text-[10px] font-mono text-cyan-400 block pt-0.5">
                          Ref: {detail.regulation_ref}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remediation Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recommended Remediation ({auditA.recommended_actions?.length || 0})</span>
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300 max-h-44 overflow-y-auto pr-1">
              {(auditA.recommended_actions || []).map((action, i) => (
                <li key={`act-a-${i}`} className="p-2 rounded-lg bg-slate-950 border border-slate-850 flex items-start gap-2">
                  <span className="font-mono text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ===================== RIGHT PANE: AUDIT B ===================== */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
          {/* Audit Selector Header */}
          <div className="space-y-3 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                PANE B (COMPARISON DOSSIER)
              </span>
              {getStatusBadge(auditB.audit_status)}
            </div>

            <div className="relative">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Select Audit Record B:
              </label>
              <select
                value={auditBId}
                onChange={(e) => setAuditBId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono cursor-pointer"
              >
                {history.map((h) => (
                  <option key={`b-${h.audit_id}`} value={h.audit_id} className="bg-slate-900 text-white">
                    {getFlag(h.destination_country)} {h.audit_id} • {h.destination_country} • Score: {h.risk_score} [{h.audit_status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Risk Score Gauge & Status */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Composite Risk Score</span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-black font-mono ${
                    auditB.risk_score >= 70 ? 'text-rose-400' : auditB.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {auditB.risk_score}
                </span>
                <span className="text-xs font-mono text-slate-400">/ 100</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 ml-1">
                  {auditB.risk_level}
                </span>
              </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="w-28 space-y-1">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    auditB.risk_score >= 70 ? 'bg-rose-500' : auditB.risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, auditB.risk_score)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 text-right block">
                {auditB.risk_score}% Severity
              </span>
            </div>
          </div>

          {/* Consignment Profile */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consignment Dossier</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {auditB.extracted_entities?.document_number || auditB.document_file_name || auditB.audit_id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block">Shipper / Origin:</span>
                <span className="font-semibold text-slate-200">
                  {auditB.extracted_entities?.shipper_name || 'N/A'} ({auditB.extracted_entities?.shipper_country || 'N/A'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Consignee / Destination:</span>
                <span className="font-semibold text-slate-200">
                  {auditB.extracted_entities?.consignee_name || 'N/A'} ({auditB.destination_country})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Transport / Incoterms:</span>
                <span className="font-mono text-slate-300">
                  {auditB.extracted_entities?.mode_of_transport || 'Freight'} • {auditB.extracted_entities?.incoterms || 'FOB'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Customs Declared Value:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${Number(auditB.extracted_entities?.total_declared_value || 0).toLocaleString()} {auditB.extracted_entities?.currency || 'USD'}
                </span>
              </div>
            </div>
          </div>

          {/* Discrepancy List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Statutory Discrepancies ({filteredDiscsB.length})</span>
              </h4>
            </div>

            {filteredDiscsB.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-emerald-400 font-mono">
                ✓ No discrepancies matching current filter. Clean regulatory status.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredDiscsB.map((disc, idx) => {
                  const isUnique = isUniqueToB(disc);
                  const detail = auditB.discrepancy_details?.find(
                    (d) => disc.includes(d.title) || d.description.includes(disc.slice(0, 20))
                  );

                  return (
                    <div
                      key={`disc-b-${idx}`}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                        isUnique
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-200 leading-snug">
                          {detail?.title || `Finding #${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {detail?.severity && (
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                detail.severity === 'HIGH'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {detail.severity}
                            </span>
                          )}
                          {isUnique && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              UNIQUE TO B
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed">{disc}</p>

                      {detail?.regulation_ref && (
                        <span className="text-[10px] font-mono text-cyan-400 block pt-0.5">
                          Ref: {detail.regulation_ref}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remediation Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recommended Remediation ({auditB.recommended_actions?.length || 0})</span>
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300 max-h-44 overflow-y-auto pr-1">
              {(auditB.recommended_actions || []).map((action, i) => (
                <li key={`act-b-${i}`} className="p-2 rounded-lg bg-slate-950 border border-slate-850 flex items-start gap-2">
                  <span className="font-mono text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
