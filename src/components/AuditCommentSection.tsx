import React, { useState, useEffect, useMemo } from 'react';
import { AuditResponse, AuditComment, CommentReply, CommentCategory, CommentPriority, ComplianceOfficer } from '../types/compliance';
import { useToast } from '../context/ToastContext';
import {
  MessageSquare,
  Send,
  Pin,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  User,
  Clock,
  Sparkles,
  Search,
  Filter,
  CornerDownRight,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Tag,
  Flame,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface AuditCommentSectionProps {
  audit: AuditResponse;
  className?: string;
  defaultExpanded?: boolean;
}

// Predefined compliance officer roster for quick selection
const COMPLIANCE_OFFICERS: ComplianceOfficer[] = [
  {
    id: 'officer_sarah',
    name: 'Sarah Chen',
    role: 'Chief Compliance Officer',
    badge: 'Tier 3 / AEO Lead',
    avatarColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'officer_marcus',
    name: 'Marcus Vance, LCB',
    role: 'Senior Customs Broker (CBP #48912)',
    badge: 'Licensed Broker',
    avatarColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'officer_elena',
    name: 'Elena Rostova, JD',
    role: 'Trade Sanctions & Regulatory Counsel',
    badge: 'Legal Counsel',
    avatarColor: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'officer_devin',
    name: 'Devin Brooks',
    role: 'Import Operations Lead',
    badge: 'Logistics Ops',
    avatarColor: 'from-purple-500 to-indigo-600',
  },
];

// Quick note templates for fast compliance entries
const QUICK_NOTE_TEMPLATES = [
  {
    label: 'UN 3480 Test Summary Hold',
    category: 'RISK_FLAG' as CommentCategory,
    priority: 'HIGH' as CommentPriority,
    text: 'Clearance hold placed: Requires UN Manual of Tests subsection 38.3 test summary and MSDS verification before customs entry.',
    tags: ['#UN3480', '#DangerousGoods', '#ClearanceHold'],
  },
  {
    label: 'Section 301 Tariff Review',
    category: 'BROKER_NOTE' as CommentCategory,
    priority: 'MEDIUM' as CommentPriority,
    text: 'Requesting supplier commercial invoice revision to verify Chapter 99 Section 301 ad valorem duty exclusions.',
    tags: ['#Section301', '#HTS-Audit', '#DutyRemediation'],
  },
  {
    label: 'OFAC / Sanctions Clean',
    category: 'LEGAL_REGULATORY' as CommentCategory,
    priority: 'LOW' as CommentPriority,
    text: 'Consignee and notify party passed OFAC SDN screening. No prohibited parties identified on US/EU denied entity registers.',
    tags: ['#OFAC', '#SanctionsCheck', '#DeniedParty'],
  },
  {
    label: 'CPOA / Power of Attorney',
    category: 'BROKER_NOTE' as CommentCategory,
    priority: 'HIGH' as CommentPriority,
    text: 'Incoterms DDP specified but foreign seller lacks US resident agent. Customs Power of Attorney (CPOA) required.',
    tags: ['#Incoterms-DDP', '#CPOA', '#ImporterOfRecord'],
  },
  {
    label: 'Audit Remediation Cleared',
    category: 'RESOLUTION' as CommentCategory,
    priority: 'LOW' as CommentPriority,
    text: 'All missing certificates and invoice item descriptions validated against CBP statutory guidelines. Cleared for automated green-lane filing.',
    tags: ['#RemediationComplete', '#GreenLane', '#BrokerApproved'],
  },
];

export const AuditCommentSection: React.FC<AuditCommentSectionProps> = ({
  audit,
  className = '',
  defaultExpanded = true,
}) => {
  const toast = useToast();
  const [comments, setComments] = useState<AuditComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(defaultExpanded);

  // Active officer selected for composing notes
  const [activeOfficer, setActiveOfficer] = useState<ComplianceOfficer>(COMPLIANCE_OFFICERS[0]);
  const [customOfficerName, setCustomOfficerName] = useState('');
  const [customOfficerRole, setCustomOfficerRole] = useState('');
  const [isCustomOfficer, setIsCustomOfficer] = useState(false);

  // New Note Form State
  const [newCommentContent, setNewCommentContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CommentCategory>('GENERAL');
  const [selectedPriority, setSelectedPriority] = useState<CommentPriority>('MEDIUM');
  const [selectedItemRef, setSelectedItemRef] = useState<string>('');
  const [pinNewComment, setPinNewComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thread Reply State
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Filter and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  // Editing Note State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Storage key for local persistence backup
  const storageKey = `omniscribe_comments_${audit.audit_id}`;

  // Fetch comments from server API with local storage fallback
  useEffect(() => {
    let isMounted = true;

    const fetchComments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/audits/${encodeURIComponent(audit.audit_id)}/comments`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted && Array.isArray(data.comments)) {
            setComments(data.comments);
            localStorage.setItem(storageKey, JSON.stringify(data.comments));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[AuditCommentSection] Server fetch failed, attempting local storage fallback', err);
      }

      // Fallback to local storage if API call fails
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setComments(parsed);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // ignore parse error
      }

      // If nothing found, create an initial contextual comment based on audit status
      if (isMounted) {
        const initialSeed: AuditComment[] = [
          {
            id: `c_seed_${audit.audit_id}_1`,
            audit_id: audit.audit_id,
            author_name: 'Marcus Vance, LCB',
            author_role: 'Senior Customs Broker (US CBP License #48912)',
            author_avatar_color: 'from-amber-500 to-orange-600',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            category: audit.audit_status === 'REJECTED' || audit.risk_score > 60 ? 'RISK_FLAG' : 'BROKER_NOTE',
            priority: audit.risk_score > 60 ? 'HIGH' : 'MEDIUM',
            is_pinned: true,
            is_resolved: false,
            content: `Initiated internal compliance audit review for destination ${audit.destination_country}. Overall risk evaluated at ${audit.risk_score}/100 with ${audit.compliance_discrepancies?.length || 0} statutory discrepancy flag(s). Team review required prior to entry declaration.`,
            tags: ['#InternalAudit', `#${audit.destination_country}`, '#CustomsReview'],
            target_item_ref: audit.compliance_discrepancies?.[0] ? `Flag: ${audit.compliance_discrepancies[0]}` : undefined,
            replies: [
              {
                id: `r_seed_${audit.audit_id}_1`,
                author_name: 'Sarah Chen',
                author_role: 'Chief Compliance Officer',
                author_avatar_color: 'from-emerald-500 to-teal-600',
                created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
                content: 'Dossier marked for collaborative officer review. Please log corrective actions and upload updated certificates before entry filing.',
              },
            ],
          },
        ];
        setComments(initialSeed);
        localStorage.setItem(storageKey, JSON.stringify(initialSeed));
      }

      setLoading(false);
    };

    fetchComments();

    return () => {
      isMounted = false;
    };
  }, [audit.audit_id]);

  // Update local storage when comments change
  const saveCommentsLocally = (updated: AuditComment[]) => {
    setComments(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }
  };

  // Current active officer info
  const currentAuthorName = isCustomOfficer ? (customOfficerName || 'Compliance Officer') : activeOfficer.name;
  const currentAuthorRole = isCustomOfficer ? (customOfficerRole || 'Customs Specialist') : activeOfficer.role;
  const currentAvatarColor = isCustomOfficer ? 'from-purple-500 to-pink-600' : activeOfficer.avatarColor;

  // Handle adding a new root note
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentContent.trim()) {
      toast.warning('Empty Note', 'Please enter internal note text before posting.');
      return;
    }

    setIsSubmitting(true);

    // Extract tags like #UN3480 or #Section301
    const tagMatches = newCommentContent.match(/#[A-Za-z0-9_-]+/g) || [];
    const uniqueTags = Array.from(new Set(tagMatches));

    const payload = {
      audit_id: audit.audit_id,
      author_name: currentAuthorName,
      author_role: currentAuthorRole,
      author_avatar_color: currentAvatarColor,
      category: selectedCategory,
      priority: selectedPriority,
      content: newCommentContent.trim(),
      tags: uniqueTags,
      target_item_ref: selectedItemRef || undefined,
      is_pinned: pinNewComment,
    };

    try {
      const res = await fetch(`/api/audits/${encodeURIComponent(audit.audit_id)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created: AuditComment = await res.json();
        const updated = created.is_pinned ? [created, ...comments] : [...comments, created];
        saveCommentsLocally(updated);
        toast.success('Internal Note Added', `Logged under ${selectedCategory.replace('_', ' ')}`);
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      // Offline fallback
      const localComment: AuditComment = {
        id: `c_${Date.now()}_local`,
        audit_id: audit.audit_id,
        author_name: payload.author_name,
        author_role: payload.author_role,
        author_avatar_color: payload.author_avatar_color,
        created_at: new Date().toISOString(),
        category: payload.category,
        priority: payload.priority,
        is_pinned: payload.is_pinned,
        is_resolved: false,
        content: payload.content,
        tags: payload.tags,
        target_item_ref: payload.target_item_ref,
        replies: [],
      };
      const updated = localComment.is_pinned ? [localComment, ...comments] : [...comments, localComment];
      saveCommentsLocally(updated);
      toast.info('Note Saved Locally', 'Internal note logged into audit dossier.');
    } finally {
      setNewCommentContent('');
      setPinNewComment(false);
      setSelectedItemRef('');
      setIsSubmitting(false);
    }
  };

  // Handle adding threaded reply
  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim()) {
      toast.warning('Empty Reply', 'Please write a reply before posting.');
      return;
    }

    setIsSubmittingReply(true);

    const payload = {
      author_name: currentAuthorName,
      author_role: currentAuthorRole,
      author_avatar_color: currentAvatarColor,
      content: replyContent.trim(),
    };

    try {
      const res = await fetch(
        `/api/audits/${encodeURIComponent(audit.audit_id)}/comments/${encodeURIComponent(commentId)}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const createdReply: CommentReply = await res.json();
        const updated = comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), createdReply],
            };
          }
          return c;
        });
        saveCommentsLocally(updated);
        toast.success('Reply Added', 'Thread discussion updated.');
      } else {
        throw new Error('Server reply failed');
      }
    } catch (err) {
      // Local fallback
      const localReply: CommentReply = {
        id: `r_${Date.now()}_local`,
        author_name: payload.author_name,
        author_role: payload.author_role,
        author_avatar_color: payload.author_avatar_color,
        created_at: new Date().toISOString(),
        content: payload.content,
      };
      const updated = comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...(c.replies || []), localReply],
          };
        }
        return c;
      });
      saveCommentsLocally(updated);
      toast.info('Reply Saved', 'Thread response logged.');
    } finally {
      setReplyContent('');
      setReplyingToCommentId(null);
      setIsSubmittingReply(false);
    }
  };

  // Toggle Pinned status
  const handleTogglePin = async (commentId: string, currentPin?: boolean) => {
    const nextPin = !currentPin;
    try {
      await fetch(
        `/api/audits/${encodeURIComponent(audit.audit_id)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_pinned: nextPin }),
        }
      );
    } catch (e) {
      // ignore
    }

    const updated = comments.map((c) => (c.id === commentId ? { ...c, is_pinned: nextPin } : c));
    // Sort so pinned are at the top
    const sorted = [...updated].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
    saveCommentsLocally(sorted);
    toast.info(nextPin ? 'Note Pinned' : 'Note Unpinned', nextPin ? 'Pinned to top of audit discussion.' : 'Unpinned.');
  };

  // Toggle Resolved status
  const handleToggleResolved = async (commentId: string, currentResolved?: boolean) => {
    const nextResolved = !currentResolved;
    try {
      await fetch(
        `/api/audits/${encodeURIComponent(audit.audit_id)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_resolved: nextResolved }),
        }
      );
    } catch (e) {
      // ignore
    }

    const updated = comments.map((c) => (c.id === commentId ? { ...c, is_resolved: nextResolved } : c));
    saveCommentsLocally(updated);
    toast.success(
      nextResolved ? 'Thread Marked Resolved' : 'Thread Reopened',
      nextResolved ? 'Item flagged as resolved by compliance officer.' : 'Active status restored.'
    );
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetch(
        `/api/audits/${encodeURIComponent(audit.audit_id)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: 'DELETE',
        }
      );
    } catch (e) {
      // ignore
    }

    const updated = comments.filter((c) => c.id !== commentId);
    saveCommentsLocally(updated);
    toast.info('Note Deleted', 'Audit discussion record removed.');
  };

  // Save edit
  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) return;

    try {
      await fetch(
        `/api/audits/${encodeURIComponent(audit.audit_id)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editingText.trim() }),
        }
      );
    } catch (e) {
      // ignore
    }

    const updated = comments.map((c) => (c.id === commentId ? { ...c, content: editingText.trim(), updated_at: new Date().toISOString() } : c));
    saveCommentsLocally(updated);
    setEditingCommentId(null);
    setEditingText('');
    toast.success('Note Updated', 'Changes saved to discussion thread.');
  };

  // Apply Quick Template
  const handleApplyTemplate = (tmpl: typeof QUICK_NOTE_TEMPLATES[0]) => {
    setSelectedCategory(tmpl.category);
    setSelectedPriority(tmpl.priority);
    setNewCommentContent((prev) => (prev ? `${prev}\n\n${tmpl.text}` : tmpl.text));
    toast.info('Template Applied', tmpl.label);
  };

  // Export internal notes log as downloadable report
  const handleExportNotesLog = () => {
    try {
      const header = `================================================================================
OMNISCRIBE - INTERNAL COMPLIANCE OFFICER AUDIT TRAIL & NOTES
================================================================================
AUDIT REFERENCE ID:    ${audit.audit_id}
EXPORT TIMESTAMP:      ${new Date().toISOString()}
DESTINATION JURISDICTION: ${audit.destination_country}
AUDIT STATUS:          ${audit.audit_status} (Risk Score: ${audit.risk_score}/100)
TOTAL DISCUSSION THREADS: ${comments.length}
================================================================================

`;

      const threadsText = comments.map((c, idx) => {
        const repliesText = (c.replies || [])
          .map((r, rIdx) => `    [Reply ${rIdx + 1}] by ${r.author_name} (${r.author_role}) at ${r.created_at}:\n    ${r.content}\n`)
          .join('\n');

        return `[THREAD #${idx + 1}] ${c.is_pinned ? '[PINNED] ' : ''}${c.is_resolved ? '[RESOLVED] ' : '[OPEN] '}
Author:     ${c.author_name} (${c.author_role})
Timestamp:  ${c.created_at}
Category:   ${c.category} | Priority: ${c.priority}
Target Ref: ${c.target_item_ref || 'General Audit'}
Tags:       ${(c.tags || []).join(' ') || 'None'}
Content:
${c.content}

${repliesText ? `Replies:\n${repliesText}` : 'No nested replies.'}
--------------------------------------------------------------------------------`;
      }).join('\n\n');

      const fullText = header + threadsText + '\n\nEND OF COMPLIANCE OFFICER DISCUSSION RECORD\n';
      const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(fullText);
      const anchor = document.createElement('a');
      anchor.setAttribute('href', dataStr);
      anchor.setAttribute('download', `Compliance_Notes_Audit_${audit.audit_id}.txt`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      toast.success('Discussion Trail Exported', `Saved as Compliance_Notes_Audit_${audit.audit_id}.txt`);
    } catch (e) {
      toast.error('Export Failed', 'Could not export notes log.');
    }
  };

  // Helper to format date
  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Helper to get Category Badge styles
  const getCategoryBadge = (cat: CommentCategory) => {
    switch (cat) {
      case 'RISK_FLAG':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          icon: <ShieldAlert className="w-3 h-3 text-rose-400" />,
          label: 'Risk Flag',
        };
      case 'BROKER_NOTE':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
          label: 'Broker Note',
        };
      case 'LEGAL_REGULATORY':
        return {
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          icon: <FileText className="w-3 h-3 text-indigo-400" />,
          label: 'Legal / Regulatory',
        };
      case 'AGENCY_INQUIRY':
        return {
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: <Sparkles className="w-3 h-3 text-purple-400" />,
          label: 'Agency Inquiry',
        };
      case 'RESOLUTION':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
          label: 'Resolution',
        };
      case 'GENERAL':
      default:
        return {
          bg: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
          icon: <MessageSquare className="w-3 h-3 text-slate-400" />,
          label: 'General Note',
        };
    }
  };

  // Helper for priority badge
  const getPriorityBadge = (p: CommentPriority) => {
    switch (p) {
      case 'URGENT':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <Flame className="w-3 h-3 text-rose-400" />
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
            HIGH PRIORITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            NORMAL
          </span>
        );
      case 'LOW':
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-400 border border-slate-800">
            ADVISORY
          </span>
        );
    }
  };

  // Filtered comments
  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = c.content.toLowerCase().includes(q);
        const matchesAuthor = c.author_name.toLowerCase().includes(q);
        const matchesRole = c.author_role.toLowerCase().includes(q);
        const matchesTags = (c.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesReplies = (c.replies || []).some(
          (r) => r.content.toLowerCase().includes(q) || r.author_name.toLowerCase().includes(q)
        );
        if (!matchesContent && !matchesAuthor && !matchesRole && !matchesTags && !matchesReplies) {
          return false;
        }
      }

      // Category filter
      if (filterCategory !== 'ALL' && c.category !== filterCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && c.is_resolved) return false;
      if (statusFilter === 'RESOLVED' && !c.is_resolved) return false;

      return true;
    });
  }, [comments, searchQuery, filterCategory, statusFilter]);

  // Statistics
  const totalCommentsCount = comments.length;
  const activeDiscussionsCount = comments.filter((c) => !c.is_resolved).length;
  const resolvedCount = comments.filter((c) => c.is_resolved).length;
  const totalRepliesCount = comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);

  // Available reference items from the current audit for quick linking
  const availableReferenceOptions = useMemo(() => {
    const list: { label: string; value: string }[] = [];
    if (audit.extracted_entities?.items) {
      audit.extracted_entities.items.forEach((item, idx) => {
        list.push({
          label: `Line Item #${idx + 1}: ${item.item_description || 'Item'} (${item.declared_hs_code || 'No HS'})`,
          value: `Line Item #${idx + 1}: ${item.item_description}`,
        });
      });
    }
    if (audit.compliance_discrepancies) {
      audit.compliance_discrepancies.forEach((disc, idx) => {
        list.push({
          label: `Discrepancy #${idx + 1}: ${disc.slice(0, 60)}${disc.length > 60 ? '...' : ''}`,
          value: `Discrepancy #${idx + 1}: ${disc}`,
        });
      });
    }
    return list;
  }, [audit]);

  return (
    <div className={`rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Compliance Officer Discussion & Internal Notes
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Audit #{audit.audit_id.slice(-8)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure internal team collaboration, broker instructions, and statutory audit deliberations
            </p>
          </div>
        </div>

        {/* Quick Stats & Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="text-slate-400">Threads:</span>
            <span className="font-bold text-white">{totalCommentsCount}</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400 font-medium">{activeDiscussionsCount} active</span>
            {resolvedCount > 0 && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-medium">{resolvedCount} resolved</span>
              </>
            )}
          </div>

          <button
            onClick={handleExportNotesLog}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Download internal notes discussion trail"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Notes</span>
          </button>

          <button
            onClick={() => setIsSectionOpen((prev) => !prev)}
            type="button"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            {isSectionOpen ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isSectionOpen && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Officer Identity & Role Selector */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Posting Identity:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {COMPLIANCE_OFFICERS.map((officer) => (
                <button
                  key={officer.id}
                  type="button"
                  onClick={() => {
                    setActiveOfficer(officer);
                    setIsCustomOfficer(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    !isCustomOfficer && activeOfficer.id === officer.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-500'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${officer.avatarColor}`} />
                  <span>{officer.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({officer.badge})</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomOfficer(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isCustomOfficer
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 border border-purple-500'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Custom Officer</span>
              </button>
            </div>
          </div>

          {/* Custom Officer Inputs if enabled */}
          {isCustomOfficer && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Officer / Auditor Name</label>
                <input
                  type="text"
                  value={customOfficerName}
                  onChange={(e) => setCustomOfficerName(e.target.value)}
                  placeholder="e.g. Johnathan Lee, Senior Auditor"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Designation & Agency / Broker License</label>
                <input
                  type="text"
                  value={customOfficerRole}
                  onChange={(e) => setCustomOfficerRole(e.target.value)}
                  placeholder="e.g. Regional Brokerage Supervisor / IOR Lead"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          {/* Quick Compliance Templates */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1-Click Statutory Note Templates
              </span>
              <span className="text-[11px] text-slate-500">Click to populate form</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {QUICK_NOTE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950/70 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>{tmpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* New Note Composer */}
          <form onSubmit={handleAddComment} className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${currentAvatarColor} flex items-center justify-center text-[11px] font-bold text-white shadow-sm`}
                >
                  {currentAuthorName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">{currentAuthorName}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{currentAuthorRole}</span>
                </div>
              </div>

              {/* Category and Priority selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CommentCategory)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="GENERAL">General Note</option>
                  <option value="RISK_FLAG">Risk Flag</option>
                  <option value="BROKER_NOTE">Broker Note</option>
                  <option value="LEGAL_REGULATORY">Legal / Regulatory</option>
                  <option value="AGENCY_INQUIRY">Agency Inquiry</option>
                  <option value="RESOLUTION">Resolution / Approval</option>
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as CommentPriority)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="LOW">Low / Advisory</option>
                  <option value="MEDIUM">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Hold</option>
                </select>
              </div>
            </div>

            {/* Optional Item / Discrepancy Reference */}
            {availableReferenceOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">Link to Item:</span>
                <select
                  value={selectedItemRef}
                  onChange={(e) => setSelectedItemRef(e.target.value)}
                  className="w-full max-w-md px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-slate-600 truncate cursor-pointer"
                >
                  <option value="">No specific line item (General audit note)</option>
                  {availableReferenceOptions.map((opt, i) => (
                    <option key={i} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Log internal compliance note, broker instructions, or flag regulation violation... (Tip: include hashtags like #UN3480 or #Section301)"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y"
              />
            </div>

            {/* Bottom Form Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-900">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pinNewComment}
                  onChange={(e) => setPinNewComment(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>Pin note to top of thread</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !newCommentContent.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting Note...' : 'Post Internal Note'}</span>
              </button>
            </div>
          </form>

          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, officers, tags (#UN3480)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Pills */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterCategory === 'ALL'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({comments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('RISK_FLAG')}
                  className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterCategory === 'RISK_FLAG'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-600/40'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  Risk Flags
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('BROKER_NOTE')}
                  className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterCategory === 'BROKER_NOTE'
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-600/40'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  Broker Notes
                </button>
              </div>

              {/* Status toggle */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="RESOLVED">Resolved Only</option>
              </select>
            </div>
          </div>

          {/* Comment Threads List */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Loading discussion threads...
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 p-6 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">No discussion notes match your filter criteria.</p>
              <p className="text-xs text-slate-500">
                Post an internal note or reset search filters to view active conversations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => {
                const categoryStyle = getCategoryBadge(comment.category);
                const isReplying = replyingToCommentId === comment.id;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`rounded-2xl transition-all border ${
                      comment.is_pinned
                        ? 'bg-slate-900/95 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : comment.is_resolved
                        ? 'bg-slate-950/60 border-slate-800/80 opacity-90'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    {/* Pinned / Resolved Banner */}
                    {(comment.is_pinned || comment.is_resolved) && (
                      <div className="px-4 py-1.5 rounded-t-2xl bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                        <div className="flex items-center gap-3">
                          {comment.is_pinned && (
                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                              <Pin className="w-3 h-3 fill-amber-400/20" />
                              PINNED BY COMPLIANCE OFFICER
                            </span>
                          )}
                          {comment.is_resolved && (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              REMEDIATION RESOLVED
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500">Ref: {comment.id.slice(-6)}</span>
                      </div>
                    )}

                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Note Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                              comment.author_avatar_color || 'from-indigo-500 to-purple-600'
                            } flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0`}
                          >
                            {comment.author_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-white">
                                {comment.author_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono px-2 py-0.2 rounded bg-slate-800 border border-slate-700/60">
                                {comment.author_role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{formatTimestamp(comment.created_at)}</span>
                              {comment.updated_at && <span className="text-slate-500">(edited)</span>}
                            </div>
                          </div>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                          <span
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryStyle.bg}`}
                          >
                            {categoryStyle.icon}
                            {categoryStyle.label}
                          </span>
                          {getPriorityBadge(comment.priority)}
                        </div>
                      </div>

                      {/* Linked Reference Item if present */}
                      {comment.target_item_ref && (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-indigo-300 flex items-center gap-2">
                          <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="text-slate-400">Target Line / Discrepancy:</span>
                          <span className="font-mono font-medium truncate">{comment.target_item_ref}</span>
                        </div>
                      )}

                      {/* Comment Body / Edit View */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingText('');
                              }}
                              className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(comment.id)}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Save Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      )}

                      {/* Tags */}
                      {comment.tags && comment.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {comment.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              onClick={() => setSearchQuery(tag)}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors"
                              title={`Filter by ${tag}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Bar (Reply, Pin, Resolve, Edit, Delete) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900/90 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToCommentId(isReplying ? null : comment.id);
                              setReplyContent('');
                            }}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors font-medium cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>
                              {comment.replies && comment.replies.length > 0
                                ? `Reply (${comment.replies.length})`
                                : 'Reply'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePin(comment.id, comment.is_pinned)}
                            className={`flex items-center gap-1 transition-colors font-medium cursor-pointer ${
                              comment.is_pinned ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title={comment.is_pinned ? 'Unpin note' : 'Pin note to top'}
                          >
                            <Pin className="w-3 h-3" />
                            <span>{comment.is_pinned ? 'Pinned' : 'Pin'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleResolved(comment.id, comment.is_resolved)}
                            className={`flex items-center gap-1 transition-colors font-medium cursor-pointer ${
                              comment.is_resolved ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'
                            }`}
                            title={comment.is_resolved ? 'Reopen discussion' : 'Mark as resolved'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{comment.is_resolved ? 'Resolved' : 'Mark Resolved'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingText(comment.content);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                            title="Edit note"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Nested Threaded Replies List */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 pl-4 sm:pl-6 border-l-2 border-indigo-500/20 space-y-3">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-5 h-5 rounded-md bg-gradient-to-tr ${
                                      reply.author_avatar_color || 'from-teal-500 to-emerald-600'
                                    } flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
                                  >
                                    {reply.author_name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-bold text-slate-200">
                                    {reply.author_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    • {reply.author_role}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {formatTimestamp(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 pl-7 leading-relaxed whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Reply Composer */}
                      {isReplying && (
                        <div className="mt-3 pl-4 sm:pl-6 border-l-2 border-indigo-500/40 pt-2 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                            <span>
                              Replying as <strong className="text-white">{currentAuthorName}</strong> (
                              {currentAuthorRole})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply or team instructions to this thread..."
                              rows={2}
                              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                disabled={isSubmittingReply || !replyContent.trim()}
                                onClick={() => handleAddReply(comment.id)}
                                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white disabled:opacity-50 cursor-pointer shadow"
                              >
                                {isSubmittingReply ? 'Sending...' : 'Reply'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToCommentId(null);
                                  setReplyContent('');
                                }}
                                className="px-3 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
