import { BookOpen, History, Hash, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { OmniScribeLogo } from './OmniScribeLogo';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activePage: 'dashboard' | 'initiate_audit';
  onNavigate: (page: 'dashboard' | 'initiate_audit') => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenArchitecture?: () => void;
  onOpenHSLookup: () => void;
  onOpenSettings?: () => void;
  historyCount: number;
  selectedCountry?: string;
  onSelectCountry?: (c: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  onOpenRules,
  onOpenHistory,
  onOpenHSLookup,
  historyCount,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <OmniScribeLogo size="md" showSubtitle={false} />
          <span className="hidden xl:inline-block text-xs text-slate-500 font-mono pl-2 border-l border-slate-800">
            Compliance Workspace
          </span>
        </div>

        {/* Primary Page Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800/80">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePage === 'dashboard'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60 font-medium'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
            {historyCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  activePage === 'dashboard'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-850 text-slate-400'
                }`}
              >
                {historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('initiate_audit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePage === 'initiate_audit'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60 font-medium'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Initiate Audit</span>
          </button>
        </nav>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* HS Code Lookup Helper Button */}
          <button
            onClick={onOpenHSLookup}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-colors shadow-sm cursor-pointer"
            title="Harmonized Tariff (HS) Code Lookup"
          >
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">HS Lookup</span>
          </button>

          {/* Rules Explorer Button */}
          <button
            onClick={onOpenRules}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm cursor-pointer"
            title="Customs Rules & Frameworks"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors relative shadow-sm cursor-pointer"
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

          {/* User Account & Sign Out */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center">
                  {user.avatarInitials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <span className="text-xs font-semibold text-white block max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block max-w-[120px] truncate">
                    {user.role.split(' ')[0]}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                title="Sign Out / Back to Home"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
