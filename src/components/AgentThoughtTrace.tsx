import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Bot, Sparkles } from 'lucide-react';

interface AgentThoughtTraceProps {
  traces: string[];
}

export const AgentThoughtTrace: React.FC<AgentThoughtTraceProps> = ({ traces }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!traces || traces.length === 0) return null;

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden font-mono text-xs">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3.5 bg-slate-900/80 hover:bg-slate-900 border-b border-slate-800 flex items-center justify-between text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">
            Autonomous Agent Reasoning Trail & Verification Trace
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {traces.length} Steps Logged
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Terminal lines */}
      {isExpanded && (
        <div className="p-4 space-y-2 bg-slate-950 text-slate-300 max-h-60 overflow-y-auto">
          {traces.map((trace, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-slate-600 select-none text-[11px]">[{String(idx + 1).padStart(2, '0')}]</span>
              <span className="text-emerald-500 font-bold select-none">❯</span>
              <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                {trace}
              </p>
            </div>
          ))}
          <div className="pt-2 flex items-center gap-2 text-emerald-400/80 text-[11px]">
            <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-500 italic">Audit loop execution finalized. Result committed to report ledger.</span>
          </div>
        </div>
      )}
    </div>
  );
};
