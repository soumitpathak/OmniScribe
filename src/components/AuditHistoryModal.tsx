import React from 'react';
import { AuditResponse } from '../types/compliance';
import {
  X,
  History,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Cloud,
  LogIn,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateAuditPDF } from '../utils/pdfGenerator';

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
  const { user, openLoginModal } = useAuth();

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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Continuous Audit History & Verification Records
                </h2>
                {user ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    Cloud Synced
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Local Cache
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Previously audited cargo manifests, bills of lading, and commercial invoices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync Banner if not logged in */}
        {!user && (
          <div className="px-5 py-2.5 bg-emerald-950/20 border-b border-emerald-900/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sign in to automatically sync your audit logs to Firestore cloud storage.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                openLoginModal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          </div>
        )}

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
                        {item.extracted_entities?.shipper_name || 'Shipper'} →{' '}
                        {item.extracted_entities?.consignee_name || 'Consignee'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {new Date(item.timestamp).toLocaleString()} • Value: $
                        {Number(item.extracted_entities?.total_declared_value || 0).toLocaleString()}{' '}
                        {item.extracted_entities?.currency || 'USD'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateAuditPDF(
                          item,
                          user
                            ? {
                                name: user.displayName,
                                email: user.email,
                                uid: user.uid,
                              }
                            : undefined
                        );
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700/80 transition-colors cursor-pointer"
                      title="Download Customs PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-emerald-400">
                      <span className="text-xs font-medium hidden sm:inline">View Dossier</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            {history.length} audit records {user ? 'synced with Firestore' : 'stored in local cache'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
