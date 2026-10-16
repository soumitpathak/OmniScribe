import React, { useState } from 'react';
import {
  X,
  Search,
  Hash,
  Scale,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Filter,
  PlusCircle,
  Building2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { HS_CODES_DATABASE, HSCodeItem } from '../data/hsCodesDatabase';
import { useToast } from '../context/ToastContext';

interface HSCodeLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCode?: (code: string, description: string) => void;
}

export const HSCodeLookupModal: React.FC<HSCodeLookupModalProps> = ({
  isOpen,
  onClose,
  onApplyCode,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    'ALL',
    'Electronics',
    'Chemicals & Pharma',
    'Agriculture & Food',
    'Metals & CBAM',
    'Automotive & Aerospace',
  ];

  const filteredCodes = HS_CODES_DATABASE.filter((item) => {
    // Category match
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    // Risk match
    if (selectedRisk !== 'ALL' && item.riskTier !== selectedRisk) {
      return false;
    }
    // Search match
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const codeMatch = item.code.toLowerCase().includes(term);
      const titleMatch = item.title.toLowerCase().includes(term);
      const descMatch = item.description.toLowerCase().includes(term);
      const flagMatch = item.regulatoryFlags.some((f) => f.toLowerCase().includes(term));
      const agencyMatch = item.agencies.some((a) => a.toLowerCase().includes(term));
      return codeMatch || titleMatch || descMatch || flagMatch || agencyMatch;
    }
    return true;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info('HS Code Copied', `Copied ${code} to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApply = (item: HSCodeItem) => {
    if (onApplyCode) {
      onApplyCode(item.code, item.title);
      toast.success('HS Code Applied', `Inserted ${item.code} into active compliance docket.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Harmonized Tariff (HS) Code Explorer
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  WCO 2026 Index
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Search global customs commodity codes, MFN tariff schedules, and statutory import restrictions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by commodity name, HS code prefix (e.g. 8507, 8517), or keyword (lithium, coffee, dual-use, CBAM)..."
              className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white font-mono px-1.5 py-0.5 rounded hover:bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories & Risk Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-500" />
                Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Risk:
              </span>
              {['ALL', 'LOW', 'MODERATE', 'CRITICAL'].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setSelectedRisk(risk)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                    selectedRisk === risk
                      ? risk === 'CRITICAL'
                        ? 'bg-rose-500 text-white'
                        : risk === 'MODERATE'
                        ? 'bg-amber-500 text-slate-950'
                        : risk === 'LOW'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-700 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 bg-slate-950">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-1">
            <span>Showing {filteredCodes.length} Classified Commodity Headings</span>
            <span className="text-slate-500">Click "Apply to Manifest" or "Copy Code" to use</span>
          </div>

          {filteredCodes.map((item) => {
            let riskBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            if (item.riskTier === 'CRITICAL') {
              riskBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            } else if (item.riskTier === 'MODERATE') {
              riskBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            }

            return (
              <div
                key={item.code}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3 shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                        {item.code}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {item.chapter}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono uppercase ${riskBadgeColor}`}>
                        {item.riskTier} RISK
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white pt-1">
                      {item.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                      title="Copy HS Code"
                    >
                      {copiedCode === item.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onApplyCode && (
                      <button
                        type="button"
                        onClick={() => handleApply(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        title="Insert into active manifest docket"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Apply to Manifest</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {item.description}
                </p>

                {/* Tariff & Regulatory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Duty Rate & Agencies */}
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-400 text-[11px]">Standard MFN Duty:</span>
                      <strong className="text-emerald-400">{item.mfnDutyRate}</strong>
                    </div>

                    <div className="flex items-center justify-between font-mono pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 text-[11px]">Governing Agencies:</span>
                      <span className="text-slate-200">{item.agencies.join(', ')}</span>
                    </div>
                  </div>

                  {/* Regulatory Flags */}
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                      Customs Compliance Flags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.regulatoryFlags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Statutory Requirement Note */}
                <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 font-mono flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0 mt-0.5">▪</span>
                  <span>
                    <strong className="text-slate-300">Statutory Notice:</strong> {item.importRequirements}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredCodes.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-xs">
              <Hash className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No commodity codes found</p>
              <p className="mt-1">Try a different keyword like "battery", "coffee", "transceiver", or "steel".</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Harmonized Commodity Description & Coding System (HS 2026 Edition)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
