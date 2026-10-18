import React from 'react';
import { AuditResponse } from '../types/compliance';
import { ShieldAlert, AlertOctagon, X, ArrowRight, FileDown, ExternalLink, Flame } from 'lucide-react';
import { generateAuditPDF } from '../utils/pdfGenerator';
import { useToast } from '../context/ToastContext';

interface HighRiskAlertBannerProps {
  audit: AuditResponse;
  threshold: number;
  onDismiss: () => void;
  onInspect: (audit: AuditResponse) => void;
}

export const HighRiskAlertBanner: React.FC<HighRiskAlertBannerProps> = ({
  audit,
  threshold,
  onDismiss,
  onInspect,
}) => {
  const toast = useToast();

  const handleDownloadPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      generateAuditPDF(audit);
      toast.success('Report Downloaded', `PDF Report generated for high-risk consignment ${audit.audit_id}`);
    } catch (err) {
      toast.error('Download Error', 'Could not compile PDF report.');
    }
  };

  const primaryDiscrepancy =
    audit.compliance_discrepancies?.[0] ||
    audit.discrepancy_details?.[0]?.title ||
    'Severe regulatory breach detected. Statutory import clearance suspended.';

  return (
    <div
      role="alert"
      className="sticky top-16 z-40 w-full bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 border-b-2 border-rose-500 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Warning Icon & Content */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-300 shrink-0 shadow-lg shadow-rose-950/50">
              <ShieldAlert className="w-5 h-5 animate-pulse text-rose-400" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-sm flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  HIGH-RISK CONSIGNMENT THRESHOLD BREACH
                </span>

                <span className="text-xs font-mono font-bold text-rose-300">
                  Risk Score: <strong className="text-white text-sm">{audit.risk_score}</strong> / 100
                  <span className="text-rose-400 font-normal ml-1">(Cutoff: &gt;{threshold})</span>
                </span>

                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  REF: {audit.audit_id}
                </span>

                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {audit.destination_country}
                </span>
              </div>

              <p className="text-xs text-rose-100 font-medium truncate max-w-3xl">
                ⚠️ <strong className="text-white font-semibold">Immediate Action Required:</strong> {primaryDiscrepancy}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => onInspect(audit)}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-950 font-black text-xs shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Inspect Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDownloadPDF}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-rose-500/40 text-xs font-bold transition-colors cursor-pointer"
              title="Download PDF report with compliance findings"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">PDF Summary</span>
            </button>

            <button
              onClick={onDismiss}
              type="button"
              className="p-1.5 rounded-xl text-rose-300 hover:text-white hover:bg-rose-800/40 transition-colors cursor-pointer"
              title="Dismiss high-risk alert banner"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
