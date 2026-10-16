import React from 'react';
import { RiskLevel, AuditStatus } from '../types/compliance';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RiskMeterProps {
  score: number; // 0 to 100
  riskLevel: RiskLevel;
  status: AuditStatus;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, riskLevel, status }) => {
  // Normalize score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // SVG Gauge calculations
  // Arc angles: 180 degrees (semi-circle) from 180 deg (left) to 0 deg (right)
  const radius = 70;
  const strokeWidth = 12;
  const cx = 95;
  const cy = 95;
  // Arc circumference for semi-circle = PI * radius
  const arcLength = Math.PI * radius;
  // Offset for progress
  const progressOffset = arcLength - (clampedScore / 100) * arcLength;

  // Colors based on score
  let scoreColor = '#10b981'; // emerald-500
  let badgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let badgeLabel = 'LOW RISK';
  let probabilityText = '98.5% Customs Clearance Velocity';

  if (clampedScore >= 70) {
    scoreColor = '#f43f5e'; // rose-500
    badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    badgeLabel = 'CRITICAL REGULATORY RISK';
    probabilityText = '< 5% Entry Probability (Hold Mandated)';
  } else if (clampedScore >= 30) {
    scoreColor = '#f59e0b'; // amber-500
    badgeBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    badgeLabel = 'MODERATE COMPLIANCE RISK';
    probabilityText = '62% Conditional Clearance (Pending Docs)';
  }

  // Needle angle: from -90 deg (left, 0) to +90 deg (right, 100)
  const needleAngle = -90 + (clampedScore / 100) * 180;

  return (
    <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: scoreColor }}
      />

      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">
          Composite Risk Meter
        </span>
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeBg}`}>
          {badgeLabel}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-[190px] h-[115px] flex items-center justify-center">
        <svg width="190" height="115" viewBox="0 0 190 115" className="overflow-visible">
          {/* Background Track Arc */}
          <path
            d="M 25 95 A 70 70 0 0 1 165 95"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Color Gradient Track Definition */}
          <defs>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Value Progress Arc */}
          <path
            d="M 25 95 A 70 70 0 0 1 165 95"
            fill="none"
            stroke="url(#riskGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Needle Center Pivot */}
          <circle cx={cx} cy={cy} r="6" fill="#f8fafc" />
          <circle cx={cx} cy={cy} r="3" fill="#0f172a" />

          {/* Gauge Needle */}
          <g
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: `rotate(${needleAngle}deg)`,
              transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - radius + 8}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-md"
            />
            <polygon
              points={`${cx - 3},${cy - 20} ${cx + 3},${cy - 20} ${cx},${cy - radius + 5}`}
              fill="#ffffff"
            />
          </g>
        </svg>

        {/* Center Score Readout */}
        <div className="absolute bottom-0 text-center flex flex-col items-center">
          <span className="text-3xl font-black tracking-tight text-white font-mono leading-none">
            {clampedScore}
            <span className="text-sm font-semibold text-slate-500">/100</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
            Risk Index
          </span>
        </div>
      </div>

      {/* Threshold Marks */}
      <div className="w-full flex justify-between px-6 text-[10px] text-slate-500 font-mono mt-1">
        <span className="text-emerald-400">0 (Safe)</span>
        <span className="text-amber-400">50</span>
        <span className="text-rose-400">100 (Critical)</span>
      </div>

      {/* Subtext Velocity */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 w-full flex items-center justify-center gap-1.5 text-center text-xs text-slate-300">
        {clampedScore < 30 ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : clampedScore < 70 ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )}
        <span className="font-medium text-slate-300 text-[11px]">{probabilityText}</span>
      </div>
    </div>
  );
};
