import React, { useState, useMemo } from 'react';
import { AuditResponse } from '../types/compliance';
import {
  Globe,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ExternalLink,
  Flame,
  Layers,
  ArrowRight,
  Filter,
  BarChart3,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface DestinationRiskStats {
  countryCode: string;
  countryName: string;
  flag: string;
  authority: string;
  region: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East' | 'Other';
  x: number; // SVG map coordinate X
  y: number; // SVG map coordinate Y
  total: number;
  highRiskCount: number;
  moderateRiskCount: number;
  cleanCount: number;
  highRiskDensityPct: number; // (highRiskCount / total) * 100
  avgRiskScore: number;
  maxRiskScore: number;
  totalValue: number;
  topDiscrepancies: string[];
}

interface GeographicalRiskHeatmapProps {
  history: AuditResponse[];
  selectedCountryFilter: string;
  onSelectCountryFilter: (countryCode: string) => void;
  onResetSeedData?: () => void;
}

// Global Hubs & Coordinate Registry for Destination Ports
const DESTINATION_HUBS: Omit<DestinationRiskStats, 'total' | 'highRiskCount' | 'moderateRiskCount' | 'cleanCount' | 'highRiskDensityPct' | 'avgRiskScore' | 'maxRiskScore' | 'totalValue' | 'topDiscrepancies'>[] = [
  {
    countryCode: 'USA',
    countryName: 'United States',
    flag: '🇺🇸',
    authority: 'CBP / ACE / FDA',
    region: 'Americas',
    x: 210,
    y: 165,
  },
  {
    countryCode: 'EU',
    countryName: 'European Union',
    flag: '🇪🇺',
    authority: 'TARIC / ICS2 / CBAM',
    region: 'Europe',
    x: 495,
    y: 145,
  },
  {
    countryCode: 'UK',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    authority: 'HMRC CDS / Defra',
    region: 'Europe',
    x: 470,
    y: 130,
  },
  {
    countryCode: 'UAE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    authority: 'Dubai Customs / Mirsal II',
    region: 'Middle East',
    x: 585,
    y: 195,
  },
  {
    countryCode: 'Singapore',
    countryName: 'Singapore',
    flag: '🇸🇬',
    authority: 'Singapore Customs / TradeNet',
    region: 'Asia-Pacific',
    x: 715,
    y: 245,
  },
  {
    countryCode: 'Japan',
    countryName: 'Japan',
    flag: '🇯🇵',
    authority: 'Japan Customs / NACCS',
    region: 'Asia-Pacific',
    x: 805,
    y: 165,
  },
  {
    countryCode: 'Australia',
    countryName: 'Australia',
    flag: '🇦🇺',
    authority: 'ABF / ICS Biosecurity',
    region: 'Asia-Pacific',
    x: 815,
    y: 310,
  },
  {
    countryCode: 'China',
    countryName: 'China',
    flag: '🇨🇳',
    authority: 'GACC / Single Window',
    region: 'Asia-Pacific',
    x: 720,
    y: 180,
  },
  {
    countryCode: 'Vietnam',
    countryName: 'Vietnam',
    flag: '🇻🇳',
    authority: 'General Department of Vietnam Customs',
    region: 'Asia-Pacific',
    x: 705,
    y: 220,
  },
  {
    countryCode: 'India',
    countryName: 'India',
    flag: '🇮🇳',
    authority: 'CBIC / ICEGATE',
    region: 'Asia-Pacific',
    x: 645,
    y: 205,
  },
  {
    countryCode: 'Canada',
    countryName: 'Canada',
    flag: '🇨🇦',
    authority: 'CBSA / CARM',
    region: 'Americas',
    x: 215,
    y: 110,
  },
  {
    countryCode: 'Brazil',
    countryName: 'Brazil',
    flag: '🇧🇷',
    authority: 'Receita Federal / Siscomex',
    region: 'Americas',
    x: 320,
    y: 285,
  },
];

// Helper to determine heat color based on density percentage
export function getDensityColor(densityPct: number, total: number): {
  fill: string;
  border: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  tier: 'CLEAN' | 'LOW' | 'MODERATE' | 'CRITICAL';
} {
  if (total === 0) {
    return {
      fill: '#334155',
      border: '#475569',
      glow: 'rgba(51, 65, 85, 0.2)',
      badgeBg: 'bg-slate-800',
      badgeText: 'text-slate-400',
      tier: 'CLEAN',
    };
  }

  if (densityPct >= 60) {
    return {
      fill: '#f43f5e', // rose-500
      border: '#fb7185',
      glow: 'rgba(244, 63, 94, 0.45)',
      badgeBg: 'bg-rose-500/20',
      badgeText: 'text-rose-300',
      tier: 'CRITICAL',
    };
  } else if (densityPct >= 30) {
    return {
      fill: '#f59e0b', // amber-500
      border: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.4)',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-300',
      tier: 'MODERATE',
    };
  } else if (densityPct > 0) {
    return {
      fill: '#06b6d4', // cyan-500
      border: '#22d3ee',
      glow: 'rgba(6, 182, 212, 0.35)',
      badgeBg: 'bg-cyan-500/20',
      badgeText: 'text-cyan-300',
      tier: 'LOW',
    };
  } else {
    return {
      fill: '#10b981', // emerald-500
      border: '#34d399',
      glow: 'rgba(16, 185, 129, 0.35)',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300',
      tier: 'CLEAN',
    };
  }
}

export const GeographicalRiskHeatmap: React.FC<GeographicalRiskHeatmapProps> = ({
  history,
  selectedCountryFilter,
  onSelectCountryFilter,
  onResetSeedData,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [metricMode, setMetricMode] = useState<'density' | 'volume' | 'avgScore'>('density');
  const [hoveredCountry, setHoveredCountry] = useState<DestinationRiskStats | null>(null);

  // Compute destination risk statistics from audit history
  const destinationData = useMemo(() => {
    // Map hubs
    const hubMap = new Map<string, DestinationRiskStats>();

    // Initialize all hubs
    DESTINATION_HUBS.forEach((hub) => {
      hubMap.set(hub.countryCode.toLowerCase(), {
        ...hub,
        total: 0,
        highRiskCount: 0,
        moderateRiskCount: 0,
        cleanCount: 0,
        highRiskDensityPct: 0,
        avgRiskScore: 0,
        maxRiskScore: 0,
        totalValue: 0,
        topDiscrepancies: [],
      });
    });

    // Aggregate audits
    history.forEach((audit) => {
      const destKey = (audit.destination_country || 'Other').toLowerCase();
      let stat = hubMap.get(destKey);

      if (!stat) {
        // Dynamic new destination not in preset list
        stat = {
          countryCode: audit.destination_country || 'OTHER',
          countryName: audit.destination_country || 'Destination Port',
          flag: '🌐',
          authority: audit.regulatory_framework?.split('(')[0]?.trim() || 'Customs Authority',
          region: 'Other',
          x: 450 + (Math.sin(destKey.length) * 180),
          y: 200 + (Math.cos(destKey.length) * 80),
          total: 0,
          highRiskCount: 0,
          moderateRiskCount: 0,
          cleanCount: 0,
          highRiskDensityPct: 0,
          avgRiskScore: 0,
          maxRiskScore: 0,
          totalValue: 0,
          topDiscrepancies: [],
        };
        hubMap.set(destKey, stat);
      }

      stat.total += 1;
      const score = audit.risk_score || 0;
      if (score > stat.maxRiskScore) stat.maxRiskScore = score;
      stat.totalValue += audit.extracted_entities?.total_declared_value || 0;

      // High risk definition: score >= 70 or status === 'REJECTED' or level === 'CRITICAL'
      const isHighRisk = score >= 70 || audit.audit_status === 'REJECTED' || audit.risk_level === 'CRITICAL';
      const isModerate = (score >= 30 && score < 70) || audit.audit_status === 'FLAGGED';

      if (isHighRisk) {
        stat.highRiskCount += 1;
      } else if (isModerate) {
        stat.moderateRiskCount += 1;
      } else {
        stat.cleanCount += 1;
      }

      // Collect sample discrepancy summaries
      if (audit.compliance_discrepancies && audit.compliance_discrepancies.length > 0) {
        audit.compliance_discrepancies.slice(0, 2).forEach((disc) => {
          if (!stat!.topDiscrepancies.includes(disc) && stat!.topDiscrepancies.length < 3) {
            stat!.topDiscrepancies.push(disc);
          }
        });
      }
    });

    // Calculate percentages and averages
    const list = Array.from(hubMap.values()).map((stat) => {
      const auditsForDest = history.filter(
        (a) => (a.destination_country || '').toLowerCase() === stat.countryCode.toLowerCase()
      );
      const totalScore = auditsForDest.reduce((sum, a) => sum + (a.risk_score || 0), 0);
      const avg = stat.total > 0 ? Math.round(totalScore / stat.total) : 0;
      const density = stat.total > 0 ? Math.round((stat.highRiskCount / stat.total) * 100) : 0;

      return {
        ...stat,
        avgRiskScore: avg,
        highRiskDensityPct: density,
      };
    });

    return list;
  }, [history]);

  // Filtered by selected region
  const filteredData = useMemo(() => {
    if (selectedRegion === 'ALL') return destinationData;
    return destinationData.filter((d) => d.region === selectedRegion);
  }, [destinationData, selectedRegion]);

  // Active destinations with at least 1 consignment recorded
  const activeDestinations = useMemo(() => {
    return destinationData.filter((d) => d.total > 0);
  }, [destinationData]);

  // Overall global risk statistics
  const globalSummary = useMemo(() => {
    const totalConsignments = history.length;
    const totalHighRisk = history.filter(
      (a) => (a.risk_score || 0) >= 70 || a.audit_status === 'REJECTED' || a.risk_level === 'CRITICAL'
    ).length;
    const globalDensityPct = totalConsignments > 0 ? Math.round((totalHighRisk / totalConsignments) * 100) : 0;

    // Destination with highest risk density (minimum 1 consignment)
    const sortedByDensity = [...activeDestinations].sort((a, b) => b.highRiskDensityPct - a.highRiskDensityPct || b.avgRiskScore - a.avgRiskScore);
    const topRiskDestination = sortedByDensity[0] || null;

    return {
      totalConsignments,
      totalHighRisk,
      globalDensityPct,
      topRiskDestination,
      monitoredCountriesCount: activeDestinations.length,
    };
  }, [history, activeDestinations]);

  // Recharts Chart Dataset sorted for visual comparison
  const rechartsData = useMemo(() => {
    const sorted = [...activeDestinations].sort((a, b) => {
      if (metricMode === 'density') return b.highRiskDensityPct - a.highRiskDensityPct;
      if (metricMode === 'volume') return b.highRiskCount - a.highRiskCount;
      return b.avgRiskScore - a.avgRiskScore;
    });

    return sorted.map((item) => ({
      name: `${item.flag} ${item.countryCode}`,
      countryCode: item.countryCode,
      countryName: item.countryName,
      densityPct: item.highRiskDensityPct,
      highRiskCount: item.highRiskCount,
      moderateRiskCount: item.moderateRiskCount,
      cleanCount: item.cleanCount,
      total: item.total,
      avgRiskScore: item.avgRiskScore,
      value:
        metricMode === 'density'
          ? item.highRiskDensityPct
          : metricMode === 'volume'
          ? item.highRiskCount
          : item.avgRiskScore,
    }));
  }, [activeDestinations, metricMode]);

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold mb-1">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Cross-Border Customs Risk Intelligence</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              Geographical Heatmap
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>High-Risk Consignment Density by Destination Country</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Visual density analysis of flagged and critical shipments across international customs corridors. Click any country node or bar to filter the audit repository.
          </p>
        </div>

        {/* View Controls: Metric mode and Region selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric mode toggle */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMetricMode('density')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                metricMode === 'density'
                  ? 'bg-rose-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Density Rate (%)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('volume')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                metricMode === 'volume'
                  ? 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High-Risk Count
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('avgScore')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                metricMode === 'avgScore'
                  ? 'bg-cyan-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Avg Score
            </button>
          </div>

          {/* Region filter */}
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Regions (Global)</option>
              <option value="Americas">Americas</option>
              <option value="Europe">Europe</option>
              <option value="Asia-Pacific">Asia-Pacific</option>
              <option value="Middle East">Middle East</option>
            </select>
          </div>

          {selectedCountryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectCountryFilter('ALL')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
            >
              <span>Clear Filter: {selectedCountryFilter}</span>
              <span className="text-slate-400 font-mono">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Global High-Risk Density</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-rose-400">
              {globalSummary.globalDensityPct}%
            </span>
            <span className="text-xs text-slate-400">
              ({globalSummary.totalHighRisk}/{globalSummary.totalConsignments})
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Critical Corridor</span>
          <div className="flex items-center gap-2 mt-1">
            {globalSummary.topRiskDestination ? (
              <>
                <span className="text-lg">{globalSummary.topRiskDestination.flag}</span>
                <span className="text-base font-bold text-white truncate">
                  {globalSummary.topRiskDestination.countryName}
                </span>
                <span className="text-xs font-mono font-bold text-rose-400 ml-auto">
                  {globalSummary.topRiskDestination.highRiskDensityPct}%
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-500 italic">No destination records</span>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Monitored Destinations</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-cyan-400">
              {globalSummary.monitoredCountriesCount}
            </span>
            <span className="text-xs text-slate-400">Active Ports</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Heat Scale Density</span>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Clean</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>&lt;30%</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>30-60%</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>&gt;60%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Geographical Heatmap Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Geographical SVG World Map (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Geographical Customs Hubs & Corridors</span>
            </span>
            <span className="text-slate-400 text-[11px]">Click a port node to filter</span>
          </div>

          {/* SVG World Map with Port Heatnodes */}
          <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-slate-950 border border-slate-900 flex items-center justify-center">
            <svg
              viewBox="0 0 1000 450"
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
            >
              <defs>
                {/* Heatmap Radial Gradients */}
                <radialGradient id="highRiskGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="moderateRiskGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="lowRiskGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>

                {/* Trade corridor dash animation */}
                <linearGradient id="tradeLaneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* World Grid Lines */}
              <g opacity="0.15" stroke="#475569" strokeWidth="0.5" strokeDasharray="4 4">
                <line x1="0" y1="112" x2="1000" y2="112" />
                <line x1="0" y1="225" x2="1000" y2="225" />
                <line x1="0" y1="337" x2="1000" y2="337" />
                <line x1="250" y1="0" x2="250" y2="450" />
                <line x1="500" y1="0" x2="500" y2="450" />
                <line x1="750" y1="0" x2="750" y2="450" />
              </g>

              {/* Simplified Continental Outlines (Stylized Geographical landmass shapes) */}
              <g fill="#1e293b" opacity="0.45" stroke="#334155" strokeWidth="1">
                {/* North America */}
                <path d="M 120 70 L 260 70 L 310 110 L 290 160 L 230 190 L 190 240 L 170 200 L 130 150 Z" />
                {/* South America */}
                <path d="M 270 230 L 340 250 L 360 320 L 310 400 L 280 340 L 250 270 Z" />
                {/* Europe */}
                <path d="M 450 80 L 530 80 L 550 140 L 500 170 L 460 150 L 430 110 Z" />
                {/* Africa */}
                <path d="M 460 180 L 550 180 L 560 260 L 520 350 L 470 280 L 440 220 Z" />
                {/* Asia */}
                <path d="M 550 80 L 830 80 L 860 160 L 800 230 L 710 260 L 610 220 L 560 150 Z" />
                {/* Australia */}
                <path d="M 760 280 L 870 280 L 880 350 L 810 370 L 760 330 Z" />
              </g>

              {/* Maritime Corridors / Global Shipping Lanes */}
              <g fill="none" stroke="url(#tradeLaneGrad)" strokeWidth="1.5" opacity="0.5">
                {/* Trans-Pacific Lane (China/Japan -> US West Coast) */}
                <path d="M 805 165 C 920 120, 90 120, 210 165" strokeDasharray="5 3" />
                {/* Trans-Atlantic Lane (Europe -> US East Coast) */}
                <path d="M 210 165 Q 350 140 495 145" strokeDasharray="4 2" />
                {/* Asia-Europe via Suez/Malacca */}
                <path d="M 715 245 Q 650 230 585 195 T 495 145" strokeDasharray="4 2" />
                {/* Asia-Australia */}
                <path d="M 715 245 Q 750 280 815 310" strokeDasharray="3 3" />
              </g>

              {/* Geographical Port Nodes with Density Heatmap */}
              {filteredData.map((hub) => {
                const color = getDensityColor(hub.highRiskDensityPct, hub.total);
                const isSelected = selectedCountryFilter.toLowerCase() === hub.countryCode.toLowerCase();
                const isHovered = hoveredCountry?.countryCode === hub.countryCode;

                // Radius proportional to total volume
                const baseRadius = hub.total > 0 ? Math.min(24, Math.max(14, 10 + hub.total * 3)) : 8;
                const glowRadius = baseRadius * 2.5;

                return (
                  <g
                    key={hub.countryCode}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => {
                      if (isSelected) {
                        onSelectCountryFilter('ALL');
                      } else {
                        onSelectCountryFilter(hub.countryCode);
                      }
                    }}
                    onMouseEnter={() => setHoveredCountry(hub)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    {/* Glowing Radiation Heat Aura if High Density */}
                    {hub.total > 0 && hub.highRiskDensityPct >= 30 && (
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={glowRadius}
                        fill={hub.highRiskDensityPct >= 60 ? 'url(#highRiskGlow)' : 'url(#moderateRiskGlow)'}
                        className={hub.highRiskDensityPct >= 60 ? 'animate-pulse' : ''}
                      />
                    )}

                    {/* Selected Halo Ring */}
                    {isSelected && (
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={baseRadius + 8}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ transformOrigin: `${hub.x}px ${hub.y}px`, animationDuration: '6s' }}
                      />
                    )}

                    {/* Outer Boundary Node */}
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r={baseRadius}
                      fill={color.fill}
                      stroke={isSelected ? '#ffffff' : color.border}
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={hub.total > 0 ? 0.95 : 0.4}
                    />

                    {/* Node Core Center / Indicator */}
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r={Math.max(4, baseRadius * 0.4)}
                      fill="#0f172a"
                    />

                    {/* Country Code Label */}
                    <text
                      x={hub.x}
                      y={hub.y + baseRadius + 14}
                      textAnchor="middle"
                      fill={isSelected ? '#38bdf8' : hub.total > 0 ? '#f8fafc' : '#64748b'}
                      fontSize={isSelected ? '12' : '10'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="monospace"
                    >
                      {hub.countryCode}
                    </text>

                    {/* High-Risk Density Badge if active */}
                    {hub.total > 0 && (
                      <g>
                        <rect
                          x={hub.x - 14}
                          y={hub.y - baseRadius - 15}
                          width="28"
                          height="13"
                          rx="4"
                          fill="#0f172a"
                          stroke={color.border}
                          strokeWidth="1"
                        />
                        <text
                          x={hub.x}
                          y={hub.y - baseRadius - 5}
                          textAnchor="middle"
                          fill={color.border}
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {hub.highRiskDensityPct}%
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-3 border-t border-slate-900 mt-2 text-slate-400">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">Density Scale:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>0% Clean</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span>1-29% Low</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>30-59% Mod</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>60%+ Critical</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              {hoveredCountry ? (
                <span className="text-white font-bold">
                  {hoveredCountry.flag} {hoveredCountry.countryName}: {hoveredCountry.highRiskDensityPct}% High-Risk ({hoveredCountry.highRiskCount}/{hoveredCountry.total})
                </span>
              ) : (
                <span>Hover node for details</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recharts Density Distribution & Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-white tracking-tight">
                {metricMode === 'density'
                  ? 'Consignment Risk Density (%)'
                  : metricMode === 'volume'
                  ? 'High-Risk Consignment Volume'
                  : 'Average Risk Score (0-100)'}
              </h3>
            </div>
            <span className="font-mono text-[10px] text-slate-400 uppercase">
              {rechartsData.length} Jurisdictions
            </span>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-56">
            {rechartsData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 text-center p-4">
                <p>No destination audit data available.</p>
                {onResetSeedData && (
                  <button
                    onClick={onResetSeedData}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold cursor-pointer"
                  >
                    Load Sample Audits
                  </button>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rechartsData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fontSize: 9 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    domain={[0, metricMode === 'density' ? 100 : metricMode === 'volume' ? 'auto' : 100]}
                    stroke="#94a3b8"
                    tick={{ fontSize: 9 }}
                  />
                  {metricMode === 'density' && (
                    <ReferenceLine y={50} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '50% Alert', fill: '#f43f5e', fontSize: 9, position: 'right' }} />
                  )}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        const isCrit = d.densityPct >= 60;
                        return (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl text-xs space-y-1.5 font-sans min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <span>{d.name}</span>
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                  isCrit ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {d.densityPct}% DENSITY
                              </span>
                            </div>
                            <div className="space-y-1 font-mono text-[11px] pt-1">
                              <p className="flex justify-between text-slate-300">
                                <span>Total Audits:</span>
                                <strong className="text-white">{d.total}</strong>
                              </p>
                              <p className="flex justify-between text-rose-400">
                                <span>High Risk (&ge;70):</span>
                                <strong>{d.highRiskCount}</strong>
                              </p>
                              <p className="flex justify-between text-amber-400">
                                <span>Flagged (30-69):</span>
                                <strong>{d.moderateRiskCount}</strong>
                              </p>
                              <p className="flex justify-between text-emerald-400">
                                <span>Approved (&lt;30):</span>
                                <strong>{d.cleanCount}</strong>
                              </p>
                              <p className="flex justify-between text-cyan-400 pt-1 border-t border-slate-800">
                                <span>Avg Risk Score:</span>
                                <strong>{d.avgRiskScore}/100</strong>
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-400 italic pt-1">
                              Click to isolate {d.countryCode} consignments
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    onClick={(entry: any) => {
                      const code = entry?.payload?.countryCode || entry?.countryCode;
                      if (code) onSelectCountryFilter(code);
                    }}
                    className="cursor-pointer"
                  >
                    {rechartsData.map((entry, index) => {
                      const color = getDensityColor(entry.densityPct, entry.total);
                      const isSelected = selectedCountryFilter.toLowerCase() === entry.countryCode.toLowerCase();
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isSelected ? '#38bdf8' : color.fill}
                          stroke={isSelected ? '#ffffff' : color.border}
                          strokeWidth={isSelected ? 2 : 1}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Destination Cards Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            {rechartsData.slice(0, 4).map((d) => {
              const isSelected = selectedCountryFilter.toLowerCase() === d.countryCode.toLowerCase();
              const isHigh = d.densityPct >= 50;
              return (
                <button
                  key={d.countryCode}
                  type="button"
                  onClick={() => onSelectCountryFilter(isSelected ? 'ALL' : d.countryCode)}
                  className={`p-2 rounded-xl text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate">{d.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isHigh ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {d.densityPct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>{d.total} filings</span>
                    <span>{d.highRiskCount} critical</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
