import React, { useState } from 'react';
import { AuditResponse } from '../types/compliance';
import { X, Download, FileSpreadsheet, Check, Filter, Layers, Database, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allHistory: AuditResponse[];
  filteredHistory: AuditResponse[];
}

export function escapeCSVCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export const BulkExportModal: React.FC<BulkExportModalProps> = ({
  isOpen,
  onClose,
  allHistory,
  filteredHistory,
}) => {
  const toast = useToast();
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [exportType, setExportType] = useState<'summary' | 'itemized'>('summary');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const dataset = exportScope === 'filtered' ? filteredHistory : allHistory;

  const totalValue = dataset.reduce((sum, item) => {
    return sum + (Number(item.extracted_entities?.total_declared_value) || 0);
  }, 0);

  const approvedCount = dataset.filter((a) => a.audit_status === 'APPROVED').length;
  const flaggedCount = dataset.filter((a) => a.audit_status === 'FLAGGED').length;
  const rejectedCount = dataset.filter((a) => a.audit_status === 'REJECTED').length;

  const handleDownloadCSV = () => {
    if (dataset.length === 0) {
      toast.warning('No Records', 'There are no audit records in the selected scope to export.');
      return;
    }

    setIsExporting(true);

    try {
      let csvContent = '';

      if (exportType === 'summary') {
        // Executive Consignment Summary
        const headers = [
          'Audit Reference ID',
          'Audit Timestamp',
          'Destination Jurisdiction',
          'Regulatory Governing Agency',
          'Audit Verdict / Status',
          'Risk Score (0-100)',
          'Risk Tier',
          'Total Cargo Declared Value',
          'Currency',
          'Shipper / Exporter Name',
          'Shipper Origin Country',
          'Shipper Tax / EORI ID',
          'Consignee / Importer Name',
          'Consignee Destination Country',
          'Consignee Tax / EIN ID',
          'Document Reference Number',
          'Document Type',
          'Transport Mode',
          'Incoterms',
          'Port of Loading (POL)',
          'Port of Discharge (POD)',
          'Classified Items Count',
          'Primary Declared HS Codes',
          'Hazardous Goods / DG Category',
          'Compliance Discrepancies Count',
          'All Compliance Discrepancies',
          'Recommended Actions Count',
          'All Mandatory Actions',
          'Estimated Duty Rate & Tariffs',
          'Special Permits & PGA Requirements',
        ];

        const rows = dataset.map((a) => {
          const entities = a.extracted_entities || ({} as any);
          const items = entities.items || [];
          const hsCodes = items.map((it: any) => it.declared_hs_code).filter(Boolean).join('; ');
          const hazardousClasses = items
            .map((it: any) => it.hazardous_class)
            .filter(Boolean)
            .join('; ') || 'Non-Hazardous';
          const discrepancies = (a.compliance_discrepancies || []).join(' | ');
          const actions = (a.recommended_actions || []).join(' | ');
          const dutyRate = a.duty_tariff_analysis?.estimated_duty_rate || 'N/A';
          const permits = (a.duty_tariff_analysis?.special_permits_required || []).join('; ') || 'None';

          return [
            escapeCSVCell(a.audit_id),
            escapeCSVCell(new Date(a.timestamp).toISOString()),
            escapeCSVCell(a.destination_country),
            escapeCSVCell(a.regulatory_framework),
            escapeCSVCell(a.audit_status),
            a.risk_score ?? 0,
            escapeCSVCell(a.risk_level),
            Number(entities.total_declared_value) || 0,
            escapeCSVCell(entities.currency || 'USD'),
            escapeCSVCell(entities.shipper_name || 'N/A'),
            escapeCSVCell(entities.shipper_country || 'N/A'),
            escapeCSVCell(entities.shipper_tax_id || 'N/A'),
            escapeCSVCell(entities.consignee_name || 'N/A'),
            escapeCSVCell(entities.consignee_country || 'N/A'),
            escapeCSVCell(entities.consignee_tax_id || 'N/A'),
            escapeCSVCell(entities.document_number || 'N/A'),
            escapeCSVCell(entities.document_type || 'Commercial Invoice'),
            escapeCSVCell(entities.mode_of_transport || 'N/A'),
            escapeCSVCell(entities.incoterms || 'FOB'),
            escapeCSVCell(entities.port_of_loading || 'N/A'),
            escapeCSVCell(entities.port_of_discharge || 'N/A'),
            items.length,
            escapeCSVCell(hsCodes),
            escapeCSVCell(hazardousClasses),
            (a.compliance_discrepancies || []).length,
            escapeCSVCell(discrepancies),
            (a.recommended_actions || []).length,
            escapeCSVCell(actions),
            escapeCSVCell(dutyRate),
            escapeCSVCell(permits),
          ];
        });

        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      } else {
        // Detailed Itemized Manifest Ledger
        const headers = [
          'Audit Reference ID',
          'Audit Date',
          'Destination Country',
          'Audit Status',
          'Audit Risk Score',
          'Document Number',
          'Shipper Name',
          'Consignee Name',
          'Line Item Description',
          'Declared HS Code',
          'Verified HS Code',
          'Item Quantity',
          'Unit of Measurement',
          'Unit Value',
          'Total Item Customs Value',
          'Currency',
          'Country of Origin',
          'Hazardous Class / DG Designation',
          'Item Compliance Flags',
        ];

        const rows: string[][] = [];
        dataset.forEach((a) => {
          const entities = a.extracted_entities || ({} as any);
          const items = entities.items || [];
          if (items.length === 0) {
            rows.push([
              escapeCSVCell(a.audit_id),
              escapeCSVCell(new Date(a.timestamp).toISOString().slice(0, 10)),
              escapeCSVCell(a.destination_country),
              escapeCSVCell(a.audit_status),
              String(a.risk_score ?? 0),
              escapeCSVCell(entities.document_number || 'N/A'),
              escapeCSVCell(entities.shipper_name || 'N/A'),
              escapeCSVCell(entities.consignee_name || 'N/A'),
              escapeCSVCell('No line items itemized in manifest'),
              escapeCSVCell('N/A'),
              escapeCSVCell('N/A'),
              '0',
              escapeCSVCell('PCS'),
              '0',
              '0',
              escapeCSVCell(entities.currency || 'USD'),
              escapeCSVCell(entities.shipper_country || 'N/A'),
              escapeCSVCell('Non-Hazardous'),
              escapeCSVCell('None'),
            ]);
          } else {
            items.forEach((it: any) => {
              rows.push([
                escapeCSVCell(a.audit_id),
                escapeCSVCell(new Date(a.timestamp).toISOString().slice(0, 10)),
                escapeCSVCell(a.destination_country),
                escapeCSVCell(a.audit_status),
                String(a.risk_score ?? 0),
                escapeCSVCell(entities.document_number || 'N/A'),
                escapeCSVCell(entities.shipper_name || 'N/A'),
                escapeCSVCell(entities.consignee_name || 'N/A'),
                escapeCSVCell(it.item_description || 'Unspecified Article'),
                escapeCSVCell(it.declared_hs_code || 'N/A'),
                escapeCSVCell(it.verified_hs_code || it.declared_hs_code || 'N/A'),
                String(it.quantity || 0),
                escapeCSVCell(it.unit || 'PCS'),
                String(it.unit_value || 0),
                String(it.total_value || 0),
                escapeCSVCell(entities.currency || 'USD'),
                escapeCSVCell(it.country_of_origin || entities.shipper_country || 'N/A'),
                escapeCSVCell(it.hazardous_class || 'Non-Hazardous'),
                escapeCSVCell((it.compliance_flags || []).join('; ') || 'None'),
              ]);
            });
          }
        });

        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      }

      // Prepend UTF-8 BOM so Excel opens accented & foreign text correctly
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const filename = `OmniScribe_Bulk_Audit_Summary_${exportScope}_${exportType}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        'Bulk CSV Export Ready',
        `Downloaded ${dataset.length} audit records in ${filename}.`
      );
      onClose();
    } catch (err: any) {
      console.error('Bulk CSV Export error:', err);
      toast.error('Export Failed', 'An unexpected error occurred while compiling the CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Bulk Export Audit Records (CSV)
              </h2>
              <p className="text-xs text-slate-400">
                Download formatted CSV summary for external compliance audits, record-keeping, and ERP integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Quick Stats Pill Strip */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center font-mono">
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Audits</span>
              <span className="text-lg font-extrabold text-white">{dataset.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cargo Value</span>
              <span className="text-sm font-extrabold text-emerald-400 truncate block mt-0.5">
                ${totalValue.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pass Rate</span>
              <span className="text-lg font-extrabold text-cyan-400">
                {dataset.length > 0 ? Math.round((approvedCount / dataset.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Export Scope Selector */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block uppercase tracking-wider text-[11px]">
              1. Select Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">All Historical Audits</span>
                  {exportScope === 'all' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Entire audit repository ({allHistory.length} consignments)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                disabled={filteredHistory.length === allHistory.length}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportScope === 'filtered'
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-white shadow-md'
                    : filteredHistory.length === allHistory.length
                    ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Filtered Audits Only</span>
                  {exportScope === 'filtered' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  {filteredHistory.length} record{filteredHistory.length === 1 ? '' : 's'} matching current filters
                </p>
              </button>
            </div>
          </div>

          {/* Dataset Format Selector */}
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block uppercase tracking-wider text-[11px]">
              2. Select Dataset Structure
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportType('summary')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportType === 'summary'
                    ? 'bg-cyan-950/20 border-cyan-500/50 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Consignment Summary CSV</span>
                  {exportType === 'summary' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  One row per shipment with compliance status, risk scores, discrepancies, and duty estimates.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportType('itemized')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  exportType === 'itemized'
                    ? 'bg-cyan-950/20 border-cyan-500/50 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Itemized Manifest Ledger CSV</span>
                  {exportType === 'itemized' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Row-by-row manifest item level breakdown with HS codes, units, declared values, and DG flags.
                </p>
              </button>
            </div>
          </div>

          {/* Included Fields Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Standards & Attributes Included in CSV:
            </span>
            <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Audit ID
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Timestamp
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Jurisdiction
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Status
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Risk Score
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Shipper / Consignee
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                HS Codes
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Dangerous Goods
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Declared Value
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Discrepancies
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Actions
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                PGA Mandates
              </span>
            </div>
            <p className="text-[10px] text-slate-500 pt-1">
              ✓ Encoded with UTF-8 BOM for Microsoft Excel, Google Sheets, LibreOffice, and external ERPs.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs">
          <span className="text-[11px] font-mono text-slate-400">
            {dataset.length} record{dataset.length === 1 ? '' : 's'} queued for export
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={isExporting || dataset.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating CSV...' : 'Download CSV Summary'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
