import React, { useState } from 'react';
import { AuditResponse } from '../types/compliance';
import {
  X,
  History,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowLeftRight,
  ArrowLeft,
  Scale,
  Building,
  DollarSign,
  FileText,
  AlertOctagon,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AuditResponse[];
  onSelectAudit: (audit: AuditResponse) => void;
  onClearHistory: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectAudit,
  onClearHistory,
}) => {
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isViewingComparison, setIsViewingComparison] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleSelectForCompare = (auditId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(auditId)) {
        return prev.filter((id) => id !== auditId);
      }
      if (prev.length >= 2) {
        // Replace second or cycle
        return [prev[1], auditId];
      }
      return [...prev, auditId];
    });
  };

  const auditA = history.find((h) => h.audit_id === selectedForCompare[0]);
  const auditB = history.find((h) => h.audit_id === selectedForCompare[1]);

  const handleOpenComparison = () => {
    if (selectedForCompare.length === 2) {
      setIsViewingComparison(true);
    }
  };

  const handleExitComparison = () => {
    setIsViewingComparison(false);
  };

  const resetCompare = () => {
    setSelectedForCompare([]);
    setIsViewingComparison(false);
    setCompareMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isViewingComparison
                  ? 'Side-by-Side Audit Compliance Comparison'
                  : 'Continuous Audit History & Verification Records'}
              </h2>
              <p className="text-xs text-slate-400">
                {isViewingComparison
                  ? 'Comparing statutory discrepancies, risk scores, and customs requirements between two dossiers'
                  : 'Inspect past cargo manifests, bills of lading, and commercial invoices'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isViewingComparison && history.length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (compareMode) setSelectedForCompare([]);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  compareMode
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-300" />
                <span>{compareMode ? 'Exit Compare Mode' : 'Compare 2 Audits'}</span>
              </button>
            )}

            {!isViewingComparison && history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                resetCompare();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison View (Requirement 4) */}
        {isViewingComparison && auditA && auditB ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top comparison navigation bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                type="button"
                onClick={handleExitComparison}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to History List</span>
              </button>

              <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <span>Risk Delta:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs ${
                    auditA.risk_score === auditB.risk_score
                      ? 'bg-slate-800 text-slate-300'
                      : auditA.risk_score > auditB.risk_score
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {Math.abs(auditA.risk_score - auditB.risk_score)} pts difference
                </span>
              </div>
            </div>

            {/* Side-by-side cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column A */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                      Audit Dossier A
                    </span>
                    <h3 className="text-sm font-bold text-white font-mono">{auditA.audit_id}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        auditA.audit_status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : auditA.audit_status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {auditA.audit_status} ({auditA.risk_score}/100)
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectAudit(auditA);
                        onClose();
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Open full dossier"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Table A */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Destination:</span>
                    <span className="text-white font-semibold">{auditA.destination_country}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Regulatory Framework:</span>
                    <span className="text-slate-300 font-mono text-[11px] truncate max-w-[200px]">
                      {auditA.regulatory_framework.split('/')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Declared Value:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      ${Number(auditA.extracted_entities?.total_declared_value || 0).toLocaleString()}{' '}
                      {auditA.extracted_entities?.currency || 'USD'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Shipper / Origin:</span>
                    <span className="text-slate-200 truncate max-w-[200px]">
                      {auditA.extracted_entities?.shipper_name || 'N/A'} (
                      {auditA.extracted_entities?.shipper_country || 'N/A'})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Consignee:</span>
                    <span className="text-slate-200 truncate max-w-[200px]">
                      {auditA.extracted_entities?.consignee_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Line Items:</span>
                    <span className="text-white font-mono">
                      {auditA.extracted_entities?.items?.length || 0} commodities
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Est. Duty Rate:</span>
                    <span className="text-amber-400 font-mono">
                      {auditA.duty_tariff_analysis?.estimated_duty_rate || '0.0%'}
                    </span>
                  </div>
                </div>

                {/* Discrepancies A */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-2">
                    Discrepancies ({auditA.compliance_discrepancies?.length || 0})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {(auditA.compliance_discrepancies?.length || 0) === 0 ? (
                      <p className="text-[11px] text-emerald-400 italic">Zero discrepancies. Clean entry.</p>
                    ) : (
                      auditA.compliance_discrepancies.map((disc, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed"
                        >
                          • {disc}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions A */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-2">
                    Mandated Actions ({auditA.recommended_actions?.length || 0})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {auditA.recommended_actions.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px] leading-relaxed"
                      >
                        → {act}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column B */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                      Audit Dossier B
                    </span>
                    <h3 className="text-sm font-bold text-white font-mono">{auditB.audit_id}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        auditB.audit_status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : auditB.audit_status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {auditB.audit_status} ({auditB.risk_score}/100)
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectAudit(auditB);
                        onClose();
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Open full dossier"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Table B */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Destination:</span>
                    <span className="text-white font-semibold">{auditB.destination_country}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Regulatory Framework:</span>
                    <span className="text-slate-300 font-mono text-[11px] truncate max-w-[200px]">
                      {auditB.regulatory_framework.split('/')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Declared Value:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      ${Number(auditB.extracted_entities?.total_declared_value || 0).toLocaleString()}{' '}
                      {auditB.extracted_entities?.currency || 'USD'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Shipper / Origin:</span>
                    <span className="text-slate-200 truncate max-w-[200px]">
                      {auditB.extracted_entities?.shipper_name || 'N/A'} (
                      {auditB.extracted_entities?.shipper_country || 'N/A'})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Consignee:</span>
                    <span className="text-slate-200 truncate max-w-[200px]">
                      {auditB.extracted_entities?.consignee_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Line Items:</span>
                    <span className="text-white font-mono">
                      {auditB.extracted_entities?.items?.length || 0} commodities
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Est. Duty Rate:</span>
                    <span className="text-amber-400 font-mono">
                      {auditB.duty_tariff_analysis?.estimated_duty_rate || '0.0%'}
                    </span>
                  </div>
                </div>

                {/* Discrepancies B */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-2">
                    Discrepancies ({auditB.compliance_discrepancies?.length || 0})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {(auditB.compliance_discrepancies?.length || 0) === 0 ? (
                      <p className="text-[11px] text-emerald-400 italic">Zero discrepancies. Clean entry.</p>
                    ) : (
                      auditB.compliance_discrepancies.map((disc, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed"
                        >
                          • {disc}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions B */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase font-mono block mb-2">
                    Mandated Actions ({auditB.recommended_actions?.length || 0})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {auditB.recommended_actions.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px] leading-relaxed"
                      >
                        → {act}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard History List with Selection Mode */
          <div className="p-5 overflow-y-auto space-y-3 flex-1">
            {compareMode && (
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-400" />
                  <span>
                    Select <strong>2 audit records</strong> to view side-by-side risk and discrepancy diff.
                  </span>
                </div>
                <span className="font-mono font-bold bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-200">
                  {selectedForCompare.length} / 2 Selected
                </span>
              </div>
            )}

            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No audit records saved yet. Run your first autonomous compliance audit above!
              </div>
            ) : (
              history.map((item, idx) => {
                let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                let icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;

                if (item.audit_status === 'REJECTED') {
                  badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                  icon = <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
                } else if (item.audit_status === 'FLAGGED') {
                  badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                  icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
                }

                const isSelected = selectedForCompare.includes(item.audit_id);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (compareMode) {
                        toggleSelectForCompare(item.audit_id);
                      } else {
                        onSelectAudit(item);
                        onClose();
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {compareMode ? (
                        <div className="text-indigo-400">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-400 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                          )}
                        </div>
                      ) : (
                        icon
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">{item.audit_id}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${badgeBg}`}
                          >
                            {item.audit_status} ({item.risk_score}/100)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            → {item.destination_country}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 truncate">
                          {item.extracted_entities?.shipper_name || item.document_file_name || 'Shipper Unspecified'} →{' '}
                          {item.extracted_entities?.consignee_name || item.destination_country || 'Consignee Unspecified'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {new Date(item.timestamp).toLocaleString()} • Value: $
                          {Number(item.extracted_entities?.total_declared_value || 0).toLocaleString()}{' '}
                          {item.extracted_entities?.currency || 'USD'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-slate-500 group-hover:text-emerald-400">
                      <span className="text-xs font-medium hidden sm:inline">
                        {compareMode ? (isSelected ? 'Selected' : 'Select') : 'View Dossier'}
                      </span>
                      {compareMode ? (
                        <Scale className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>{history.length} audit records stored locally</span>

          <div className="flex items-center gap-2">
            {compareMode && !isViewingComparison && (
              <button
                type="button"
                onClick={handleOpenComparison}
                disabled={selectedForCompare.length !== 2}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  selectedForCompare.length === 2
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Compare {selectedForCompare.length}/2 Audits</span>
              </button>
            )}

            <button
              onClick={() => {
                resetCompare();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
