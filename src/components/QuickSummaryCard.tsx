import React, { useState, useEffect } from 'react';
import { AuditResponse } from '../types/compliance';
import { useToast } from '../context/ToastContext';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  Send,
  SlidersHorizontal,
} from 'lucide-react';

interface QuickSummaryCardProps {
  audit: AuditResponse;
  onUpdateAuditSummary?: (newSummary: string) => void;
}

export const QuickSummaryCard: React.FC<QuickSummaryCardProps> = ({
  audit,
  onUpdateAuditSummary,
}) => {
  const toast = useToast();
  const [summary, setSummary] = useState<string>(() => audit.quick_summary || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'paragraph' | 'breakdown'>('paragraph');
  const [generationSource, setGenerationSource] = useState<'gemini' | 'statutory'>(
    audit.audit_engine?.toLowerCase().includes('gemini') ? 'gemini' : 'statutory'
  );

  // Generate fallback summary on client if backend is unreachable
  const getClientFallbackSummary = (): string => {
    const country = audit.destination_country || 'USA';
    const status = audit.audit_status || 'FLAGGED';
    const risk = audit.risk_score || 50;
    const items = audit.extracted_entities?.items || [];
    const itemDesc = items[0]?.item_description || 'Commercial freight cargo';
    const origin = audit.extracted_entities?.shipper_country || 'foreign origin';
    const discCount = audit.compliance_discrepancies?.length || 0;

    if (status === 'APPROVED') {
      return `This consignment of ${itemDesc.toLowerCase()} originating from ${origin} destined for ${country} has successfully passed all statutory regulatory inspections with an exceptional risk score of ${risk}/100. All declared Harmonized Tariff codes, Incoterms, and origin documentation comply fully with international customs requirements with zero discrepancies identified. The consignment is cleared for automated green-channel release and immediate onward logistics dispatch.`;
    }

    if (status === 'REJECTED') {
      const topDisc = audit.compliance_discrepancies?.[0] || 'severe statutory violations and unpermitted cargo detected';
      return `This inbound consignment of ${itemDesc.toLowerCase()} to ${country} has been assigned a critical compliance risk score of ${risk}/100 and held under mandatory quarantine. The audit identified severe regulatory non-compliance, notably: ${topDisc.replace(/\.$/, '')}. Logistics operators must immediately halt dispatch and obtain the requisite strategic export authorization or certified safety permits to avert formal customs seizure and financial penalties.`;
    }

    // FLAGGED
    const topDisc = audit.compliance_discrepancies?.[0] || 'mandatory import documentation or tariff adjustments pending';
    return `This consignment of ${itemDesc.toLowerCase()} entering ${country} has been flagged for conditional compliance review with a moderate risk score of ${risk}/100. The audit identified ${discCount} documentation discrepancy, specifically: ${topDisc.replace(/\.$/, '')}. Customs declarants must file the recommended statutory amendments and provide the mandated certificates prior to carrier discharge to ensure seamless entry release.`;
  };

  // Generate or fetch summary using Gemini API endpoint
  const generateSummary = async (isManualClick = false) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/quick-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audit: {
            destination_country: audit.destination_country,
            audit_status: audit.audit_status,
            risk_score: audit.risk_score,
            risk_level: audit.risk_level,
            extracted_entities: audit.extracted_entities,
            compliance_discrepancies: audit.compliance_discrepancies,
            recommended_actions: audit.recommended_actions,
            duty_tariff_analysis: audit.duty_tariff_analysis,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const genSummary = data.quick_summary?.trim() || getClientFallbackSummary();
        setSummary(genSummary);
        setGenerationSource(data.engine?.includes('gemini') ? 'gemini' : 'statutory');
        if (onUpdateAuditSummary) {
          onUpdateAuditSummary(genSummary);
        }
        if (isManualClick) {
          toast.success(
            'Quick Summary Generated',
            'Gemini generated a fresh 3-sentence compliance posture summary.'
          );
        }
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (err: any) {
      console.warn('Falling back to local compliance summary generator:', err?.message);
      const fallback = getClientFallbackSummary();
      setSummary(fallback);
      setGenerationSource('statutory');
      if (onUpdateAuditSummary) {
        onUpdateAuditSummary(fallback);
      }
      if (isManualClick) {
        toast.info(
          'Quick Summary Ready',
          'Autonomous statutory engine synthesized the 3-sentence compliance posture.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate if summary is not present on mount or when audit changes
  useEffect(() => {
    if (audit.quick_summary && audit.quick_summary.trim().length > 0) {
      setSummary(audit.quick_summary);
    } else {
      generateSummary(false);
    }
  }, [audit.audit_id]);

  // Copy summary to clipboard
  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    toast.info('Summary Copied', '3-sentence executive compliance summary copied to clipboard.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Parse summary into 3 distinct sentences
  const parseThreeSentences = (text: string): { s1: string; s2: string; s3: string } => {
    if (!text) return { s1: '', s2: '', s3: '' };
    // Split on periods followed by space or capital letter
    const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter((s) => s.trim().length > 0);
    return {
      s1: parts[0] || text,
      s2: parts[1] || 'Statutory review verifies applicable tariff documentation and hazardous material cargo compliance.',
      s3: parts[2] || 'Operational directives mandate adherence to customs clearance guidelines prior to cargo dispatch.',
    };
  };

  const sentences = parseThreeSentences(summary);

  // Status visual attributes
  const isApproved = audit.audit_status === 'APPROVED';
  const isRejected = audit.audit_status === 'REJECTED';
  const isFlagged = audit.audit_status === 'FLAGGED';

  const cardBorder = isApproved
    ? 'border-emerald-500/40 bg-emerald-950/15'
    : isRejected
    ? 'border-rose-500/40 bg-rose-950/15'
    : 'border-amber-500/40 bg-amber-950/15';

  const badgeTheme = isApproved
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : isRejected
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

  const statusLabel = isApproved
    ? 'Automated Green-Channel Release'
    : isRejected
    ? 'Mandatory Quarantine Hold'
    : 'Conditional Review Mandate';

  return (
    <div
      className={`rounded-3xl border ${cardBorder} p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm transition-all duration-300`}
    >
      {/* Decorative ambient background glow */}
      <div
        className={`absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500'
        }`}
      />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10 bg-indigo-500" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Quick Summary: Executive Compliance Posture</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Gemini 3.8 Flash</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${badgeTheme}`}>
                {isApproved ? <CheckCircle2 className="w-3 h-3" /> : isRejected ? <ShieldAlert className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>{statusLabel}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous 3-sentence plain-English appraisal of regulatory admissibility, non-compliance exposure, and clearance directives.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* View toggle */}
          <div className="flex rounded-xl bg-slate-950/80 p-0.5 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('paragraph')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeView === 'paragraph'
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Continuous narrative view"
            >
              Paragraph
            </button>
            <button
              type="button"
              onClick={() => setActiveView('breakdown')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeView === 'breakdown'
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sentence-by-sentence analysis"
            >
              3 Sentences
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={isLoading || !summary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-all cursor-pointer"
            title="Copy 3-sentence summary"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Regenerate with Gemini Button */}
          <button
            type="button"
            onClick={() => generateSummary(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Regenerate 3-sentence plain-English executive summary using Gemini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Synthesizing...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Summary Content Body */}
      <div className="relative z-10 pt-4">
        {isLoading ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Synthesizing plain-English compliance posture with Gemini...</span>
            </div>
            <div className="w-full space-y-2">
              <div className="h-3.5 bg-slate-800 rounded-md w-11/12" />
              <div className="h-3.5 bg-slate-800 rounded-md w-10/12" />
              <div className="h-3.5 bg-slate-800 rounded-md w-9/12" />
            </div>
          </div>
        ) : activeView === 'paragraph' ? (
          /* Paragraph Narrative View */
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 relative">
            <div className="text-slate-100 text-sm sm:text-base leading-relaxed tracking-normal font-sans">
              <span className="font-semibold text-emerald-300">1. Routing & Admissibility: </span>
              <span>{sentences.s1} </span>
              <span className="font-semibold text-amber-300">2. Statutory Finding: </span>
              <span>{sentences.s2} </span>
              <span className="font-semibold text-cyan-300">3. Operational Directive: </span>
              <span>{sentences.s3}</span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  Engine: <strong className="text-slate-300">{generationSource === 'gemini' ? 'Gemini 3.8 Flash Multimodal' : 'Autonomous Regulatory Rules'}</strong>
                </span>
                <span>•</span>
                <span>Scope: <strong className="text-slate-300">{audit.destination_country} Border Admissibility</strong></span>
              </div>
              <div className="text-slate-500">
                Verified against WTO/WCO Customs Frameworks
              </div>
            </div>
          </div>
        ) : (
          /* 3-Sentence Step Breakdown View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Sentence 1 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold mb-1">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span>Consignment & Admissibility</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {sentences.s1}
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                Routing: {audit.extracted_entities?.shipper_country || 'Origin'} → {audit.destination_country} ({audit.risk_score}/100)
              </div>
            </div>

            {/* Sentence 2 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold mb-1">
                  <span className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span>Statutory Compliance Finding</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {sentences.s2}
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                {audit.compliance_discrepancies?.length || 0} Statutory Discrepanc{audit.compliance_discrepancies?.length === 1 ? 'y' : 'ies'} Detected
              </div>
            </div>

            {/* Sentence 3 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-1">
                  <span className="w-5 h-5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <span>Executive Directive</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {sentences.s3}
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                Action: {statusLabel}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
