import React from 'react';
import { AuditResponse } from '../types/compliance';
import { X, History, Trash2, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Continuous Audit History & Verification Records
              </h2>
              <p className="text-xs text-slate-400">
                Previously audited cargo manifests, bills of lading, and commercial invoices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
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

              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectAudit(item);
                    onClose();
                  }}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {icon}
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {item.audit_id}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${badgeBg}`}>
                          {item.audit_status} ({item.risk_score}/100)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          → {item.destination_country}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 truncate">
                        {item.extracted_entities.shipper_name} → {item.extracted_entities.consignee_name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {new Date(item.timestamp).toLocaleString()} • Value: ${Number(item.extracted_entities.total_declared_value || 0).toLocaleString()} {item.extracted_entities.currency}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-slate-500 group-hover:text-emerald-400">
                    <span className="text-xs font-medium hidden sm:inline">View Dossier</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>{history.length} audit records stored locally</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
