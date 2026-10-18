import React, { useMemo, useState } from 'react';
import { AuditResponse } from '../types/compliance';
import {
  Globe,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Layers,
  Filter,
  Info,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';

export interface RegionalStats {
  region: string;
  flag: string;
  total: number;
  approved: number;
  flagged: number;
  highRisk: number;
  avgRisk: number;
  highRiskPct: number;
  totalDeclaredValue: number;
  zone: 'CRITICAL ZONE' | 'MODERATE ZONE' | 'LOW-RISK ZONE';
  corridors: string[];
}

interface RegionalRiskDistributionWidgetProps {
  history: AuditResponse[];
  selectedCountryFilter?: string;
  onSelectCountryFilter?: (countryCode: string) => void;
}

export function computeRegionalRiskDistribution(history: AuditResponse[]): RegionalStats[] {
  const REGION_DEFINITIONS: Record<string, { flag: string; countries: string[] }> = {
    Americas: {
      flag: '🌎',
      countries: ['usa', 'united states', 'canada', 'brazil', 'mexico'],
    },
    Europe: {
      flag: '🇪🇺',
      countries: ['eu', 'european union', 'uk', 'united kingdom', 'germany', 'netherlands', 'france'],
    },
    'Asia-Pacific': {
      flag: '🌏',
      countries: ['singapore', 'japan', 'china', 'india', 'vietnam', 'australia', 'taiwan', 'south korea'],
    },
    'Middle East': {
      flag: '🌍',
      countries: ['uae', 'united arab emirates', 'dubai', 'saudi arabia', 'qatar'],
    },
  };

  const regionBuckets: Record<string, {
    total: number;
    approved: number;
    flagged: number;
    highRisk: number;
    totalRiskScore: number;
    totalDeclaredValue: number;
    corridors: Set<string>;
  }> = {
    Americas: { total: 0, approved: 0, flagged: 0, highRisk: 0, totalRiskScore: 0, totalDeclaredValue: 0, corridors: new Set() },
    Europe: { total: 0, approved: 0, flagged: 0, highRisk: 0, totalRiskScore: 0, totalDeclaredValue: 0, corridors: new Set() },
    'Asia-Pacific': { total: 0, approved: 0, flagged: 0, highRisk: 0, totalRiskScore: 0, totalDeclaredValue: 0, corridors: new Set() },
    'Middle East': { total: 0, approved: 0, flagged: 0, highRisk: 0, totalRiskScore: 0, totalDeclaredValue: 0, corridors: new Set() },
  };

  history.forEach((audit) => {
    const dest = (audit.destination_country || '').toLowerCase();
    let assigned = 'Asia-Pacific';

    for (const [regionName, def] of Object.entries(REGION_DEFINITIONS)) {
      if (def.countries.some((c) => dest.includes(c) || c.includes(dest))) {
        assigned = regionName;
        break;
      }
    }

    const bucket = regionBuckets[assigned];
    bucket.total += 1;
    const score = audit.risk_score || 0;
    bucket.totalRiskScore += score;
    bucket.totalDeclaredValue += audit.extracted_entities?.total_declared_value || 0;
    bucket.corridors.add(audit.destination_country || 'Other');

    const isHigh = score >= 70 || audit.audit_status === 'REJECTED' || audit.risk_level === 'CRITICAL';
    const isMod = (score >= 30 && score < 70) || audit.audit_status === 'FLAGGED';

    if (isHigh) bucket.highRisk += 1;
    else if (isMod) bucket.flagged += 1;
    else bucket.approved += 1;
  });

  return Object.entries(regionBuckets).map(([region, b]) => {
    const avgRisk = b.total > 0 ? Math.round(b.totalRiskScore / b.total) : 0;
    const highRiskPct = b.total > 0 ? Math.round((b.highRisk / b.total) * 100) : 0;

    let zone: 'CRITICAL ZONE' | 'MODERATE ZONE' | 'LOW-RISK ZONE' = 'LOW-RISK ZONE';
    if (highRiskPct >= 40 || avgRisk >= 60) {
      zone = 'CRITICAL ZONE';
    } else if (highRiskPct >= 20 || avgRisk >= 35) {
      zone = 'MODERATE ZONE';
    }

    return {
      region,
      flag: REGION_DEFINITIONS[region]?.flag || '🌐',
      total: b.total,
      approved: b.approved,
      flagged: b.flagged,
      highRisk: b.highRisk,
      avgRisk,
      highRiskPct,
      totalDeclaredValue: b.totalDeclaredValue,
      zone,
      corridors: Array.from(b.corridors),
    };
  });
}

export const RegionalRiskDistributionWidget: React.FC<RegionalRiskDistributionWidgetProps> = ({
  history,
  selectedCountryFilter,
  onSelectCountryFilter,
}) => {
  const [activeMetric, setActiveMetric] = useState<'stacked' | 'risk_score'>('stacked');

  const regionalData = useMemo(() => {
    return computeRegionalRiskDistribution(history);
  }, [history]);

  // Chart dataset for Recharts
  const chartData = useMemo(() => {
    return regionalData.map((r) => ({
      name: `${r.flag} ${r.region}`,
      region: r.region,
      Approved: r.approved,
      Flagged: r.flagged,
      HighRisk: r.highRisk,
      avgRisk: r.avgRisk,
      highRiskPct: r.highRiskPct,
      total: r.total,
      totalValue: r.totalDeclaredValue,
    }));
  }, [regionalData]);

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -right-12 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold mb-1">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Cross-Jurisdictional Risk Intelligence</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              Recharts Regional Widget
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Global Regional Audit Distribution & High-Risk Zones</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribution of approved, flagged, and high-risk consignments across Americas, Europe, Asia-Pacific, and Middle East customs corridors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveMetric('stacked')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeMetric === 'stacked'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stacked Audit Status
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('risk_score')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeMetric === 'risk_score'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Average Risk Index
            </button>
          </div>
        </div>
      </div>

      {/* Regional Zone Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {regionalData.map((item) => {
          const isCritical = item.zone === 'CRITICAL ZONE';
          const isModerate = item.zone === 'MODERATE ZONE';

          return (
            <div
              key={item.region}
              className={`p-4 rounded-2xl border transition-all text-xs space-y-2 relative overflow-hidden ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-sm shadow-rose-500/10'
                  : isModerate
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                  <span>{item.flag}</span>
                  <span>{item.region}</span>
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : isModerate
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {item.zone}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Ingested:</span>
                  <span className="text-white font-extrabold text-sm">{item.total} shipments</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Avg Risk Score:</span>
                  <span className={`text-sm font-extrabold ${isCritical ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {item.avgRisk}/100
                  </span>
                </div>
              </div>

              {/* Progress mini indicator */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>High-Risk Density</span>
                  <span className={isCritical ? 'text-rose-400 font-bold' : ''}>{item.highRiskPct}% ({item.highRisk}/{item.total})</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${item.total > 0 ? (item.approved / item.total) * 100 : 0}%` }}
                    title={`Approved: ${item.approved}`}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${item.total > 0 ? (item.flagged / item.total) * 100 : 0}%` }}
                    title={`Flagged: ${item.flagged}`}
                  />
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${item.total > 0 ? (item.highRisk / item.total) * 100 : 0}%` }}
                    title={`High Risk: ${item.highRisk}`}
                  />
                </div>
              </div>

              <div className="pt-1 text-[10px] text-slate-400 font-mono truncate">
                Corridors: {item.corridors.join(', ') || 'No active routes'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Recharts Composed Chart Visualization */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">
              {activeMetric === 'stacked'
                ? 'Regional Audit Distribution by Status (Stacked Volume)'
                : 'Regional Composite Risk Index & High-Risk Frequency'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Approved</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Flagged</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Critical / Rejected</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400" />
              <span>Avg Risk Index</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 25, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                stroke="#06b6d4"
                tick={{ fontSize: 10 }}
                unit=" pts"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl text-xs space-y-2 font-sans min-w-[210px]">
                        <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{d.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                            {d.total} audits
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-emerald-400">
                            <span>Approved Clean:</span>
                            <span className="font-bold">{d.Approved}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-400">
                            <span>Flagged Conditional:</span>
                            <span className="font-bold">{d.Flagged}</span>
                          </div>
                          <div className="flex items-center justify-between text-rose-400">
                            <span>Critical / Held:</span>
                            <span className="font-bold">{d.HighRisk}</span>
                          </div>
                          <div className="flex items-center justify-between text-cyan-400 pt-1 border-t border-slate-850">
                            <span>Avg Regional Risk:</span>
                            <span className="font-bold">{d.avgRisk}/100</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>High-Risk Density:</span>
                            <span className="font-bold">{d.highRiskPct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar yAxisId="left" dataKey="Approved" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={45} />
              <Bar yAxisId="left" dataKey="Flagged" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={45} />
              <Bar yAxisId="left" dataKey="HighRisk" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgRisk"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
