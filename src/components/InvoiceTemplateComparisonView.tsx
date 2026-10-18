import React, { useState, useMemo } from 'react';
import { AuditResponse } from '../types/compliance';
import {
  compareInvoiceToDestinationTemplate,
  FieldComparison,
  LineItemDiff,
  DiffStatus,
} from '../utils/standardizedInvoiceTemplates';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Download,
  Copy,
  Check,
  Filter,
  Columns,
  List,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface InvoiceTemplateComparisonViewProps {
  audit: AuditResponse;
}

export const InvoiceTemplateComparisonView: React.FC<InvoiceTemplateComparisonViewProps> = ({ audit }) => {
  const toast = useToast();
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DISCREPANCIES' | 'MISSING'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copied, setCopied] = useState<boolean>(false);

  // Compute comparison against standardized destination template
  const comparison = useMemo(() => {
    return compareInvoiceToDestinationTemplate(audit);
  }, [audit]);

  // Filtered field comparisons
  const filteredFields = useMemo(() => {
    return comparison.fieldComparisons.filter((item) => {
      // Status filter
      if (statusFilter === 'DISCREPANCIES') {
        if (item.diffStatus !== 'DISCREPANCY' && item.diffStatus !== 'MODIFIED') return false;
      } else if (statusFilter === 'MISSING') {
        if (item.diffStatus !== 'MISSING') return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [comparison, statusFilter, categoryFilter]);

  // Filtered line items
  const filteredLineItems = useMemo(() => {
    if (statusFilter === 'ALL') return comparison.lineItemDiffs;
    if (statusFilter === 'DISCREPANCIES') {
      return comparison.lineItemDiffs.filter(
        (i) => i.hsCodeStatus !== 'MATCH' || i.hazardStatus !== 'MATCH' || i.descriptionStatus !== 'MATCH'
      );
    }
    if (statusFilter === 'MISSING') {
      return comparison.lineItemDiffs.filter(
        (i) => i.hsCodeStatus === 'MISSING' || i.originStatus === 'MISSING' || i.hazardStatus === 'DISCREPANCY'
      );
    }
    return comparison.lineItemDiffs;
  }, [comparison, statusFilter]);

  // Copy standardized payload to clipboard
  const handleCopyStandardized = () => {
    try {
      const formatted = JSON.stringify(comparison.standardizedExportPayload, null, 2);
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      toast.info('Standardized Template Copied', 'Standardized customs data copied to clipboard in JSON format.');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error('Copy Failed', 'Could not copy standardized template.');
    }
  };

  // Download standardized template as JSON
  const handleDownloadJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
        JSON.stringify(comparison.standardizedExportPayload, null, 2)
      );
      const anchor = document.createElement('a');
      anchor.setAttribute('href', dataStr);
      anchor.setAttribute('download', `Standardized_Invoice_${audit.destination_country}_${audit.audit_id}.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      toast.success(
        'Standardized Template Downloaded',
        `Exported standardized template conforming to ${comparison.templateStandardName}`
      );
    } catch (e) {
      toast.error('Download Failed', 'Could not export standardized invoice JSON.');
    }
  };

  const renderStatusBadge = (status: DiffStatus) => {
    switch (status) {
      case 'MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            MATCH
          </span>
        );
      case 'MODIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            FORMAT RECTIFICATION
          </span>
        );
      case 'DISCREPANCY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3" />
            DISCREPANCY
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3 h-3" />
            MISSING REQUIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Standard Header & Conformity Score Meter */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Destination Template Side-by-Side
              </span>
              <span className="text-xs font-mono text-slate-400">
                Destination: <strong className="text-white">{comparison.destinationCountry}</strong>
              </span>
              <span className="text-xs font-mono text-slate-500">•</span>
              <span className="text-xs font-mono text-cyan-400">{comparison.regulatoryAuthority}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>Standardized Customs Template Comparison</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Side-by-side analysis contrasting the uploaded commercial invoice against the statutory standardized entry template required by{' '}
              <strong className="text-white">{comparison.regulatoryAuthority}</strong> under{' '}
              <span className="text-cyan-300 font-mono text-xs">{comparison.statutoryFramework}</span>.
            </p>

            {/* Quick KPI Counters */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                <span className="text-slate-400">Total Checked:</span>
                <span className="text-white font-bold">{comparison.totalAttributesChecked}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2">
                <span className="text-emerald-400">Exact Matches:</span>
                <span className="text-emerald-300 font-bold">{comparison.matchCount}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-2">
                <span className="text-amber-400">Format Rectifications:</span>
                <span className="text-amber-300 font-bold">{comparison.discrepancyCount}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-2">
                <span className="text-rose-400">Missing Mandatory:</span>
                <span className="text-rose-300 font-bold">{comparison.missingCount}</span>
              </div>
            </div>
          </div>

          {/* Conformity Meter & Export Actions */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shrink-0 flex flex-col items-center justify-center text-center space-y-3 min-w-[240px]">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Template Conformity Index
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-4xl font-black font-mono tracking-tight ${
                  comparison.overallConformityScore >= 80
                    ? 'text-emerald-400'
                    : comparison.overallConformityScore >= 50
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {comparison.overallConformityScore}%
              </span>
              <span className="text-xs font-mono text-slate-500">/ 100%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  comparison.overallConformityScore >= 80
                    ? 'bg-emerald-500'
                    : comparison.overallConformityScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${comparison.overallConformityScore}%` }}
              />
            </div>

            <div className="pt-1 flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                title="Download Standardized Invoice (JSON)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={handleCopyStandardized}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
                title="Copy Standardized JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Attributes ({comparison.fieldComparisons.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('DISCREPANCIES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'DISCREPANCIES'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Deviations ({comparison.discrepancyCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('MISSING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'MISSING'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Missing Mandatory ({comparison.missingCount})</span>
          </button>
        </div>

        {/* View Mode Toggle: Side-by-Side vs Unified */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'split'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('unified')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'unified'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Unified Table</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: 'All Categories' },
          { key: 'document', label: 'Document ID' },
          { key: 'parties', label: 'Shipper & Consignee' },
          { key: 'logistics', label: 'Logistics & Ports' },
          { key: 'valuation', label: 'Valuation & Terms' },
          { key: 'compliance_annexes', label: 'Mandatory Annexes' },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 cursor-pointer ${
              categoryFilter === cat.key
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Side-by-Side Dual-Pane or Unified View */}
      {viewMode === 'split' ? (
        <div className="space-y-4">
          {/* Column Titles Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Uploaded Invoice Data
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({audit.extracted_entities?.document_type || 'User Ingestion'})
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Raw Extracted Fields</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Standardized Statutory Template
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  ({comparison.destinationCountry})
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{comparison.templateStandardName}</span>
            </div>
          </div>

          {/* Field-by-Field Cards */}
          <div className="space-y-3">
            {filteredFields.map((field) => (
              <div
                key={field.fieldKey}
                className={`rounded-2xl border transition-all p-4 ${
                  field.diffStatus === 'MISSING'
                    ? 'bg-rose-950/15 border-rose-500/30'
                    : field.diffStatus === 'DISCREPANCY'
                    ? 'bg-amber-950/15 border-amber-500/30'
                    : field.diffStatus === 'MODIFIED'
                    ? 'bg-amber-950/10 border-amber-500/25'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                {/* Field Top Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{field.fieldName}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {field.category.replace('_', ' ')}
                    </span>
                    {field.mandatory && (
                      <span className="text-[10px] font-mono font-bold text-rose-400 px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                        MANDATORY
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStatusBadge(field.diffStatus)}
                  </div>
                </div>

                {/* Side-by-Side Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Uploaded Value */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        Uploaded Document Value
                      </span>
                      {field.uploadedValue ? (
                        <div
                          className={`font-mono text-xs break-words font-semibold ${
                            field.diffStatus === 'DISCREPANCY'
                              ? 'text-amber-300'
                              : field.diffStatus === 'MISSING'
                              ? 'text-rose-400 line-through'
                              : 'text-slate-200'
                          }`}
                        >
                          {String(field.uploadedValue)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>[Field Missing / Omitted on Invoice]</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Standard Expected Value */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Expected Statutory Requirement
                      </span>
                      <div className="font-mono text-xs font-semibold text-emerald-300 break-words">
                        {String(field.standardValue)}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-slate-400 truncate max-w-[280px]" title={field.statutoryRegulationRef}>
                        Ref: {field.statutoryRegulationRef}
                      </span>
                      {field.fixRecommendation && (
                        <span className="text-amber-400 font-bold shrink-0">Action Needed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explanation note if discrepancy or missing */}
                {field.diffStatus !== 'MATCH' && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-slate-300 block">{field.explanation}</span>
                      {field.fixRecommendation && (
                        <span className="text-amber-300 font-mono text-[11px] block">
                          Recommendation: {field.fixRecommendation}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Unified Table View */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="p-3.5">Attribute Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Uploaded Value</th>
                <th className="p-3.5">Standard Expected ({comparison.destinationCountry})</th>
                <th className="p-3.5">Conformity Status</th>
                <th className="p-3.5">Regulation Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredFields.map((field) => (
                <tr
                  key={field.fieldKey}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    field.diffStatus === 'MISSING'
                      ? 'bg-rose-950/10'
                      : field.diffStatus === 'DISCREPANCY'
                      ? 'bg-amber-950/10'
                      : ''
                  }`}
                >
                  <td className="p-3.5 font-bold text-white font-sans">
                    {field.fieldName}
                    {field.mandatory && (
                      <span className="ml-1.5 text-[9px] text-rose-400 font-bold">*</span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-400 capitalize">{field.category}</td>
                  <td className="p-3.5">
                    {field.uploadedValue ? (
                      <span
                        className={
                          field.diffStatus === 'DISCREPANCY'
                            ? 'text-amber-300 font-bold'
                            : field.diffStatus === 'MISSING'
                            ? 'text-rose-400 line-through'
                            : 'text-slate-200'
                        }
                      >
                        {String(field.uploadedValue)}
                      </span>
                    ) : (
                      <span className="text-rose-400 italic">[Missing]</span>
                    )}
                  </td>
                  <td className="p-3.5 text-emerald-300 font-semibold">{String(field.standardValue)}</td>
                  <td className="p-3.5">{renderStatusBadge(field.diffStatus)}</td>
                  <td className="p-3.5 text-slate-400 text-[10px] max-w-[200px] truncate" title={field.statutoryRegulationRef}>
                    {field.statutoryRegulationRef}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- LINE ITEMS COMPARISON SECTION --- */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Line-Item Commodity Level Comparison ({comparison.lineItemDiffs.length} Items)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Side-by-side tariff code precision, dangerous goods classifications, and required country marking per item.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
            Mandate: <strong className="text-emerald-400">{comparison.templateStandardName.split('&')[0]}</strong>
          </span>
        </div>

        <div className="space-y-4">
          {filteredLineItems.map((item) => (
            <div
              key={item.itemIndex}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
            >
              {/* Item Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Line Item #{item.itemIndex}
                  </span>
                  <span className="text-sm font-bold text-white">{item.rawDescription}</span>
                </div>

                <div className="flex items-center gap-2">
                  {renderStatusBadge(item.hsCodeStatus)}
                </div>
              </div>

              {/* Side-by-Side Line Item Attributes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Uploaded Line Item */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Uploaded Item Specifications
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Declared HS Code</span>
                      <span
                        className={`font-mono font-bold ${
                          item.hsCodeStatus !== 'MATCH' ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {item.uploadedHsCode}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Quantity & Unit</span>
                      <span className="font-mono text-slate-200">{item.uploadedQuantity}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Declared Total Value</span>
                      <span className="font-mono text-slate-200">{item.uploadedValue}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Origin Marking</span>
                      <span className="font-mono text-slate-200">{item.uploadedOrigin}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-slate-400 text-[10px] block">Hazardous Designation</span>
                    <span className="font-mono text-xs text-slate-300">{item.uploadedHazard}</span>
                  </div>
                </div>

                {/* Right: Standardized Expected Line Item */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-3">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Standardized Entry Specifications ({comparison.destinationCountry})
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Statutory HS Classification</span>
                      <span className="font-mono font-bold text-emerald-300">{item.standardHsCode}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Statutory Unit of Measure</span>
                      <span className="font-mono text-emerald-300">{item.standardQuantity}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Dutiable Valuation Basis</span>
                      <span className="font-mono text-emerald-300">{item.standardValue}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Origin Verification</span>
                      <span className="font-mono text-emerald-300">{item.standardOrigin}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-slate-400 text-[10px] block">Mandated Safety & PGA Certification</span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        item.hazardStatus !== 'MATCH' ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      {item.standardHazardRequirement}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line item discrepancy callout */}
              {item.hsCodeStatus !== 'MATCH' && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-amber-200 font-mono">{item.hsCodeDetail}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Standardized Entry Summary Export Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Export Rectified Standardized Template</h4>
          </div>
          <p className="text-xs text-slate-400">
            Export the standardized declaration file formatted for automated submission to{' '}
            <strong className="text-slate-200">{comparison.regulatoryAuthority}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyStandardized}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Normalized Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
