import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { AuditResponse } from '../types/compliance';
import {
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Filter,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';

interface HistoricalRiskTimelineChartProps {
  history: AuditResponse[];
  onSelectAudit?: (audit: AuditResponse) => void;
  onNavigateToInitiate?: () => void;
  onResetSeedData?: () => void;
}

export const HistoricalRiskTimelineChart: React.FC<HistoricalRiskTimelineChartProps> = ({
  history,
  onSelectAudit,
  onNavigateToInitiate,
  onResetSeedData,
}) => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('ALL');
  const [viewWindow, setViewWindow] = useState<'all' | 'recent_10' | 'recent_20'>('all');
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);

  // Available jurisdictions
  const jurisdictions = useMemo(() => {
    const list = Array.from(new Set(history.map((a) => a.destination_country).filter(Boolean)));
    return list.sort();
  }, [history]);

  // Filtered & Chronologically Sorted Audits (Oldest to Newest)
  const chronologicalData = useMemo(() => {
    let filtered = history.filter((a) => {
      if (selectedJurisdiction !== 'ALL' && a.destination_country !== selectedJurisdiction) {
        return false;
      }
      return true;
    });

    // Sort ascending by timestamp so time progresses left to right
    filtered = [...filtered].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (viewWindow === 'recent_10') {
      filtered = filtered.slice(-10);
    } else if (viewWindow === 'recent_20') {
      filtered = filtered.slice(-20);
    }

    return filtered;
  }, [history, selectedJurisdiction, viewWindow]);

  // Transform data and compute rolling moving average
  const chartData = useMemo(() => {
    const windowSize = 3; // 3-point rolling average
    return chronologicalData.map((item, idx, arr) => {
      const dateObj = new Date(item.timestamp);
      const formattedDate = dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const formattedTime = dateObj.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Calculate rolling moving average of risk scores up to this point
      const start = Math.max(0, idx - windowSize + 1);
      const slice = arr.slice(start, idx + 1);
      const movingAvg = Math.round(
        slice.reduce((acc, curr) => acc + (curr.risk_score || 0), 0) / slice.length
      );

      const itemsCount = item.extracted_entities?.items?.length || 0;
      const firstItem = item.extracted_entities?.items?.[0];
      const itemDesc = firstItem?.item_description || 'General Cargo';
      const declaredValue = Number(item.extracted_entities?.total_declared_value) || 0;
      const currency = item.extracted_entities?.currency || 'USD';

      return {
        id: item.audit_id,
        shortId: item.audit_id.replace(/^AUD-/, '').slice(0, 10),
        displayDate: `${formattedDate}`,
        fullDate: `${formattedDate} ${formattedTime}`,
        riskScore: item.risk_score,
        movingAverage: movingAvg,
        status: item.audit_status,
        riskLevel: item.risk_level,
        country: item.destination_country,
        framework: item.regulatory_framework,
        shipper: item.extracted_entities?.shipper_name || 'Unspecified Shipper',
        consignee: item.extracted_entities?.consignee_name || 'Unspecified Consignee',
        itemSummary: itemDesc,
        itemsCount,
        declaredValue,
        currency,
        discrepanciesCount: item.compliance_discrepancies?.length || 0,
        primaryDiscrepancy: item.compliance_discrepancies?.[0] || 'No critical variance',
        rawAudit: item,
      };
    });
  }, [chronologicalData]);

  // Risk pattern metrics
  const patternMetrics = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgRisk: 0,
        highestRisk: 0,
        lowestRisk: 0,
        highRiskOutliers: 0,
        trendDirection: 'STABLE',
        trendDelta: 0,
        volatility: 0,
      };
    }

    const scores = chartData.map((d) => d.riskScore);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const outliers = chartData.filter((d) => d.riskScore >= 70).length;

    // Volatility (standard deviation)
    const variance =
      scores.reduce((acc, score) => acc + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.round(Math.sqrt(variance));

    // Direction (comparing first half vs second half or start vs end)
    let trendDirection: 'IMPROVING' | 'ESCALATING' | 'STABLE' = 'STABLE';
    let trendDelta = 0;
    if (chartData.length >= 2) {
      const firstScore = chartData[0].riskScore;
      const lastScore = chartData[chartData.length - 1].riskScore;
      trendDelta = lastScore - firstScore;
      if (trendDelta <= -8) trendDirection = 'IMPROVING';
      else if (trendDelta >= 8) trendDirection = 'ESCALATING';
      else trendDirection = 'STABLE';
    }

    return {
      avgRisk: avg,
      highestRisk: max,
      lowestRisk: min,
      highRiskOutliers: outliers,
      trendDirection,
      trendDelta,
      volatility: stdDev,
    };
  }, [chartData]);

  // Custom Dot component coloring each audit node by compliance risk status
  const CustomAuditDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;

    let fill = '#10b981'; // Green for approved / low risk
    let stroke = '#065f46';
    if (payload.riskScore >= 70) {
      fill = '#f43f5e'; // Crimson for rejected / critical
      stroke = '#881337';
    } else if (payload.riskScore >= 30) {
      fill = '#f59e0b'; // Amber for flagged
      stroke = '#78350f';
    }

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill={fill}
          stroke="#0f172a"
          strokeWidth={2}
          className="cursor-pointer hover:scale-150 transition-all duration-200"
          onClick={() => {
            if (onSelectAudit && payload.rawAudit) {
              onSelectAudit(payload.rawAudit);
            }
          }}
        />
        {payload.riskScore >= 70 && (
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={1.5}
            className="animate-ping opacity-60 pointer-events-none"
          />
        )}
      </g>
    );
  };

  // Custom Rich Tooltip for chronological audit points
  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      let badgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      if (data.status === 'REJECTED') {
        badgeBg = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      } else if (data.status === 'FLAGGED') {
        badgeBg = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      }

      return (
        <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs font-mono space-y-2 max-w-sm z-50 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-white block">{data.id}</span>
              <span className="text-[10px] text-slate-400">{data.fullDate}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${badgeBg}`}>
              {data.status}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Jurisdiction:</span>
              <strong className="text-cyan-400">{data.country}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Shipper:</span>
              <span className="text-slate-200 truncate max-w-[160px]">{data.shipper}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Consignment Value:</span>
              <span className="text-emerald-400 font-bold">
                ${data.declaredValue.toLocaleString()} {data.currency}
              </span>
            </div>
            <div className="pt-1 text-[10px] text-slate-400 truncate">
              Cargo: <span className="text-slate-200">{data.itemSummary}</span>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Consignment Risk:</span>
              <span
                className={`text-base font-extrabold ${
                  data.riskScore >= 70
                    ? 'text-rose-400'
                    : data.riskScore >= 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {data.riskScore} <span className="text-[11px] text-slate-400 font-normal">/ 100</span>
              </span>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-slate-400 block">3-Pt Trendline:</span>
              <span className="text-xs font-bold text-cyan-300">{data.movingAverage}/100</span>
            </div>
          </div>

          {data.discrepanciesCount > 0 && (
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300">
              ⚠️ {data.primaryDiscrepancy}
            </div>
          )}

          <div className="text-[10px] text-emerald-400 text-center pt-1 font-semibold flex items-center justify-center gap-1">
            <span>Click node to open full audit dossier</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Historical Consignment Risk Patterns Over Time</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                {chartData.length} Audits Plotted
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological risk score progression, moving averages, and pattern identification across shipments
            </p>
          </div>
        </div>

        {/* Chart View Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Jurisdiction Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono pr-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Jurisdictions ({jurisdictions.length})</option>
              {jurisdictions.map((j) => (
                <option key={j} value={j} className="bg-slate-900 text-white">
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Time Window Selectors */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewWindow('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                viewWindow === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setViewWindow('recent_20')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                viewWindow === 'recent_20'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recent 20
            </button>
            <button
              onClick={() => setViewWindow('recent_10')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                viewWindow === 'recent_10'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recent 10
            </button>
          </div>

          {/* Moving Average Toggle */}
          <button
            onClick={() => setShowMovingAverage(!showMovingAverage)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              showMovingAverage
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle 3-point rolling moving average trendline"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showMovingAverage ? 'bg-cyan-400' : 'bg-slate-600'
              }`}
            />
            <span>Moving Avg</span>
          </button>
        </div>
      </div>

      {/* Pattern Insights & Velocity KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Average Risk */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Mean Consignment Risk
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-2xl font-black font-mono ${
                patternMetrics.avgRisk >= 70
                  ? 'text-rose-400'
                  : patternMetrics.avgRisk >= 30
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {patternMetrics.avgRisk}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Range: {patternMetrics.lowestRisk} – {patternMetrics.highestRisk} pts
          </span>
        </div>

        {/* Pattern Trajectory */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Risk Pattern Velocity
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            {patternMetrics.trendDirection === 'IMPROVING' ? (
              <>
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                <span className="text-base font-bold text-emerald-400 font-mono">
                  Improving ({patternMetrics.trendDelta} pts)
                </span>
              </>
            ) : patternMetrics.trendDirection === 'ESCALATING' ? (
              <>
                <TrendingUp className="w-5 h-5 text-rose-400" />
                <span className="text-base font-bold text-rose-400 font-mono">
                  Escalating (+{patternMetrics.trendDelta} pts)
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-cyan-400 font-mono">
                Stable Drift
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Linear slope across chronology
          </span>
        </div>

        {/* Risk Volatility */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Consignment Volatility
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-cyan-300">
              ±{patternMetrics.volatility}
            </span>
            <span className="text-xs text-slate-500 font-mono">pts σ</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {patternMetrics.volatility > 25
              ? 'High Variance (Mixed Cargo)'
              : 'Consistent Cargo Risk'}
          </span>
        </div>

        {/* High-Risk Outliers */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            High-Risk Outliers
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className={`text-2xl font-black font-mono ${
                patternMetrics.highRiskOutliers > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {patternMetrics.highRiskOutliers}
            </span>
            <span className="text-xs text-slate-400">
              shipment{patternMetrics.highRiskOutliers === 1 ? '' : 's'} (&ge;70)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Mandatory quarantine holds
          </span>
        </div>
      </div>

      {/* Main Interactive Chart Canvas */}
      <div className="h-72 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/60 space-y-3">
            <Activity className="w-10 h-10 text-slate-600 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-slate-300">No Audits Available for this Filter</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Run an audit or reset filter to visualize historical consignment risk patterns.
              </p>
            </div>
            {onResetSeedData && (
              <button
                onClick={onResetSeedData}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Load Sample Records
              </button>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
            >
              <defs>
                {/* Area Gradient for Risk Underlay */}
                <linearGradient id="histRiskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#06b6d4" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                </linearGradient>

                {/* Moving Average Line Glow */}
                <linearGradient id="movingAvgGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#1e293b"
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.6}
              />

              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val, idx) => {
                  const item = chartData[idx];
                  return item ? `${val}` : val;
                }}
              />

              <YAxis
                domain={[0, 100]}
                ticks={[0, 30, 70, 100]}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              {/* Statutory Threshold Reference Lines */}
              <ReferenceLine
                y={70}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                label={{
                  value: 'Critical Risk Threshold (70)',
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'top',
                }}
              />

              <ReferenceLine
                y={30}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                label={{
                  value: 'Automated Green Release (<30)',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'top',
                }}
              />

              <Tooltip content={<CustomTimelineTooltip />} />

              {/* Shaded Area fill for individual audit scores */}
              <Area
                type="monotone"
                dataKey="riskScore"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#histRiskAreaGrad)"
                dot={<CustomAuditDot />}
                activeDot={{ r: 8, stroke: '#38bdf8', strokeWidth: 2 }}
                name="Consignment Risk"
              />

              {/* Optional Rolling Moving Average Line */}
              {showMovingAverage && (
                <Line
                  type="monotone"
                  dataKey="movingAverage"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="3-Point Trendline"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Legend & Interactive Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Clean Clearance (&lt;30)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Flagged Review (30–69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-rose-500/30" />
            <span className="text-rose-300 font-bold">Critical Breach (&ge;70)</span>
          </div>
          {showMovingAverage && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-400 inline-block border-t-2 border-indigo-400 border-dashed" />
              <span className="text-indigo-300">Rolling Trendline</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Click any audit point on the timeline to inspect its full findings dossier</span>
        </div>
      </div>
    </div>
  );
};
