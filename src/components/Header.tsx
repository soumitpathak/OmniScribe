import React from 'react';
import { ShieldCheck, BookOpen, History, Cpu, FileCode2, Globe, Hash } from 'lucide-react';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenArchitecture: () => void;
  onOpenHSLookup: () => void;
  historyCount: number;
  selectedCountry: string;
  onSelectCountry: (c: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRules,
  onOpenHistory,
  onOpenArchitecture,
  onOpenHSLookup,
  historyCount,
  selectedCountry,
  onSelectCountry,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-500/20 text-white font-bold">
            <ShieldCheck className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-mono">
                Omni<span className="text-emerald-400">Scribe</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                v1.0 Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous Cross-Border Logistics Regulatory Compliance & Continuous Audit
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Destination Quick Selector */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Destination:</span>
            <select
              value={selectedCountry}
              onChange={(e) => onSelectCountry(e.target.value)}
              className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value="USA" className="bg-slate-900 text-white">USA (CBP)</option>
              <option value="EU" className="bg-slate-900 text-white">EU (TARIC/ICS2)</option>
              <option value="Singapore" className="bg-slate-900 text-white">Singapore (TradeNet)</option>
              <option value="UAE" className="bg-slate-900 text-white">UAE (Mirsal II)</option>
              <option value="UK" className="bg-slate-900 text-white">UK (HMRC CDS)</option>
              <option value="Japan" className="bg-slate-900 text-white">Japan (NACCS)</option>
              <option value="Australia" className="bg-slate-900 text-white">Australia (ABF)</option>
            </select>
          </div>

          {/* Model Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700 text-xs text-slate-300 font-mono">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Model:</span>
            <span className="text-cyan-300 font-medium">gemini-3.8-flash</span>
          </div>

          {/* HS Code Lookup Helper Button */}
          <button
            onClick={onOpenHSLookup}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-colors shadow-sm cursor-pointer"
            title="Harmonized Tariff (HS) Code Lookup"
          >
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">HS Code Lookup</span>
          </button>

          {/* Rules Explorer Button */}
          <button
            onClick={onOpenRules}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
            title="Customs Rules & Frameworks"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Customs Rules</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors relative shadow-sm"
            title="Audit History"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Audits</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {historyCount}
              </span>
            )}
          </button>

          {/* Cloud Run / API Architecture */}
          <button
            onClick={onOpenArchitecture}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 text-xs font-medium text-emerald-300 transition-colors"
            title="FastAPI & Cloud Run Architecture"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Architecture</span>
          </button>
        </div>
      </div>
    </header>
  );
};
