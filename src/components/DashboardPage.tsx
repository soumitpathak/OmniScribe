import React, { useState, useMemo } from 'react';
import { AuditResponse, AuditStatus } from '../types/compliance';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Building,
  Plane,
  Ship,
  ExternalLink,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface DashboardPageProps {
  history: AuditResponse[];
  onSelectAudit: (audit: AuditResponse) => void;
  onNavigateToInitiate: () => void;
  onClearHistory: () => void;
  onResetSeedData: () => void;
  onDeleteAuditItem: (auditId: string) => void;
}

type SortField = 'timestamp' | 'risk_score' | 'total_value' | 'audit_id' | 'destination_country';
type SortOrder = 'asc' | 'desc';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  history,
  onSelectAudit,
  onNavigateToInitiate,
  onClearHistory,
  onResetSeedData,
  onDeleteAuditItem,
}) => {
  const toast = useToast();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedRiskRange, setSelectedRiskRange] = useState<string>('ALL'); // 'ALL' | 'LOW' | 'MODERATE' | 'CRITICAL'
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // KPI Calculations
  const stats = useMemo(() => {
    const total = history.length;
    const approved = history.filter((a) => a.audit_status === 'APPROVED').length;
    const flagged = history.filter((a) => a.audit_status === 'FLAGGED').length;
    const rejected = history.filter((a) => a.audit_status === 'REJECTED').length;

    const totalValue = history.reduce((sum, item) => {
      const val = Number(item.extracted_entities?.total_declared_value) || 0;
      return sum + val;
    }, 0);

    const avgRisk = total > 0 ? Math.round(history.reduce((sum, item) => sum + (item.risk_score || 0), 0) / total) : 0;
    const passRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { total, approved, flagged, rejected, totalValue, avgRisk, passRate };
  }, [history]);

  // Unique countries available in history
  const availableCountries = useMemo(() => {
    const set = new Set(history.map((a) => a.destination_country).filter(Boolean));
    return Array.from(set).sort();
  }, [history]);

  // Filter & Search Logic
  const filteredAndSortedHistory = useMemo(() => {
    return history
      .filter((item) => {
        // Status filter
        if (selectedStatus !== 'ALL' && item.audit_status !== selectedStatus) {
          return false;
        }

        // Country filter
        if (selectedCountry !== 'ALL' && item.destination_country !== selectedCountry) {
          return false;
        }

        // Risk Level filter
        if (selectedRiskRange !== 'ALL') {
          if (selectedRiskRange === 'LOW' && item.risk_score >= 30) return false;
          if (selectedRiskRange === 'MODERATE' && (item.risk_score < 30 || item.risk_score >= 70)) return false;
          if (selectedRiskRange === 'CRITICAL' && item.risk_score < 70) return false;
        }

        // Search Query (ID, Shipper, Consignee, Items, Reference, Regulations)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = item.audit_id?.toLowerCase().includes(q);
          const matchShipper = item.extracted_entities?.shipper_name?.toLowerCase().includes(q);
          const matchConsignee = item.extracted_entities?.consignee_name?.toLowerCase().includes(q);
          const matchDocNum = item.extracted_entities?.document_number?.toLowerCase().includes(q);
          const matchDocType = item.extracted_entities?.document_type?.toLowerCase().includes(q);
          const matchFileName = item.document_file_name?.toLowerCase().includes(q);
          const matchCountry = item.destination_country?.toLowerCase().includes(q);
          const matchFramework = item.regulatory_framework?.toLowerCase().includes(q);

          const matchItems = item.extracted_entities?.items?.some(
            (it) =>
              it.item_description?.toLowerCase().includes(q) ||
              it.declared_hs_code?.toLowerCase().includes(q) ||
              it.verified_hs_code?.toLowerCase().includes(q)
          );

          const matchDiscrepancies = item.compliance_discrepancies?.some((d) => d.toLowerCase().includes(q));

          return (
            matchId ||
            matchShipper ||
            matchConsignee ||
            matchDocNum ||
            matchDocType ||
            matchFileName ||
            matchCountry ||
            matchFramework ||
            matchItems ||
            matchDiscrepancies
          );
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'timestamp') {
          comp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        } else if (sortField === 'risk_score') {
          comp = a.risk_score - b.risk_score;
        } else if (sortField === 'total_value') {
          const valA = Number(a.extracted_entities?.total_declared_value) || 0;
          const valB = Number(b.extracted_entities?.total_declared_value) || 0;
          comp = valA - valB;
        } else if (sortField === 'audit_id') {
          comp = a.audit_id.localeCompare(b.audit_id);
        } else if (sortField === 'destination_country') {
          comp = a.destination_country.localeCompare(b.destination_country);
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [history, selectedStatus, selectedCountry, selectedRiskRange, searchQuery, sortField, sortOrder]);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    try {
      if (filteredAndSortedHistory.length === 0) {
        toast.info('No Data to Export', 'There are no audit records matching the current view.');
        return;
      }

      const headers = [
        'Audit ID',
        'Date',
        'Status',
        'Risk Score',
        'Destination',
        'Regulatory Framework',
        'Document Number',
        'Shipper Name',
        'Consignee Name',
        'Declared Value',
        'Currency',
        'Discrepancies Count',
      ];

      const rows = filteredAndSortedHistory.map((a) => [
        `"${a.audit_id}"`,
        `"${new Date(a.timestamp).toISOString()}"`,
        `"${a.audit_status}"`,
        a.risk_score,
        `"${a.destination_country}"`,
        `"${a.regulatory_framework.replace(/"/g, '""')}"`,
        `"${a.extracted_entities?.document_number || ''}"`,
        `"${(a.extracted_entities?.shipper_name || '').replace(/"/g, '""')}"`,
        `"${(a.extracted_entities?.consignee_name || '').replace(/"/g, '""')}"`,
        a.extracted_entities?.total_declared_value || 0,
        `"${a.extracted_entities?.currency || 'USD'}"`,
        a.compliance_discrepancies?.length || 0,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `OmniScribe_Audit_History_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('CSV Report Exported', `${filteredAndSortedHistory.length} audit records exported successfully.`);
    } catch (e: any) {
      toast.error('Export Error', 'Failed to generate CSV export.');
    }
  };

  const hasActiveFilters = searchQuery !== '' || selectedStatus !== 'ALL' || selectedCountry !== 'ALL' || selectedRiskRange !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedCountry('ALL');
    setSelectedRiskRange('ALL');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Dashboard Header & Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Continuous Regulatory Inspection & Audit Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Compliance Audit Dashboard
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Monitor, cross-reference, and search historical audit records across global customs jurisdictions. Inspect flagged tariff codes, hazard declarations, and regulatory clearance certificates.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center gap-3">
          <button
            onClick={onNavigateToInitiate}
            type="button"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 cursor-pointer transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate New Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Audits */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Total Audits</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Passed:</span>
            <strong className="text-emerald-400 font-mono">{stats.passRate}%</strong>
          </div>
        </div>

        {/* Cleared / Approved */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 bg-emerald-950/10 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-mono mb-2">
            <span>Cleared / Green</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {stats.approved}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Fast-track customs release
          </div>
        </div>

        {/* Flagged for Review */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 bg-amber-950/10 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs font-mono mb-2">
            <span>Flagged for Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            {stats.flagged}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Action items pending
          </div>
        </div>

        {/* Rejected */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-rose-500/30 bg-rose-950/10 shadow-md">
          <div className="flex items-center justify-between text-rose-400 text-xs font-mono mb-2">
            <span>Rejected / Holds</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
            {stats.rejected}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Quarantine intervention
          </div>
        </div>

        {/* Total Cargo Value */}
        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-cyan-400 text-xs font-mono mb-2">
            <span>Audited Cargo Value</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono truncate">
            ${stats.totalValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span>Avg Risk:</span>
            <span className={`font-bold ${stats.avgRisk > 60 ? 'text-rose-400' : stats.avgRisk > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {stats.avgRisk}/100
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card with Search & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Control Toolbar */}
        <div className="p-5 border-b border-slate-800 space-y-4 bg-slate-900/95">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Audit ID, shipper, consignee, document #, HS code, cargo description..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick action tools */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
              <button
                onClick={handleExportCSV}
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                title="Export current table to CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={onResetSeedData}
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                title="Reset sample enterprise records"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Load Sample Records</span>
              </button>

              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-medium text-slate-400 transition-colors cursor-pointer"
                  title="Clear all local audit history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills & Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] font-mono mr-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Filters:</span>
              </span>

              {/* Status Filter */}
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px] font-mono">
                {(['ALL', 'APPROVED', 'FLAGGED', 'REJECTED'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      selectedStatus === status
                        ? status === 'APPROVED'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : status === 'FLAGGED'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : status === 'REJECTED'
                          ? 'bg-rose-500 text-white font-bold'
                          : 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {status === 'ALL' ? 'All Status' : status}
                  </button>
                ))}
              </div>

              {/* Jurisdiction Country Selector */}
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Jurisdictions ({availableCountries.length})</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Risk Level Selector */}
              <select
                value={selectedRiskRange}
                onChange={(e) => setSelectedRiskRange(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Risk Scores</option>
                <option value="LOW">Low Risk (&lt;30)</option>
                <option value="MODERATE">Moderate Risk (30-69)</option>
                <option value="CRITICAL">Critical Risk (70-100)</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Match Counter */}
            <div className="text-[11px] text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredAndSortedHistory.length}</strong> of{' '}
              <span className="text-slate-500">{history.length} audits</span>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          {filteredAndSortedHistory.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-bold text-white">No Matching Audit Records</h3>
                <p className="text-xs text-slate-400">
                  {hasActiveFilters
                    ? 'No audits matched your current search filters. Try clearing your search or resetting filters.'
                    : 'No compliance records saved yet. Initiate an automated regulatory audit or load sample records.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                {hasActiveFilters ? (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onResetSeedData}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 cursor-pointer"
                    >
                      Load Sample Records
                    </button>
                    <button
                      onClick={onNavigateToInitiate}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow cursor-pointer"
                    >
                      Initiate Audit Now
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('risk_score')}
                      className="flex items-center gap-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Status / Risk</span>
                      {sortField === 'risk_score' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </button>
                  </th>

                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('audit_id')}
                      className="flex items-center gap-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Audit ID / Ref</span>
                      {sortField === 'audit_id' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </button>
                  </th>

                  <th className="py-3.5 px-4">Shipper → Consignee (Route)</th>

                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('destination_country')}
                      className="flex items-center gap-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Jurisdiction</span>
                      {sortField === 'destination_country' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </button>
                  </th>

                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('total_value')}
                      className="flex items-center gap-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Declared Value</span>
                      {sortField === 'total_value' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </button>
                  </th>

                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('timestamp')}
                      className="flex items-center gap-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Timestamp</span>
                      {sortField === 'timestamp' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </button>
                  </th>

                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredAndSortedHistory.map((item) => {
                  const isExpanded = expandedAuditId === item.audit_id;

                  // Status styling
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      CLEARED ({item.risk_score})
                    </span>
                  );

                  if (item.audit_status === 'REJECTED') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <ShieldAlert className="w-3 h-3" />
                        REJECTED ({item.risk_score})
                      </span>
                    );
                  } else if (item.audit_status === 'FLAGGED') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        FLAGGED ({item.risk_score})
                      </span>
                    );
                  }

                  const declaredVal = Number(item.extracted_entities?.total_declared_value) || 0;
                  const currency = item.extracted_entities?.currency || 'USD';
                  const discrepancyCount = item.compliance_discrepancies?.length || 0;

                  return (
                    <React.Fragment key={item.audit_id}>
                      <tr
                        className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${
                          isExpanded ? 'bg-slate-800/30' : ''
                        }`}
                        onClick={() => setExpandedAuditId(isExpanded ? null : item.audit_id)}
                      >
                        {/* Status / Risk */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {statusBadge}
                            <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.risk_score >= 70
                                    ? 'bg-rose-500'
                                    : item.risk_score >= 30
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, item.risk_score))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Audit ID / Reference */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-white flex items-center gap-1.5">
                            <span>{item.audit_id}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px] font-mono">
                            {item.extracted_entities?.document_number || item.document_file_name || 'Manifest'}
                          </div>
                        </td>

                        {/* Route / Entities */}
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="text-slate-200 font-medium truncate max-w-xs">
                            {item.extracted_entities?.shipper_name || 'Shipper'}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-xs mt-0.5">
                            <span className="text-slate-500">→</span>
                            <span className="truncate">{item.extracted_entities?.consignee_name || 'Consignee'}</span>
                          </div>
                          {(item.extracted_entities?.port_of_loading || item.extracted_entities?.port_of_discharge) && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                              {item.extracted_entities.port_of_loading?.split('(')[0]} → {item.extracted_entities.port_of_discharge?.split('(')[0]}
                            </div>
                          )}
                        </td>

                        {/* Jurisdiction */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono font-semibold text-slate-300">
                            {item.destination_country === 'USA' ? '🇺🇸 USA' :
                             item.destination_country === 'EU' ? '🇪🇺 European Union' :
                             item.destination_country === 'Singapore' ? '🇸🇬 Singapore' :
                             item.destination_country === 'UAE' ? '🇦🇪 UAE' :
                             item.destination_country === 'UK' ? '🇬🇧 United Kingdom' :
                             item.destination_country === 'Japan' ? '🇯🇵 Japan' :
                             item.destination_country === 'Australia' ? '🇦🇺 Australia' : item.destination_country}
                          </span>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px] mt-1 font-mono">
                            {item.regulatory_framework?.split('&')[0]}
                          </div>
                        </td>

                        {/* Declared Value */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          <div className="font-bold text-white text-xs">
                            ${declaredVal.toLocaleString()} {currency}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.extracted_entities?.items?.length || 1} line item{(item.extracted_entities?.items?.length || 1) > 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                          <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectAudit(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold font-mono flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              title="Open Full Audit Dossier"
                            >
                              <span>Dossier</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedAuditId(isExpanded ? null : item.audit_id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse Quick Details' : 'Expand Quick Details'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteAuditItem(item.audit_id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Quick Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-slate-800">
                          <td colSpan={7} className="p-5">
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-white">
                                    Quick Audit Inspection: {item.audit_id}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    ({item.extracted_entities?.document_type || 'Customs Ingestion'})
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onSelectAudit(item)}
                                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                  >
                                    <span>Open Full Interactive Dossier</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Column 1: Items & Harmonized Codes */}
                                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                  <div className="text-[11px] font-mono text-slate-400 font-bold uppercase flex items-center justify-between">
                                    <span>Cargo Line Items</span>
                                    <span className="text-emerald-400">{item.extracted_entities?.items?.length || 0}</span>
                                  </div>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {item.extracted_entities?.items?.map((it, idx) => (
                                      <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                                        <p className="font-semibold text-white truncate">{it.item_description}</p>
                                        <div className="flex items-center justify-between text-[11px] font-mono">
                                          <span className="text-amber-400">HS: {it.declared_hs_code}</span>
                                          <span className="text-slate-400">Qty: {it.quantity} {it.unit}</span>
                                        </div>
                                        {it.hazardous_class && (
                                          <span className="inline-block text-[10px] text-amber-300 font-mono">
                                            ⚠️ {it.hazardous_class}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Column 2: Regulatory Discrepancies */}
                                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                  <div className="text-[11px] font-mono text-slate-400 font-bold uppercase flex items-center justify-between">
                                    <span>Identified Discrepancies</span>
                                    <span className={discrepancyCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                      {discrepancyCount}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {discrepancyCount === 0 ? (
                                      <p className="text-slate-500 italic py-2">No regulatory discrepancies identified. Complete statutory compliance.</p>
                                    ) : (
                                      item.compliance_discrepancies.map((d, dIdx) => (
                                        <div key={dIdx} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                                          • {d}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Column 3: Duty, Actions & Framework */}
                                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                                  <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                                    Tariff & Regulatory Summary
                                  </div>
                                  <div className="space-y-1.5 text-[11px]">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Framework:</span>
                                      <span className="text-slate-200 font-mono truncate max-w-[160px]">{item.regulatory_framework}</span>
                                    </div>
                                    {item.duty_tariff_analysis && (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Est. Duty Rate:</span>
                                          <span className="text-amber-400 font-mono">{item.duty_tariff_analysis.estimated_duty_rate}</span>
                                        </div>
                                        {item.duty_tariff_analysis.estimated_duty_amount !== undefined && (
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Est. Duty Deposit:</span>
                                            <span className="text-white font-mono font-bold">${item.duty_tariff_analysis.estimated_duty_amount.toLocaleString()}</span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Actions Mandated:</span>
                                      <span className="text-white font-mono font-bold">{item.recommended_actions?.length || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
