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
  Area,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Eye,
  Info,
  Sliders,
  CheckSquare,
} from 'lucide-react';

interface Past30DaysRiskTrendWidgetProps {
  history: AuditResponse[];
  onSelectAudit?: (audit: AuditResponse) => void;
  className?: string;
}

type ViewMode = 'both' | 'daily' | 'trendline';

export const Past30DaysRiskTrendWidget: React.FC<Past30DaysRiskTrendWidgetProps> = ({
  history,
  onSelectAudit,
  className = '',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [showThresholds, setShowThresholds] = useState<boolean>(true);
  const [selectedDayAudits, setSelectedDayAudits] = useState<{
    dateStr: string;
    displayDate: string;
    avgRisk: number;
    audits: AuditResponse[];
  } | null>(null);

  // Extract unique countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    history.forEach((a) => {
      if (a.destination_country) set.add(a.destination_country);
    });
    return Array.from(set).sort();
  }, [history]);

  // Filter history by country if selected
  const countryFilteredHistory = useMemo(() => {
    if (selectedCountry === 'ALL') return history;
    return history.filter(
      (a) => (a.destination_country || '').toLowerCase() === selectedCountry.toLowerCase()
    );
  }, [history, selectedCountry]);

  // Generate 30 discrete calendar days: Day 29 ago down to Day 0 (today)
  const timelineData = useMemo(() => {
    const days: {
      dateStr: string;
      displayDate: string;
      dayNum: number;
      dayOfWeek: string;
      audits: AuditResponse[];
      auditCount: number;
      avgRisk: number | null;
      cleanAvgRisk: number;
      movingAvgRisk: number;
      approvedCount: number;
      flaggedCount: number;
      rejectedCount: number;
    }[] = [];

    const now = new Date();
    // Normalize to midnight
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Map of dateStr (YYYY-MM-DD) -> audits
    const auditMap = new Map<string, AuditResponse[]>();
    countryFilteredHistory.forEach((audit) => {
      try {
        const d = new Date(audit.timestamp);
        const isoKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        const existing = auditMap.get(isoKey) || [];
        existing.push(audit);
        auditMap.set(isoKey, existing);
      } catch (e) {
        // ignore malformed timestamps
      }
    });

    // Populate each of the past 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const isoKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayOfWeek = d.toLocaleDateString(undefined, { weekday: 'narrow' });
      const dayAudits = auditMap.get(isoKey) || [];

      const auditCount = dayAudits.length;
      let avgRisk: number | null = null;
      let approvedCount = 0;
      let flaggedCount = 0;
      let rejectedCount = 0;

      if (auditCount > 0) {
        const totalRisk = dayAudits.reduce((acc, curr) => acc + (curr.risk_score || 0), 0);
        avgRisk = Math.round((totalRisk / auditCount) * 10) / 10;

        dayAudits.forEach((a) => {
          if (a.audit_status === 'APPROVED') approvedCount++;
          else if (a.audit_status === 'FLAGGED') flaggedCount++;
          else if (a.audit_status === 'REJECTED') rejectedCount++;
        });
      }

      days.push({
        dateStr: isoKey,
        displayDate,
        dayNum: 30 - i,
        dayOfWeek,
        audits: dayAudits,
        auditCount,
        avgRisk,
        cleanAvgRisk: avgRisk !== null ? avgRisk : 0,
        movingAvgRisk: 0, // will compute below
        approvedCount,
        flaggedCount,
        rejectedCount,
      });
    }

    // Compute 7-day rolling moving average for smoother trendline
    for (let idx = 0; idx < days.length; idx++) {
      const windowStart = Math.max(0, idx - 6);
      const windowSlice = days.slice(windowStart, idx + 1);
      const daysWithRisk = windowSlice.filter((d) => d.avgRisk !== null);

      if (daysWithRisk.length > 0) {
        const sum = daysWithRisk.reduce((acc, curr) => acc + (curr.avgRisk || 0), 0);
        days[idx].movingAvgRisk = Math.round((sum / daysWithRisk.length) * 10) / 10;
      } else {
        // Fallback to overall historical avg or prior moving avg
        const prevAvg = idx > 0 ? days[idx - 1].movingAvgRisk : 45;
        days[idx].movingAvgRisk = prevAvg;
      }
    }

    return days;
  }, [countryFilteredHistory]);

  // Overall 30-Day Metrics and Trend Determination
  const trendAnalysis = useMemo(() => {
    const daysWithAudits = timelineData.filter((d) => d.auditCount > 0);
    const totalAudited = daysWithAudits.reduce((sum, d) => sum + d.auditCount, 0);

    if (daysWithAudits.length === 0) {
      return {
        hasData: false,
        totalAudited: 0,
        meanRisk: 0,
        riskDelta: 0,
        pctChange: 0,
        trendDirection: 'STABLE' as 'IMPROVING' | 'WORSENING' | 'STABLE',
        peakDay: null,
        lowestDay: null,
        approvedTotal: 0,
        passRate: 0,
        firstHalfAvg: 0,
        secondHalfAvg: 0,
      };
    }

    const allRisks = daysWithAudits.map((d) => d.avgRisk!);
    const meanRisk = Math.round((allRisks.reduce((a, b) => a + b, 0) / allRisks.length) * 10) / 10;

    // Split 30 days into first half (days 0-14) vs second half (days 15-29)
    const firstHalfDays = timelineData.slice(0, 15).filter((d) => d.avgRisk !== null);
    const secondHalfDays = timelineData.slice(15, 30).filter((d) => d.avgRisk !== null);

    const firstHalfAvg =
      firstHalfDays.length > 0
        ? firstHalfDays.reduce((sum, d) => sum + d.avgRisk!, 0) / firstHalfDays.length
        : meanRisk;

    const secondHalfAvg =
      secondHalfDays.length > 0
        ? secondHalfDays.reduce((sum, d) => sum + d.avgRisk!, 0) / secondHalfDays.length
        : meanRisk;

    // Risk delta: positive means risk went UP (worsening), negative means risk went DOWN (improving)
    const riskDelta = Math.round((secondHalfAvg - firstHalfAvg) * 10) / 10;
    const pctChange =
      firstHalfAvg > 0
        ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 1000) / 10
        : 0;

    let trendDirection: 'IMPROVING' | 'WORSENING' | 'STABLE' = 'STABLE';
    if (riskDelta <= -3) {
      // Lower risk score = improved compliance
      trendDirection = 'IMPROVING';
    } else if (riskDelta >= 3) {
      // Higher risk score = worsening compliance
      trendDirection = 'WORSENING';
    }

    // Peak risk day
    let peakDay = daysWithAudits[0];
    let lowestDay = daysWithAudits[0];
    daysWithAudits.forEach((d) => {
      if ((d.avgRisk || 0) > (peakDay.avgRisk || 0)) peakDay = d;
      if ((d.avgRisk || 0) < (lowestDay.avgRisk || 0)) lowestDay = d;
    });

    const approvedTotal = daysWithAudits.reduce((sum, d) => sum + d.approvedCount, 0);
    const passRate = totalAudited > 0 ? Math.round((approvedTotal / totalAudited) * 100) : 0;

    return {
      hasData: true,
      totalAudited,
      meanRisk,
      riskDelta,
      pctChange,
      trendDirection,
      peakDay,
      lowestDay,
      approvedTotal,
      passRate,
      firstHalfAvg: Math.round(firstHalfAvg * 10) / 10,
      secondHalfAvg: Math.round(secondHalfAvg * 10) / 10,
    };
  }, [timelineData]);

  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5 animate-in fade-in duration-500 ${className}`}
    >
      {/* Top Header & Trend Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Average Risk Score Trajectory (Past 30 Days)
            </h3>

            {/* Compliance Trend Indicator Badge */}
            {trendAnalysis.trendDirection === 'IMPROVING' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Improving Trend ({Math.abs(trendAnalysis.pctChange)}% Risk Reduction)</span>
              </span>
            )}
            {trendAnalysis.trendDirection === 'WORSENING' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/70 border border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/10">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                <span>Worsening Trend (+{trendAnalysis.pctChange}% Risk Surge)</span>
              </span>
            )}
            {trendAnalysis.trendDirection === 'STABLE' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                <Minus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stable Compliance Trend (±{Math.abs(trendAnalysis.riskDelta)} pts)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Monitors rolling 30-day compliance risk scores across audited customs documents to track statutory remediation outcomes.
          </p>
        </div>

        {/* Controls: Country Filter & View Toggle */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {countries.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Markets ({history.length})</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Buttons */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Combined
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily Avg
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trendline')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'trendline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7-Day Trend
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            30-Day Mean Risk
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold font-mono ${
                trendAnalysis.meanRisk >= 70
                  ? 'text-rose-400'
                  : trendAnalysis.meanRisk >= 30
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {trendAnalysis.meanRisk}
            </span>
            <span className="text-xs text-slate-500 font-mono">/100</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {trendAnalysis.meanRisk < 30
              ? 'Low Exposure (Green Lane)'
              : trendAnalysis.meanRisk < 70
              ? 'Moderate Risk (Hold)'
              : 'Critical Non-Compliance'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Period Trajectory
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-extrabold font-mono ${
                trendAnalysis.riskDelta < 0
                  ? 'text-emerald-400'
                  : trendAnalysis.riskDelta > 0
                  ? 'text-rose-400'
                  : 'text-cyan-400'
              }`}
            >
              {trendAnalysis.riskDelta > 0 ? `+${trendAnalysis.riskDelta}` : trendAnalysis.riskDelta}
            </span>
            <span className="text-xs text-slate-500 font-mono">pts</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>D1-15: {trendAnalysis.firstHalfAvg}</span>
            <span>→</span>
            <span>D16-30: {trendAnalysis.secondHalfAvg}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Audited Consignments
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {trendAnalysis.totalAudited}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              ({trendAnalysis.passRate}% Clean)
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {trendAnalysis.approvedTotal} Cleared •{' '}
            {trendAnalysis.totalAudited - trendAnalysis.approvedTotal} Held/Flagged
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Peak Risk Exposure
          </span>
          {trendAnalysis.peakDay ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-rose-400 font-mono">
                  {trendAnalysis.peakDay.avgRisk}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  on {trendAnalysis.peakDay.displayDate}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {trendAnalysis.peakDay.auditCount} document(s) evaluated
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 italic pt-2">No audits logged</div>
          )}
        </div>
      </div>

      {/* Main Recharts Line Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timelineData}
            margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                const dayData = e.activePayload[0].payload;
                if (dayData && dayData.auditCount > 0) {
                  setSelectedDayAudits({
                    dateStr: dayData.dateStr,
                    displayDate: dayData.displayDate,
                    avgRisk: dayData.avgRisk || 0,
                    audits: dayData.audits,
                  });
                }
              }
            }}
          >
            <defs>
              <linearGradient id="riskAreaTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickLine={false}
              interval={4}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 30, 50, 70, 85, 100]}
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickLine={false}
            />

            {/* Threshold reference lines */}
            {showThresholds && (
              <>
                <ReferenceLine
                  y={70}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Critical Risk Threshold (70)',
                    position: 'insideTopRight',
                    fill: '#f43f5e',
                    fontSize: 9,
                  }}
                />
                <ReferenceLine
                  y={30}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Clean Benchmark (30)',
                    position: 'insideBottomRight',
                    fill: '#10b981',
                    fontSize: 9,
                  }}
                />
              </>
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs shadow-2xl space-y-2 min-w-[220px]">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          {data.displayDate} ({data.dateStr})
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Day {data.dayNum}/30
                        </span>
                      </div>

                      {data.auditCount > 0 ? (
                        <>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Daily Average Risk:</span>
                              <span
                                className={`font-mono font-extrabold ${
                                  data.avgRisk >= 70
                                    ? 'text-rose-400'
                                    : data.avgRisk >= 30
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {data.avgRisk}/100
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">7-Day Rolling Trend:</span>
                              <span className="font-mono text-cyan-300 font-bold">
                                {data.movingAvgRisk}/100
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                              <span className="text-slate-400">Audited Documents:</span>
                              <span className="font-mono text-white font-bold">{data.auditCount}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-center font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
                              ✓ {data.approvedCount}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-500/20">
                              ! {data.flaggedCount}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-500/20">
                              ✕ {data.rejectedCount}
                            </span>
                          </div>

                          <div className="text-[10px] text-indigo-400 pt-1 text-center font-medium">
                            Click point to inspect evaluated audits
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-500 italic py-1 text-center">
                          No customs documents audited on this day
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            7-Day Trend: {data.movingAvgRisk}/100
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Daily Average Risk Line */}
            {(viewMode === 'both' || viewMode === 'daily') && (
              <Line
                type="monotone"
                dataKey="avgRisk"
                name="Daily Average Risk"
                stroke="#06b6d4"
                strokeWidth={2.5}
                connectNulls={true}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.avgRisk === null || payload.auditCount === 0) return <circle key={`dot-empty-${payload.dateStr}`} cx={cx} cy={cy} r={0} />;
                  const color =
                    payload.avgRisk >= 70
                      ? '#f43f5e'
                      : payload.avgRisk >= 30
                      ? '#f59e0b'
                      : '#10b981';
                  return (
                    <circle
                      key={`dot-${payload.dateStr}`}
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill={color}
                      stroke="#0f172a"
                      strokeWidth={2}
                      className="cursor-pointer hover:r-6 transition-all"
                    />
                  );
                }}
                activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {/* 7-Day Moving Trendline */}
            {(viewMode === 'both' || viewMode === 'trendline') && (
              <Line
                type="monotone"
                dataKey="movingAvgRisk"
                name="7-Day Moving Average"
                stroke="#a855f7"
                strokeWidth={2.5}
                strokeDasharray={viewMode === 'both' ? '4 4' : undefined}
                dot={false}
                activeDot={{ r: 5, fill: '#a855f7', stroke: '#ffffff', strokeWidth: 1.5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Threshold toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-4 flex-wrap text-slate-400">
          {(viewMode === 'both' || viewMode === 'daily') && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Daily Avg Risk</span>
            </span>
          )}
          {(viewMode === 'both' || viewMode === 'trendline') && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-purple-400 border-b border-dashed border-purple-400" />
              <span>7-Day Moving Average</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Critical (&gt;70)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Moderate (30-70)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Low (&lt;30)</span>
          </span>
        </div>

        <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showThresholds}
            onChange={(e) => setShowThresholds(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-[11px]">Show Regulatory Thresholds (30 / 70)</span>
        </label>
      </div>

      {/* Selected Day Audits Drawer (on clicking a point) */}
      {selectedDayAudits && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs sm:text-sm">
                Evaluated Documents for {selectedDayAudits.displayDate}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  selectedDayAudits.avgRisk >= 70
                    ? 'bg-rose-950 text-rose-300 border border-rose-600/30'
                    : selectedDayAudits.avgRisk >= 30
                    ? 'bg-amber-950 text-amber-300 border border-amber-600/30'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-600/30'
                }`}
              >
                Avg Risk: {selectedDayAudits.avgRisk}/100
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayAudits(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedDayAudits.audits.map((item) => (
              <div
                key={item.audit_id}
                onClick={() => onSelectAudit && onSelectAudit(item)}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {item.audit_id}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                        item.audit_status === 'APPROVED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : item.audit_status === 'FLAGGED'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.audit_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {item.extracted_entities?.document_type || 'Customs Manifest'} • {item.destination_country}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-bold block ${
                        item.risk_score >= 70
                          ? 'text-rose-400'
                          : item.risk_score >= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {item.risk_score}/100
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Risk</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
