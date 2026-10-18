import React from 'react';
import { AuditResponse, AuditCategory } from '../types/compliance';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Layers,
  FolderTree,
  ListFilter,
  TrendingDown,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

export interface AuditCategoryStats {
  all: number;
  highRisk: number;
  pendingReview: number;
  customsApproved: number;
  highRiskValue: number;
  pendingValue: number;
  approvedValue: number;
}

interface AuditCategoryFilterWidgetProps {
  history: AuditResponse[];
  activeCategory: AuditCategory;
  onSelectCategory: (category: AuditCategory) => void;
  isGrouped?: boolean;
  onToggleGrouped?: (isGrouped: boolean) => void;
  className?: string;
}

export function classifyAuditCategory(audit: AuditResponse): 'HIGH_RISK' | 'PENDING_REVIEW' | 'CUSTOMS_APPROVED' {
  if (audit.audit_status === 'REJECTED' || audit.risk_score >= 70 || audit.risk_level === 'CRITICAL') {
    return 'HIGH_RISK';
  }
  if (audit.audit_status === 'FLAGGED' || (audit.risk_score >= 30 && audit.risk_score < 70) || audit.risk_level === 'MODERATE') {
    return 'PENDING_REVIEW';
  }
  return 'CUSTOMS_APPROVED';
}

export function computeAuditCategoryStats(history: AuditResponse[]): AuditCategoryStats {
  let highRisk = 0;
  let pendingReview = 0;
  let customsApproved = 0;
  let highRiskValue = 0;
  let pendingValue = 0;
  let approvedValue = 0;

  for (const audit of history) {
    const val = Number(audit.extracted_entities?.total_declared_value) || 0;
    const cat = classifyAuditCategory(audit);
    if (cat === 'HIGH_RISK') {
      highRisk++;
      highRiskValue += val;
    } else if (cat === 'PENDING_REVIEW') {
      pendingReview++;
      pendingValue += val;
    } else {
      customsApproved++;
      approvedValue += val;
    }
  }

  return {
    all: history.length,
    highRisk,
    pendingReview,
    customsApproved,
    highRiskValue,
    pendingValue,
    approvedValue,
  };
}

export const AuditCategoryFilterWidget: React.FC<AuditCategoryFilterWidgetProps> = ({
  history,
  activeCategory,
  onSelectCategory,
  isGrouped = false,
  onToggleGrouped,
  className = '',
}) => {
  const stats = React.useMemo(() => computeAuditCategoryStats(history), [history]);

  const categories = [
    {
      id: 'ALL' as AuditCategory,
      label: 'All Past Audits',
      sublabel: 'Full Archive',
      count: stats.all,
      icon: <Layers className="w-4 h-4 shrink-0 text-slate-400" />,
      activeStyles: 'bg-slate-800 text-white border-slate-600 shadow-md',
      inactiveStyles: 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-800',
      badgeActive: 'bg-slate-700 text-white',
      badgeInactive: 'bg-slate-800 text-slate-400',
      accentColor: 'text-slate-200',
    },
    {
      id: 'HIGH_RISK' as AuditCategory,
      label: 'High Risk',
      sublabel: 'Held & Quarantined',
      count: stats.highRisk,
      icon: <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />,
      activeStyles: 'bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/30',
      inactiveStyles: 'bg-slate-900/60 hover:bg-rose-500/10 text-slate-300 border-slate-800 hover:border-rose-500/30',
      badgeActive: 'bg-rose-500 text-white font-extrabold',
      badgeInactive: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold',
      accentColor: 'text-rose-400',
      value: stats.highRiskValue,
    },
    {
      id: 'PENDING_REVIEW' as AuditCategory,
      label: 'Pending Review',
      sublabel: 'Conditional Holds',
      count: stats.pendingReview,
      icon: <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />,
      activeStyles: 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30',
      inactiveStyles: 'bg-slate-900/60 hover:bg-amber-500/10 text-slate-300 border-slate-800 hover:border-amber-500/30',
      badgeActive: 'bg-amber-500 text-slate-950 font-extrabold',
      badgeInactive: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold',
      accentColor: 'text-amber-400',
      value: stats.pendingValue,
    },
    {
      id: 'CUSTOMS_APPROVED' as AuditCategory,
      label: 'Customs Approved',
      sublabel: 'Green-Channel Release',
      count: stats.customsApproved,
      icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />,
      activeStyles: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30',
      inactiveStyles: 'bg-slate-900/60 hover:bg-emerald-500/10 text-slate-300 border-slate-800 hover:border-emerald-500/30',
      badgeActive: 'bg-emerald-500 text-white font-extrabold',
      badgeInactive: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold',
      accentColor: 'text-emerald-400',
      value: stats.approvedValue,
    },
  ];

  return (
    <div className={`p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-lg space-y-3 ${className}`}>
      {/* Widget Header & Grouping Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ListFilter className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Audit Category Filter</span>
              <span className="text-[10px] font-mono text-slate-400 font-normal">
                ({history.length} Total Audits)
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Filter or group historical records by compliance disposition & regulatory risk
            </p>
          </div>
        </div>

        {onToggleGrouped && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">View Layout:</span>
            <button
              type="button"
              onClick={() => onToggleGrouped(!isGrouped)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer font-mono ${
                isGrouped
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/80'
              }`}
              title="Toggle grouping historical records into collapsible category sections"
            >
              <FolderTree className="w-3 h-3 text-indigo-400" />
              <span>{isGrouped ? 'Grouped by Category' : 'Flat List'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Tabs / Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                isActive ? cat.activeStyles : cat.inactiveStyles
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  {cat.icon}
                  <span className="text-xs font-bold truncate">{cat.label}</span>
                </div>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                    isActive ? cat.badgeActive : cat.badgeInactive
                  }`}
                >
                  {cat.count}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 w-full pt-1 border-t border-slate-800/50">
                <span className="truncate">{cat.sublabel}</span>
                {cat.value !== undefined && cat.value > 0 && (
                  <span className="font-mono text-[9px] text-slate-300 shrink-0">
                    ${(cat.value / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Filter Helper Strip */}
      {activeCategory !== 'ALL' && (
        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">Active Category:</span>
            <strong className="text-white uppercase">
              {activeCategory === 'HIGH_RISK'
                ? 'High Risk (Score ≥ 70 / Quarantine)'
                : activeCategory === 'PENDING_REVIEW'
                ? 'Pending Review (Score 30-69 / Discrepancies)'
                : 'Customs Approved (Score < 30 / Green-Channel)'}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => onSelectCategory('ALL')}
            className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
          >
            Show All ({stats.all})
          </button>
        </div>
      )}
    </div>
  );
};
