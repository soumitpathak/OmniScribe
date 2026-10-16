import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  BookOpen,
  History,
  Cpu,
  FileCode2,
  Globe,
  Hash,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { user, loading, openLoginModal, logout, roleTitle } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <span className="hidden sm:inline">HS Lookup</span>
          </button>

          {/* Rules Explorer Button */}
          <button
            onClick={onOpenRules}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm cursor-pointer"
            title="Customs Rules & Frameworks"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors relative shadow-sm cursor-pointer"
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
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 text-xs font-medium text-emerald-300 transition-colors cursor-pointer"
            title="Architecture & Specs"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Arch</span>
          </button>

          {/* Auth Section */}
          <div className="relative pl-1 border-l border-slate-800" ref={menuRef}>
            {loading ? (
              <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors cursor-pointer group"
                  aria-expanded={isUserMenuOpen}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Auditor'}
                      className="w-6 h-6 rounded-lg object-cover border border-emerald-400/30"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                      {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium max-w-[90px] sm:max-w-[120px] truncate text-white">
                    {user.displayName?.split(' ')[0] || 'Auditor'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="p-3 border-b border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white truncate">
                          {user.displayName || 'Customs Inspector'}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                        <Cloud className="w-3 h-3 text-emerald-400" />
                        <span>Cloud Firestore Sync</span>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openLoginModal();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-left"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Auditor Profile & Badges</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors cursor-pointer text-left mt-1"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
