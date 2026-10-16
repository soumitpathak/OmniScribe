import React, { useState } from 'react';
import { RecommendedAction } from '../types/compliance';
import { CheckSquare, Square, ArrowRightCircle, FileCheck2, Building, ShieldCheck } from 'lucide-react';

interface ActionItemsCardProps {
  actions: string[];
  actionDetails: RecommendedAction[];
}

export const ActionItemsCard: React.FC<ActionItemsCardProps> = ({
  actions,
  actionDetails,
}) => {
  // Setup state for interactive checkboxes
  const initialItems: RecommendedAction[] =
    actionDetails && actionDetails.length > 0
      ? actionDetails.map((a, i) => ({ ...a, id: a.id || `act-${i}`, completed: false }))
      : actions.map((act, i) => ({
          id: `act-${i}`,
          priority: act.toLowerCase().includes('urgent') || act.toLowerCase().includes('immediately')
            ? 'URGENT'
            : act.toLowerCase().includes('obtain') || act.toLowerCase().includes('submit')
            ? 'REQUIRED'
            : 'ADVISORY',
          action: act,
          target_agency: 'Customs & Border Control',
          required_document: 'Customs Amendment Notice',
          completed: false,
        }));

  const [items, setItems] = useState<RecommendedAction[]>(initialItems);

  const toggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightCircle className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Autonomous Recommended Action Items & Remediation Checklist ({items.length})
          </h3>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Remediated:</span>
            <span className={`font-bold ${completedCount === items.length ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {completedCount}/{items.length}
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        {items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No pending action items. Consignment is cleared for customs processing.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              let priorityColor = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
              if (item.priority === 'URGENT') {
                priorityColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
              } else if (item.priority === 'REQUIRED') {
                priorityColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => toggleComplete(item.id || '')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                    item.completed
                      ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Interactive Checkbox */}
                  <div className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors">
                    {item.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600 hover:text-slate-400 shrink-0" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${priorityColor}`}>
                        {item.priority}
                      </span>
                      {item.completed && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          ✓ Marked Resolved
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs font-semibold mt-1 leading-relaxed ${
                        item.completed ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {item.action}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      {item.target_agency && (
                        <span className="flex items-center gap-1 font-mono text-slate-300">
                          <Building className="w-3 h-3 text-slate-500" />
                          Agency: <strong className="text-slate-200">{item.target_agency}</strong>
                        </span>
                      )}
                      {item.required_document && (
                        <span className="flex items-center gap-1 font-mono text-cyan-400">
                          <FileCheck2 className="w-3 h-3 text-cyan-400" />
                          Doc: {item.required_document}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
