import React, { useState } from 'react';
import { AuditResponse } from '../types/compliance';
import { RiskMeter } from './RiskMeter';
import { RiskTrendChart } from './RiskTrendChart';
import { ExtractedEntitiesCard } from './ExtractedEntitiesCard';
import { DiscrepanciesCard } from './DiscrepanciesCard';
import { ActionItemsCard } from './ActionItemsCard';
import { DutyTariffCard } from './DutyTariffCard';
import { AgentThoughtTrace } from './AgentThoughtTrace';
import { ItemRiskFactorScale } from './ItemRiskFactorScale';
import { ConfidenceScoreGauge } from './ConfidenceScoreGauge';
import { PreemptiveActionsCard } from './PreemptiveActionsCard';
import { QuickSummaryCard } from './QuickSummaryCard';
import { SideBySideAuditCompareView } from './SideBySideAuditCompareView';
import { AuditCommentSection } from './AuditCommentSection';
import { generateAuditPDF } from '../utils/pdfGenerator';
import { useToast } from '../context/ToastContext';
import {
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  FileDown,
  Copy,
  Printer,
  RotateCcw,
  Sparkles,
  Check,
  Building,
  Calendar,
  Layers,
  Activity,
  Flame,
  Columns,
  ArrowLeftRight,
  MessageSquare,
} from 'lucide-react';

interface AuditReportViewProps {
  audit: AuditResponse;
  onReset: () => void;
  history?: AuditResponse[];
  onSelectAudit?: (audit: AuditResponse) => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  audit,
  onReset,
  history = [],
  onSelectAudit,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSideBySide, setIsSideBySide] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'preemptive' | 'risk_factors' | 'trend' | 'entities' | 'discrepancies' | 'actions' | 'comments'>('overview');

  // Print report via browser print dialog
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      handleDownloadPDF();
    }
  };

  // Status badge styling
  let statusBadgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
  let statusHeadline = 'CLEARED FOR ENTRY';
  let statusSummary = 'Consignment meets statutory import criteria. Recommended for Automated Green-Channel Release.';

  if (audit.audit_status === 'REJECTED') {
    statusBadgeBg = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    statusIcon = <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />;
    statusHeadline = 'ENTRY REJECTED / QUARANTINE HOLD';
    statusSummary = 'Severe regulatory non-compliance detected. Consignment cannot enter customs territory without remediation.';
  } else if (audit.audit_status === 'FLAGGED') {
    statusBadgeBg = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    statusIcon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    statusHeadline = 'FLAGGED FOR CONDITIONAL REVIEW';
    statusSummary = 'Documentation discrepancies or conditional tariff adjustments identified. Requires broker action.';
  }

  // Export JSON handler
  const handleExportJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(audit, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `OmniScribe_Audit_${audit.audit_id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('JSON Export Downloaded', `Audit dossier saved as OmniScribe_Audit_${audit.audit_id}.json`);
    } catch (e: any) {
      toast.error('Export Failed', 'Could not export audit JSON data.');
    }
  };

  // Export Customs Clearance Slip / Summary
  const handleExportSummary = () => {
    try {
      const summaryText = `================================================================================
OMNISCRIBE - AUTONOMOUS LOGISTICS REGULATORY COMPLIANCE REPORT
================================================================================
AUDIT REFERENCE ID: ${audit.audit_id}
TIMESTAMP:          ${audit.timestamp}
DESTINATION:        ${audit.destination_country}
REGULATORY AGENCY:  ${audit.regulatory_framework}

FINAL AUDIT STATUS: [ ${audit.audit_status} ]
RISK SCORE:         ${audit.risk_score} / 100 (${audit.risk_level} RISK)

1. SHIPMENT DOSSIER:
- Shipper:          ${audit.extracted_entities?.shipper_name || 'N/A'} (${audit.extracted_entities?.shipper_country || 'N/A'})
- Consignee:        ${audit.extracted_entities?.consignee_name || 'N/A'} (${audit.extracted_entities?.consignee_country || 'N/A'})
- Document No:      ${audit.extracted_entities?.document_number || 'N/A'}
- Declared Value:   ${audit.extracted_entities?.currency || 'USD'} ${Number(audit.extracted_entities?.total_declared_value || 0).toLocaleString()}
- Incoterms:        ${audit.extracted_entities?.incoterms || 'N/A'}
- Transport Mode:   ${audit.extracted_entities?.mode_of_transport || 'N/A'}
- POL / POD:        ${audit.extracted_entities?.port_of_loading || 'N/A'} -> ${audit.extracted_entities?.port_of_discharge || 'N/A'}

2. COMPLIANCE DISCREPANCIES (${audit.compliance_discrepancies?.length || 0}):
${(audit.compliance_discrepancies || []).map((d, i) => `  [${i + 1}] ${d}`).join('\n') || '  None detected. Clean regulatory filing.'}

3. RECOMMENDED ACTIONS (${audit.recommended_actions?.length || 0}):
${(audit.recommended_actions || []).map((a, i) => `  [${i + 1}] ${a}`).join('\n') || '  Proceed with automated release.'}

4. TARIFF & PGA SUMMARY:
- Estimated Duty:   ${audit.duty_tariff_analysis?.estimated_duty_rate || '0.0%'}
- Involved Agencies: ${audit.duty_tariff_analysis?.applicable_agencies?.join(', ') || 'Customs'}

================================================================================
Generated autonomously by OmniScribe AI Studio Logistics Compliance Engine
Model: gemini-3.8-flash | Verified against WTO/WCO Harmonized Standards
================================================================================
`;
      const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(summaryText);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `OmniScribe_Customs_Clearance_${audit.audit_id}.txt`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Customs Clearance Slip Saved', `Clearance certificate saved as OmniScribe_Customs_Clearance_${audit.audit_id}.txt`);
    } catch (e: any) {
      toast.error('Download Failed', 'Could not save customs clearance text slip.');
    }
  };

  // Copy Summary to clipboard
  const handleCopySummary = () => {
    const docNum = audit.extracted_entities?.document_number || audit.document_file_name || 'N/A';
    const brief = `[OmniScribe Audit] Status: ${audit.audit_status} | Risk: ${audit.risk_score}/100 | Ref: ${audit.audit_id} | Dest: ${audit.destination_country} | Doc: ${docNum}`;
    navigator.clipboard.writeText(brief);
    setCopied(true);
    toast.info('Summary Copied to Clipboard', `Reference: ${audit.audit_id} (${audit.audit_status})`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate and download formatted PDF using jspdf
  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      generateAuditPDF(audit);
      toast.success('PDF Report Generated', `Downloaded official report OmniScribe_Audit_Report_${audit.audit_id}.pdf`);
    } catch (err: any) {
      console.error('Failed to generate PDF summary:', err);
      toast.error('PDF Generation Error', 'An unexpected error occurred while compiling the PDF dossier.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Summary Card: Autonomous 3-Sentence Plain-English Executive Compliance Summary powered by Gemini */}
      <QuickSummaryCard audit={audit} />

      {/* Top Banner & Quick Actions */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl relative overflow-hidden">
        {/* Background glow matching status */}
        <div
          className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none ${
            audit.audit_status === 'APPROVED'
              ? 'bg-emerald-500'
              : audit.audit_status === 'FLAGGED'
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Status Badge & Headline */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-sm tracking-wider uppercase font-mono shadow-md ${statusBadgeBg}`}>
                {statusIcon}
                <span>STATUS: {audit.audit_status}</span>
              </span>

              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                REF: {audit.audit_id}
              </span>

              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" />
                {audit.destination_country} ({audit.regulatory_framework.split('/')[0].trim()})
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {statusHeadline}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                {statusSummary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(audit.timestamp).toLocaleDateString()} {new Date(audit.timestamp).toLocaleTimeString()}
              </span>
              <span>•</span>
              <span>Doc No: <strong className="text-slate-200">{audit.extracted_entities?.document_number || audit.document_file_name || 'N/A'}</strong></span>
              <span>•</span>
              <span>Total Value: <strong className="text-emerald-400">${Number(audit.extracted_entities?.total_declared_value || 0).toLocaleString()} {audit.extracted_entities?.currency || 'USD'}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            {/* Formatted Export PDF Button via jspdf */}
            <button
              onClick={handleDownloadPDF}
              type="button"
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
              title="Download official PDF compliance report summarizing all audit findings, risk factors, and remediation requirements"
            >
              <FileDown className="w-4 h-4 text-emerald-100" />
              <span>{isGeneratingPdf ? 'Exporting PDF...' : 'Export PDF'}</span>
            </button>

            {/* Side-by-Side Compare Toggle (Requirement 4) */}
            <button
              onClick={() => setIsSideBySide((prev) => !prev)}
              type="button"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isSideBySide
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50'
              }`}
              title="Toggle split-pane side-by-side comparison with another audit dossier from history"
            >
              <Columns className="w-4 h-4 text-cyan-400" />
              <span>{isSideBySide ? 'Close Side-by-Side' : 'Side-by-Side Compare'}</span>
              {history.length > 1 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/60 text-cyan-300">
                  {history.length}
                </span>
              )}
            </button>

            {/* Officer Discussion & Notes Button */}
            <button
              onClick={() => {
                setIsSideBySide(false);
                setActiveTab('comments');
              }}
              type="button"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                activeTab === 'comments' && !isSideBySide
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 hover:border-indigo-500/50'
              }`}
              title="View and contribute internal compliance officer notes and discussion threads"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Officer Notes</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 shadow-md transition-all cursor-pointer hover:text-white"
              title="Print official customs audit dossier with extracted entities and compliance findings"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print Report</span>
            </button>

            <button
              onClick={handleExportJSON}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Audit JSON</span>
            </button>

            <button
              onClick={handleExportSummary}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 shadow-md transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Customs Clearance Slip</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 transition-colors flex-1 justify-center cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={onReset}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                title="Audit Another Document"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Audit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Split-Pane Side-by-Side Comparison vs Standard Single Dossier View */}
      {isSideBySide ? (
        <SideBySideAuditCompareView
          currentAudit={audit}
          history={history}
          onClose={() => setIsSideBySide(false)}
          onSelectAudit={onSelectAudit}
        />
      ) : (
        <>
          {/* Grid: Risk Meter + AI Certainty Gauge + Duty Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <RiskMeter
            score={audit.risk_score}
            riskLevel={audit.risk_level}
            status={audit.audit_status}
          />
        </div>

        <div className="lg:col-span-1">
          <ConfidenceScoreGauge
            audit={audit}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <DutyTariffCard
            tariffAnalysis={audit.duty_tariff_analysis}
            destinationCountry={audit.destination_country}
          />
        </div>
      </div>

      {/* Trend Visualization: Last 10 Audits via Recharts */}
      <RiskTrendChart
        currentAudit={audit}
        history={history}
        onSelectAudit={onSelectAudit}
      />

      {/* Navigation tabs for detailed breakdown */}
      <div className="flex border-b border-slate-800 text-xs gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          Full Audit Dossier
        </button>
        <button
          onClick={() => setActiveTab('risk_factors')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'risk_factors'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          Risk-Factor Intensity ({audit.extracted_entities?.items?.length || 0} Items)
        </button>
        <button
          onClick={() => setActiveTab('trend')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'trend'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          Risk Velocity & Trend
        </button>
        <button
          onClick={() => setActiveTab('entities')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'entities'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          Extracted Entities ({audit.extracted_entities?.items?.length || 0} Items)
        </button>
        <button
          onClick={() => setActiveTab('discrepancies')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'discrepancies'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Discrepancies ({audit.compliance_discrepancies?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'actions'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Mitigation Action Plan ({audit.recommended_actions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('preemptive')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'preemptive'
              ? 'bg-rose-950/40 text-rose-300 border border-rose-500/50'
              : 'text-slate-400 hover:text-rose-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Preemptive Actions & Incoterms</span>
          {(audit.risk_score >= 50 || audit.risk_level === 'CRITICAL' || audit.audit_status !== 'APPROVED') && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              HIGH RISK
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'comments'
              ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/50 shadow-md shadow-indigo-500/10'
              : 'text-slate-400 hover:text-indigo-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span>Officer Notes & Threads</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Discussion
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Preemptive Actions Card for High-Risk Consignments */}
          {(audit.risk_score >= 50 || audit.risk_level === 'CRITICAL' || audit.audit_status !== 'APPROVED') && (
            <PreemptiveActionsCard audit={audit} />
          )}

          {/* Risk-Factor Visualization with Color-Coded Intensity Scale */}
          <ItemRiskFactorScale
            items={audit.extracted_entities?.items || []}
            auditStatus={audit.audit_status}
            auditRiskScore={audit.risk_score}
            destinationCountry={audit.destination_country}
          />

          <ExtractedEntitiesCard
            entities={audit.extracted_entities}
            auditStatus={audit.audit_status}
            auditRiskScore={audit.risk_score}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DiscrepanciesCard
              discrepancies={audit.compliance_discrepancies}
              discrepancyDetails={audit.discrepancy_details}
            />
            <ActionItemsCard
              actions={audit.recommended_actions}
              actionDetails={audit.action_details}
              destinationCountry={audit.destination_country}
              discrepancies={audit.discrepancy_details}
            />
          </div>

          {/* Compliance Findings Summary & Quick Action Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  Comprehensive Findings Dossier
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {audit.compliance_discrepancies.length} Finding{audit.compliance_discrepancies.length === 1 ? '' : 's'} • {audit.recommended_actions.length} Action{audit.recommended_actions.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official regulatory audit documentation verified against statutory tariff indices for {audit.destination_country}.
              </p>
            </div>

            <button
              onClick={handleDownloadPDF}
              type="button"
              disabled={isGeneratingPdf}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
              title="Download PDF report summary with compliance findings"
            >
              <FileDown className="w-4 h-4 text-emerald-100" />
              <span>{isGeneratingPdf ? 'Exporting PDF...' : 'Export PDF'}</span>
            </button>
          </div>

          {/* Internal Compliance Officer Notes & Discussion Threads */}
          <AuditCommentSection audit={audit} />

          {audit.agent_reasoning_trace && (
            <AgentThoughtTrace traces={audit.agent_reasoning_trace} />
          )}
        </div>
      )}

      {activeTab === 'preemptive' && (
        <div className="space-y-6">
          <PreemptiveActionsCard audit={audit} />
        </div>
      )}

      {activeTab === 'risk_factors' && (
        <div className="space-y-6">
          <ItemRiskFactorScale
            items={audit.extracted_entities?.items || []}
            auditStatus={audit.audit_status}
            auditRiskScore={audit.risk_score}
            destinationCountry={audit.destination_country}
          />
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="space-y-6">
          <RiskTrendChart
            currentAudit={audit}
            history={history}
            onSelectAudit={onSelectAudit}
          />
        </div>
      )}

      {activeTab === 'entities' && (
        <ExtractedEntitiesCard
          entities={audit.extracted_entities}
          auditStatus={audit.audit_status}
          auditRiskScore={audit.risk_score}
        />
      )}

      {activeTab === 'discrepancies' && (
        <DiscrepanciesCard
          discrepancies={audit.compliance_discrepancies}
          discrepancyDetails={audit.discrepancy_details}
        />
      )}

      {activeTab === 'actions' && (
        <ActionItemsCard
          actions={audit.recommended_actions}
          actionDetails={audit.action_details}
          destinationCountry={audit.destination_country}
          discrepancies={audit.discrepancy_details}
        />
      )}

      {activeTab === 'comments' && (
        <div className="space-y-6">
          <AuditCommentSection audit={audit} defaultExpanded={true} />
        </div>
      )}
        </>
      )}
    </div>
  );
};
