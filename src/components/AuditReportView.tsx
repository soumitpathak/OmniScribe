import React, { useState } from 'react';
import { AuditResponse } from '../types/compliance';
import { RiskMeter } from './RiskMeter';
import { RiskTrendChart } from './RiskTrendChart';
import { ExtractedEntitiesCard } from './ExtractedEntitiesCard';
import { DiscrepanciesCard } from './DiscrepanciesCard';
import { ActionItemsCard } from './ActionItemsCard';
import { DutyTariffCard } from './DutyTariffCard';
import { AgentThoughtTrace } from './AgentThoughtTrace';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'entities' | 'discrepancies' | 'actions'>('overview');

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
            {/* Formatted PDF Button via jspdf */}
            <button
              onClick={handleDownloadPDF}
              type="button"
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
              title="Download official formatted customs inspection PDF report"
            >
              <FileDown className="w-4 h-4 text-emerald-100" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Formatted PDF'}</span>
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

      {/* Grid: Risk Meter + Duty Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RiskMeter
            score={audit.risk_score}
            riskLevel={audit.risk_level}
            status={audit.audit_status}
          />
        </div>

        <div className="lg:col-span-2">
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
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          Full Audit Dossier
        </button>
        <button
          onClick={() => setActiveTab('trend')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'actions'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Recommended Actions ({audit.recommended_actions?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <ExtractedEntitiesCard entities={audit.extracted_entities} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DiscrepanciesCard
              discrepancies={audit.compliance_discrepancies}
              discrepancyDetails={audit.discrepancy_details}
            />
            <ActionItemsCard
              actions={audit.recommended_actions}
              actionDetails={audit.action_details}
            />
          </div>
          {audit.agent_reasoning_trace && (
            <AgentThoughtTrace traces={audit.agent_reasoning_trace} />
          )}
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
        <ExtractedEntitiesCard entities={audit.extracted_entities} />
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
        />
      )}
    </div>
  );
};
