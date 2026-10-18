import React, { useState, useMemo } from 'react';
import { AuditResponse } from '../types/compliance';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  BarChart2,
  Eye,
  Layers,
} from 'lucide-react';

interface AuditRiskFrequencyTrendChartProps {
  history: AuditResponse[];
  onSelectAudit?: (audit: AuditResponse) => void;
}

type TimeframeMode = 'daily' | 'weekly' | 'monthly';

export const AuditRiskFrequencyTrendChart: React.FC<AuditRiskFrequencyTrendChartProps> = ({
  history,
  onSelectAudit,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeMode>('daily');
  const [visibleLines, setVisibleLines] = useState<{
    low: boolean;
    moderate: boolean;
    critical: boolean;
    total: boolean;
  }>({
    low: true,
    moderate: true,
    critical: true,
    total: false,
  });

  const toggleLine = (key: 'low' | 'moderate' | 'critical' | 'total') => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Aggregate audit risk frequencies across time intervals
  const frequencyData = useMemo(() => {
    const now = new Date();

    if (timeframe === 'daily') {
      // Last 14 days
      const daysMap = new Map<string, { date: string; displayDate: string; low: number; moderate: number; critical: number; total: number }>();

      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const isoDate = d.toISOString().slice(0, 10);
        const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        daysMap.set(isoDate, {
          date: isoDate,
          displayDate,
          low: 0,
          moderate: 0,
          critical: 0,
          total: 0,
        });
      }

      history.forEach((audit) => {
        const auditDate = audit.timestamp.slice(0, 10);
        if (daysMap.has(auditDate)) {
          const entry = daysMap.get(auditDate)!;
          entry.total += 1;
          if (audit.risk_level === 'CRITICAL' || audit.risk_score >= 70 || audit.audit_status === 'REJECTED') {
            entry.critical += 1;
          } else if (audit.risk_level === 'MODERATE' || (audit.risk_score >= 30 && audit.risk_score < 70) || audit.audit_status === 'FLAGGED') {
            entry.moderate += 1;
          } else {
            entry.low += 1;
          }
        }
      });

      return Array.from(daysMap.values());
    }

    if (timeframe === 'weekly') {
      // Last 12 weeks
      const weeks: { date: string; displayDate: string; low: number; moderate: number; critical: number; total: number }[] = [];

      for (let w = 11; w >= 0; w--) {
        const weekStart = new Date(now.getTime() - (w * 7 + 6) * 86400000);
        const weekEnd = new Date(now.getTime() - w * 7 * 86400000);
        const displayDate = `W${12 - w} (${weekStart.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })})`;

        let low = 0;
        let moderate = 0;
        let critical = 0;
        let total = 0;

        history.forEach((audit) => {
          const auditTime = new Date(audit.timestamp).getTime();
          if (auditTime >= weekStart.getTime() && auditTime <= weekEnd.getTime() + 86400000) {
            total += 1;
            if (audit.risk_level === 'CRITICAL' || audit.risk_score >= 70 || audit.audit_status === 'REJECTED') {
              critical += 1;
            } else if (audit.risk_level === 'MODERATE' || (audit.risk_score >= 30 && audit.risk_score < 70) || audit.audit_status === 'FLAGGED') {
              moderate += 1;
            } else {
              low += 1;
            }
          }
        });

        weeks.push({
          date: `Week ${12 - w}`,
          displayDate,
          low,
          moderate,
          critical,
          total,
        });
      }

      return weeks;
    }

    // Monthly view: Last 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months: { date: string; displayDate: string; low: number; moderate: number; critical: number; total: number; year: number; monthIdx: number }[] = [];

    for (let m = 11; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const displayDate = `${monthNames[monthIdx]} '${String(year).slice(-2)}`;

      months.push({
        date: `${year}-${monthIdx}`,
        displayDate,
        low: 0,
        moderate: 0,
        critical: 0,
        total: 0,
        year,
        monthIdx,
      });
    }

    history.forEach((audit) => {
      const ad = new Date(audit.timestamp);
      const target = months.find((m) => m.year === ad.getFullYear() && m.monthIdx === ad.getMonth());
      if (target) {
        target.total += 1;
        if (audit.risk_level === 'CRITICAL' || audit.risk_score >= 70 || audit.audit_status === 'REJECTED') {
          target.critical += 1;
        } else if (audit.risk_level === 'MODERATE' || (audit.risk_score >= 30 && audit.risk_score < 70) || audit.audit_status === 'FLAGGED') {
          target.moderate += 1;
        } else {
          target.low += 1;
        }
      }
    });

    return months;
  }, [history, timeframe]);

  // Summary counts
  const totals = useMemo(() => {
    const total = history.length;
    const critical = history.filter((a) => a.risk_level === 'CRITICAL' || a.risk_score >= 70 || a.audit_status === 'REJECTED').length;
    const moderate = history.filter((a) => a.risk_level === 'MODERATE' || (a.risk_score >= 30 && a.risk_score < 70) || a.audit_status === 'FLAGGED').length;
    const low = history.filter((a) => a.risk_level === 'LOW' && a.risk_score < 30 && a.audit_status === 'APPROVED').length;

    return { total, critical, moderate, low };
  }, [history]);

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Audit Risk Level Frequency Over Time</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30 font-bold uppercase">
                  Recharts Trend Analysis
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Longitudinal visualization of Low, Moderate, and Critical risk consignment volumes
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Selector & Legend Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe pill tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'daily'
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily (14D)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'weekly'
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weekly (12W)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'monthly'
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly (12M)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 text-xs font-mono">
        {/* Low Risk */}
        <button
          type="button"
          onClick={() => toggleLine('low')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            visibleLines.low
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold block">Low Risk Freq</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{totals.low}</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </button>

        {/* Moderate Risk */}
        <button
          type="button"
          onClick={() => toggleLine('moderate')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            visibleLines.moderate
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold block">Moderate Risk Freq</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{totals.moderate}</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-amber-500" />
        </button>

        {/* Critical Risk */}
        <button
          type="button"
          onClick={() => toggleLine('critical')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            visibleLines.critical
              ? 'bg-rose-950/20 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold block">Critical Risk Freq</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{totals.critical}</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-rose-500" />
        </button>

        {/* Total Frequency */}
        <button
          type="button"
          onClick={() => toggleLine('total')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            visibleLines.total
              ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold block">Total Inbound Audits</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{totals.total}</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
        </button>
      </div>

      {/* Recharts Line Chart */}
      <div className="h-72 w-full pt-2">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic space-y-2">
            <Activity className="w-6 h-6 text-slate-600 animate-pulse" />
            <span>No historical audit records available. Initiate an audit to start charting trends.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={frequencyData}
              margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl text-xs space-y-1.5 font-mono">
                        <p className="font-bold text-white border-b border-slate-800 pb-1">{data.displayDate}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4 text-emerald-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>Low Risk (0-29):</span>
                            </span>
                            <span className="font-bold">{data.low}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-amber-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>Moderate Risk (30-69):</span>
                            </span>
                            <span className="font-bold">{data.moderate}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-rose-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-400" />
                              <span>Critical Risk (70-100):</span>
                            </span>
                            <span className="font-bold">{data.critical}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-300 pt-1 border-t border-slate-800">
                            <span>Total Audited:</span>
                            <strong className="text-white">{data.total}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              {visibleLines.low && (
                <Line
                  type="monotone"
                  dataKey="low"
                  name="Low Risk"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
              )}

              {visibleLines.moderate && (
                <Line
                  type="monotone"
                  dataKey="moderate"
                  name="Moderate Risk"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#f59e0b', stroke: '#0f172a', strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
              )}

              {visibleLines.critical && (
                <Line
                  type="monotone"
                  dataKey="critical"
                  name="Critical Risk"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#f43f5e', stroke: '#0f172a', strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
              )}

              {visibleLines.total && (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Audits"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: '#06b6d4' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Clean Velocity Band (&lt;30)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">Flagged Regulatory Band (30-69)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">Quarantine Hold Band (&ge;70)</span>
          </span>
        </div>
        <span className="text-slate-500 text-[10px]">
          Click KPI chips above to isolate specific risk trajectories
        </span>
      </div>
    </div>
  );
};
