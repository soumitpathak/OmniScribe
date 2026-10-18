import React, { useState, useMemo } from 'react';
import { AuditResponse } from '../types/compliance';
import { useToast } from '../context/ToastContext';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Send,
  ArrowRight,
  ShieldCheck,
  Download,
  ExternalLink,
  ChevronRight,
  Activity,
  UserCheck,
  Building2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export type MilestoneStageName =
  | 'Initial Filing'
  | 'Compliance Hold'
  | 'Review Requested'
  | 'Cleared';

export type MilestoneStageStatus = 'COMPLETED' | 'ACTIVE_HOLD' | 'IN_PROGRESS' | 'PENDING';

export interface MilestoneEventItem {
  id: string;
  name: MilestoneStageName;
  status: MilestoneStageStatus;
  timestamp: string;
  actor: string;
  summary: string;
  details: string;
  statutoryReference?: string;
  actionRequired?: string;
  slaWindow?: string;
}

interface HighRiskAuditMilestoneTimelineProps {
  history: AuditResponse[];
  onSelectAudit: (audit: AuditResponse) => void;
  onUpdateAudit?: (updatedAudit: AuditResponse) => void;
}

/**
 * Computes deterministic milestone lifecycle events for any high-risk audit,
 * allowing live local status transition updates.
 */
function buildMilestonesForAudit(audit: AuditResponse, liveStageOverride?: MilestoneStageName): MilestoneEventItem[] {
  const isRejected = audit.audit_status === 'REJECTED';
  const isFlagged = audit.audit_status === 'FLAGGED';
  const isApproved = audit.audit_status === 'APPROVED';

  // Determine current active milestone stage
  let activeStage: MilestoneStageName = 'Compliance Hold';
  if (liveStageOverride) {
    activeStage = liveStageOverride;
  } else if (isApproved) {
    activeStage = 'Cleared';
  } else if (isRejected) {
    activeStage = 'Compliance Hold';
  } else if (isFlagged) {
    activeStage = 'Compliance Hold';
  }

  const baseTime = new Date(audit.timestamp || Date.now()).getTime();
  const formatTime = (offsetMs: number) => new Date(baseTime + offsetMs).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const discrepancies = audit.compliance_discrepancies || [];
  const primaryFinding = discrepancies[0] || 'Regulatory classification review required.';
  const docRef = audit.extracted_entities?.document_number || audit.audit_id;

  // 1. Initial Filing
  const initialFiling: MilestoneEventItem = {
    id: `${audit.audit_id}-milestone-1`,
    name: 'Initial Filing',
    status: 'COMPLETED',
    timestamp: formatTime(0),
    actor: 'Automated Carrier EDI Ingestion & OmniScribe OCR Agent',
    summary: `Commercial entry dossier filed for ${audit.destination_country} border clearance.`,
    details: `Ingested ${audit.extracted_entities?.document_type || 'Commercial Invoice'} #${docRef} declaring ${audit.extracted_entities?.items?.length || 1} line item(s) valued at ${audit.extracted_entities?.currency || 'USD'} ${Number(audit.extracted_entities?.total_declared_value || 0).toLocaleString()}.`,
    statutoryReference: audit.regulatory_framework,
    slaWindow: 'Completed in 1.4s',
  };

  // 2. Compliance Hold
  let holdStatus: MilestoneStageStatus = 'ACTIVE_HOLD';
  if (activeStage === 'Review Requested' || activeStage === 'Cleared') {
    holdStatus = 'COMPLETED';
  }

  const complianceHold: MilestoneEventItem = {
    id: `${audit.audit_id}-milestone-2`,
    name: 'Compliance Hold',
    status: holdStatus,
    timestamp: formatTime(1000 * 60 * 2),
    actor: `${audit.destination_country} Customs Automated Targeting System (ATS)`,
    summary: `Statutory hold placed due to audit risk score (${audit.risk_score}/100) and regulatory discrepancy.`,
    details: `Entry flagged: ${primaryFinding} Cargo placed on administrative hold at port of entry.`,
    statutoryReference: audit.discrepancy_details?.[0]?.regulation_ref || 'Customs Enforcement Act',
    actionRequired: audit.recommended_actions?.[0] || 'Upload mandatory statutory safety / tariff certificates.',
    slaWindow: 'SLA: 24h before vessel discharge',
  };

  // 3. Review Requested
  let reviewStatus: MilestoneStageStatus = 'PENDING';
  if (activeStage === 'Review Requested') {
    reviewStatus = 'IN_PROGRESS';
  } else if (activeStage === 'Cleared') {
    reviewStatus = 'COMPLETED';
  }

  const reviewRequested: MilestoneEventItem = {
    id: `${audit.audit_id}-milestone-3`,
    name: 'Review Requested',
    status: reviewStatus,
    timestamp: activeStage === 'Review Requested' || activeStage === 'Cleared'
      ? formatTime(1000 * 60 * 18)
      : 'Pending Broker Submission',
    actor: 'Lead Customs Broker & Regulatory Compliance Officer',
    summary: activeStage === 'Review Requested' || activeStage === 'Cleared'
      ? `Formal regulatory dispute & corrective dossier submitted for official review.`
      : `Broker submission required to petition for compliance hold release.`,
    details: activeStage === 'Review Requested' || activeStage === 'Cleared'
      ? `Uploaded corrective declarations and statutory certificate evidence to customs portal.`
      : `Awaiting consignor upload of corrective documentation to trigger PGA review.`,
    statutoryReference: `${audit.destination_country} Customs Administrative Petition Code`,
    slaWindow: 'SLA: 4-hour expedited PGA response',
  };

  // 4. Cleared
  let clearedStatus: MilestoneStageStatus = 'PENDING';
  if (activeStage === 'Cleared') {
    clearedStatus = 'COMPLETED';
  }

  const cleared: MilestoneEventItem = {
    id: `${audit.audit_id}-milestone-4`,
    name: 'Cleared',
    status: clearedStatus,
    timestamp: activeStage === 'Cleared'
      ? formatTime(1000 * 60 * 45)
      : 'Awaiting Final Release Order',
    actor: `${audit.destination_country} Border Protection Directorate / Customs Officer`,
    summary: activeStage === 'Cleared'
      ? `Green-Channel Customs Clearance Granted. Official release permit issued.`
      : `Cargo will clear once partner government agency verifies uploaded corrective evidence.`,
    details: activeStage === 'Cleared'
      ? `Electronic release token issued (CUS-REL-${audit.audit_id.slice(-6)}). Cargo cleared for domestic release.`
      : `Consignment remains held until mandatory compliance findings are formally resolved.`,
    statutoryReference: 'Automated Commercial Environment (ACE) Release 1C',
    slaWindow: 'Final Statutory Release',
  };

  return [initialFiling, complianceHold, reviewRequested, cleared];
}

export const HighRiskAuditMilestoneTimeline: React.FC<HighRiskAuditMilestoneTimelineProps> = ({
  history,
  onSelectAudit,
  onUpdateAudit,
}) => {
  const toast = useToast();

  // Track live stage override for audits modified during session
  const [stageOverrides, setStageOverrides] = useState<Record<string, MilestoneStageName>>({});

  // Filter high-risk audits (score >= 50, critical, flagged, or rejected)
  const highRiskAudits = useMemo(() => {
    const filtered = history.filter(
      (a) => a.risk_score >= 50 || a.risk_level === 'CRITICAL' || a.audit_status === 'FLAGGED' || a.audit_status === 'REJECTED'
    );
    // If no high-risk audits in history, fallback to all history items
    return filtered.length > 0 ? filtered : history;
  }, [history]);

  // Selected audit ID
  const [selectedAuditId, setSelectedAuditId] = useState<string>(() => {
    return highRiskAudits[0]?.audit_id || '';
  });

  // Keep selectedAuditId valid if history updates
  const activeAudit = useMemo(() => {
    const found = highRiskAudits.find((a) => a.audit_id === selectedAuditId);
    return found || highRiskAudits[0] || null;
  }, [highRiskAudits, selectedAuditId]);

  // Milestone stages for the currently active audit
  const currentStageOverride = activeAudit ? stageOverrides[activeAudit.audit_id] : undefined;
  const milestones = useMemo(() => {
    if (!activeAudit) return [];
    return buildMilestonesForAudit(activeAudit, currentStageOverride);
  }, [activeAudit, currentStageOverride]);

  // Active selected milestone card
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number>(1); // Default to Compliance Hold

  // Filter state for audits
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HOLD' | 'REVIEW' | 'CLEARED'>('ALL');

  // Filtered high-risk audits according to status filter
  const displayedAudits = useMemo(() => {
    if (statusFilter === 'ALL') return highRiskAudits;
    return highRiskAudits.filter((audit) => {
      const stage = stageOverrides[audit.audit_id] || (audit.audit_status === 'APPROVED' ? 'Cleared' : 'Compliance Hold');
      if (statusFilter === 'HOLD') return stage === 'Compliance Hold';
      if (statusFilter === 'REVIEW') return stage === 'Review Requested';
      if (statusFilter === 'CLEARED') return stage === 'Cleared';
      return true;
    });
  }, [highRiskAudits, statusFilter, stageOverrides]);

  // Handler: Request Review for active audit
  const handleRequestReview = () => {
    if (!activeAudit) return;
    const auditId = activeAudit.audit_id;
    setStageOverrides((prev) => ({ ...prev, [auditId]: 'Review Requested' }));
    setSelectedMilestoneIndex(2); // Switch view to Review Requested
    toast.info(
      'Regulatory Review Requested',
      `Expedited review petition submitted to ${activeAudit.destination_country} customs for ${auditId}.`
    );
  };

  // Handler: Authorize & Clear Consignment
  const handleClearConsignment = () => {
    if (!activeAudit) return;
    const auditId = activeAudit.audit_id;
    setStageOverrides((prev) => ({ ...prev, [auditId]: 'Cleared' }));
    setSelectedMilestoneIndex(3); // Switch view to Cleared

    if (onUpdateAudit) {
      const updated: AuditResponse = {
        ...activeAudit,
        audit_status: 'APPROVED',
        risk_score: Math.min(25, activeAudit.risk_score),
        risk_level: 'LOW',
      };
      onUpdateAudit(updated);
    }

    toast.success(
      'Consignment Cleared for Entry!',
      `Official release token issued. Compliance hold on ${auditId} has been successfully cleared.`
    );
  };

  // Download milestone chain of custody
  const handleDownloadLog = () => {
    if (!activeAudit) return;
    const lines = [
      `================================================================================`,
      `OMNISCRIBE - HIGH-RISK CONSIGNMENT MILESTONE CHAIN-OF-CUSTODY AUDIT LOG`,
      `================================================================================`,
      `AUDIT ID:            ${activeAudit.audit_id}`,
      `DESTINATION:         ${activeAudit.destination_country}`,
      `RISK SCORE:          ${activeAudit.risk_score} / 100 (${activeAudit.risk_level})`,
      `FINAL STATUS:        ${activeAudit.audit_status}`,
      `REGULATORY AGENCY:   ${activeAudit.regulatory_framework}`,
      `GENERATED TIMESTAMP: ${new Date().toISOString()}`,
      `--------------------------------------------------------------------------------`,
      `MILESTONE LIFECYCLE EVENTS:`,
      ...milestones.map(
        (m, i) =>
          `[Milestone ${i + 1}] ${m.name.toUpperCase()} - STATUS: [${m.status}]\n` +
          `  Timestamp:  ${m.timestamp}\n` +
          `  Actor:      ${m.actor}\n` +
          `  Summary:    ${m.summary}\n` +
          `  Details:    ${m.details}\n` +
          (m.statutoryReference ? `  Regulation: ${m.statutoryReference}\n` : '') +
          (m.actionRequired ? `  Action Req: ${m.actionRequired}\n` : '')
      ),
      `================================================================================`,
    ];
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `Milestone_Log_${activeAudit.audit_id}.txt`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success('Milestone Log Exported', `Saved chain-of-custody log for ${activeAudit.audit_id}`);
  };

  if (!activeAudit) {
    return null;
  }

  const selectedMilestone = milestones[selectedMilestoneIndex] || milestones[0];

  // Quick KPI counts
  const holdCount = highRiskAudits.filter((a) => {
    const s = stageOverrides[a.audit_id] || (a.audit_status === 'APPROVED' ? 'Cleared' : 'Compliance Hold');
    return s === 'Compliance Hold';
  }).length;

  const reviewCount = highRiskAudits.filter((a) => {
    const s = stageOverrides[a.audit_id] || (a.audit_status === 'APPROVED' ? 'Cleared' : 'Compliance Hold');
    return s === 'Review Requested';
  }).length;

  const clearedCount = highRiskAudits.filter((a) => {
    const s = stageOverrides[a.audit_id] || (a.audit_status === 'APPROVED' ? 'Cleared' : 'Compliance Hold');
    return s === 'Cleared';
  }).length;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              High-Risk Milestone Tracker
            </span>
            <span className="text-xs font-mono text-slate-400">
              Audit Lifecycle: <strong className="text-white">Initial Filing ➔ Hold ➔ Review ➔ Cleared</strong>
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400" />
            <span>High-Risk Consignment Milestone Timeline</span>
          </h3>

          <p className="text-xs text-slate-300">
            Real-time stage tracking for consignments held under regulatory scrutiny. Monitor regulatory holds, petition for expedited reviews, and track border release orders.
          </p>
        </div>

        {/* Milestone Status Summary Counters */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-300 font-bold">{holdCount} On Hold</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300 font-bold">{reviewCount} In Review</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-300 font-bold">{clearedCount} Cleared</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Audit Carousel */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Select Consignment:</span>
            <div className="flex gap-1.5">
              {(['ALL', 'HOLD', 'REVIEW', 'CLEARED'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Showing {displayedAudits.length} of {highRiskAudits.length} High-Risk Audits
          </span>
        </div>

        {/* Consignment Selection Pill Carousel */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {displayedAudits.map((item) => {
            const isSelected = item.audit_id === activeAudit.audit_id;
            const currentStage = stageOverrides[item.audit_id] || (item.audit_status === 'APPROVED' ? 'Cleared' : 'Compliance Hold');

            return (
              <button
                key={item.audit_id}
                type="button"
                onClick={() => {
                  setSelectedAuditId(item.audit_id);
                  // Default selected milestone based on active stage
                  if (currentStage === 'Initial Filing') setSelectedMilestoneIndex(0);
                  else if (currentStage === 'Compliance Hold') setSelectedMilestoneIndex(1);
                  else if (currentStage === 'Review Requested') setSelectedMilestoneIndex(2);
                  else setSelectedMilestoneIndex(3);
                }}
                className={`p-3 rounded-2xl border text-left shrink-0 transition-all cursor-pointer min-w-[220px] ${
                  isSelected
                    ? 'bg-slate-800/90 border-rose-500/50 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-white truncate max-w-[130px]">
                    {item.audit_id}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded ${
                      item.risk_score >= 80
                        ? 'bg-rose-500/20 text-rose-300'
                        : item.risk_score >= 50
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {item.risk_score}/100
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 truncate mb-1">
                  {item.extracted_entities?.document_number || item.destination_country} • {item.destination_country}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Current Stage:</span>
                  <span
                    className={`font-bold ${
                      currentStage === 'Compliance Hold'
                        ? 'text-rose-400'
                        : currentStage === 'Review Requested'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {currentStage}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Visual Stepper Timeline */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-6">
        {/* Selected Audit Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono">{activeAudit.audit_id}</span>
              <span className="text-xs font-mono text-cyan-400">({activeAudit.destination_country})</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {activeAudit.extracted_entities?.document_type || 'Commercial Invoice'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Shipper: <strong className="text-slate-300">{activeAudit.extracted_entities?.shipper_name || 'Shipper'}</strong> ➔ Consignee: <strong className="text-slate-300">{activeAudit.extracted_entities?.consignee_name || 'Consignee'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelectAudit(activeAudit)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <span>Inspect Full Report</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDownloadLog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors cursor-pointer"
              title="Download Milestone Chain-of-Custody Log"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Log</span>
            </button>
          </div>
        </div>

        {/* --- 4-STAGE CONNECTED STEPPER VISUALIZATION --- */}
        <div className="relative pt-2 pb-4">
          {/* Progress Connecting Line */}
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-1 bg-slate-800 z-0">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-rose-500 to-amber-500 transition-all duration-700"
              style={{
                width:
                  selectedMilestoneIndex === 0
                    ? '0%'
                    : selectedMilestoneIndex === 1
                    ? '33%'
                    : selectedMilestoneIndex === 2
                    ? '66%'
                    : '100%',
              }}
            />
          </div>

          {/* Stepper Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            {milestones.map((milestone, idx) => {
              const isSelected = selectedMilestoneIndex === idx;

              let nodeBg = 'bg-slate-800 text-slate-400 border-slate-700';
              let badgeColor = 'bg-slate-800 text-slate-400';

              if (milestone.status === 'COMPLETED') {
                nodeBg = 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/50';
                badgeColor = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
              } else if (milestone.status === 'ACTIVE_HOLD') {
                nodeBg = 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-950/50';
                badgeColor = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
              } else if (milestone.status === 'IN_PROGRESS') {
                nodeBg = 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-950/50';
                badgeColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
              }

              return (
                <button
                  key={milestone.id}
                  type="button"
                  onClick={() => setSelectedMilestoneIndex(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/30 shadow-xl'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs border transition-all ${nodeBg}`}
                    >
                      {milestone.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : milestone.status === 'ACTIVE_HOLD' ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : milestone.status === 'IN_PROGRESS' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>0{idx + 1}</span>
                      )}
                    </div>

                    <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${badgeColor}`}>
                      {milestone.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">{milestone.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400 block truncate">
                      {milestone.timestamp}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Stage {idx + 1}/4</span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Milestone Event Dossier Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  selectedMilestone.status === 'COMPLETED'
                    ? 'bg-emerald-400'
                    : selectedMilestone.status === 'ACTIVE_HOLD'
                    ? 'bg-rose-500 animate-ping'
                    : selectedMilestone.status === 'IN_PROGRESS'
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
              <h4 className="text-base font-bold text-white">
                Milestone Event: {selectedMilestone.name}
              </h4>
              <span className="text-xs font-mono text-slate-400">
                • {selectedMilestone.timestamp}
              </span>
            </div>

            <span className="text-xs font-mono text-cyan-400 self-start sm:self-auto">
              Responsible Actor: <strong className="text-white">{selectedMilestone.actor}</strong>
            </span>
          </div>

          {/* Event Content Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Event Operational Summary
              </span>
              <p className="text-slate-200 leading-relaxed font-sans">{selectedMilestone.summary}</p>
              <div className="pt-2 text-slate-400 font-mono text-[11px]">
                {selectedMilestone.details}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Statutory Citation & Protocol
                </span>
                <span className="text-amber-300 font-mono text-xs block">
                  {selectedMilestone.statutoryReference || 'Standard Customs Procedures'}
                </span>

                {selectedMilestone.actionRequired && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] font-mono">
                    <strong>Mandatory Action:</strong> {selectedMilestone.actionRequired}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Enforcement Window:</span>
                <span className="text-white font-bold">{selectedMilestone.slaWindow || 'Within 24 Hours'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Milestone Action Bar */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono">
              Consignment Reference: <strong className="text-white">{activeAudit.audit_id}</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* If on hold: Button to Request Review */}
              {selectedMilestone.name === 'Compliance Hold' && (
                <button
                  type="button"
                  onClick={handleRequestReview}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Expedited Review</span>
                </button>
              )}

              {/* If in review or on hold: Button to Authorize & Clear */}
              {(selectedMilestone.name === 'Compliance Hold' || selectedMilestone.name === 'Review Requested') && (
                <button
                  type="button"
                  onClick={handleClearConsignment}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Resolve & Clear Consignment</span>
                </button>
              )}

              {selectedMilestone.name === 'Cleared' && (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Official Clearance Granted (Port Release Order Active)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
