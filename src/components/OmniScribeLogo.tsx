import React from 'react';

interface OmniScribeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const OmniScribeLogo: React.FC<OmniScribeLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  iconOnly = false,
}) => {
  // Dimension tokens
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', sub: 'text-[9px]', gap: 'gap-2' },
    md: { icon: 38, text: 'text-xl', sub: 'text-[11px]', gap: 'gap-3' },
    lg: { icon: 48, text: 'text-2xl', sub: 'text-xs', gap: 'gap-3.5' },
    xl: { icon: 58, text: 'text-3xl', sub: 'text-sm', gap: 'gap-4' },
  };

  const { icon, text, sub, gap } = sizeMap[size];

  return (
    <div className={`flex items-center ${gap} select-none ${className}`}>
      {/* Geometric Vector Emblem */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-emerald-500/15"
        style={{ width: icon, height: icon }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="omniGrad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="shieldFill" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="accentBeam" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {/* Hexagonal Shield Background */}
          <path
            d="M32 4L54 14V32C54 44.8 44.6 56.6 32 60C19.4 56.6 10 44.8 10 32V14L32 4Z"
            fill="url(#shieldFill)"
            stroke="url(#omniGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Internal Grid Lines (Logistics Container & Inspection Matrix) */}
          <path
            d="M20 25H44M20 34H44M20 43H36"
            stroke="#1E293B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Scribe Vector: Stylized S-curve & Checkmark Vector */}
          <path
            d="M22 31L29 38L44 20"
            stroke="url(#accentBeam)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Autonomous Pulse Beacon */}
          <circle cx="44" cy="20" r="3" fill="#34D399" />
          <circle cx="44" cy="20" r="6" stroke="#10B981" strokeWidth="1" opacity="0.4" />
        </svg>
      </div>

      {/* Brand Wordmark & Subtitle */}
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${text} font-extrabold tracking-tight text-white font-mono`}>
              Omni<span className="text-emerald-400">Scribe</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400/90 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
              AGENT
            </span>
          </div>
          {showSubtitle && (
            <span className={`${sub} text-slate-400 font-sans tracking-normal font-normal mt-0.5`}>
              Logistics Regulatory Compliance
            </span>
          )}
        </div>
      )}
    </div>
  );
};
