import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AuditResponse,
  AuditComment,
  CommentReply,
  CommentCategory,
  CommentPriority,
  ComplianceOfficer,
} from '../types/compliance';
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
  AtSign,
  Bell,
  MessageCircle,
  Subtitles,
  Layers,
} from 'lucide-react';

interface AuditCommentSectionProps {
  audit: AuditResponse;
  className?: string;
  defaultExpanded?: boolean;
}

// Predefined compliance officer roster for quick selection and @mentions
export const COMPLIANCE_OFFICERS: ComplianceOfficer[] = [
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
    text: 'Requesting supplier commercial invoice revision to verify Chapter 99 Section 301 ad valorem duty exclusions under HTS 9903.88.03.',
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

// Helper to extract @mentions from text
export function extractMentionsFromText(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  COMPLIANCE_OFFICERS.forEach((officer) => {
    if (text.includes(`@${officer.name}`)) {
      found.add(officer.name);
    }
    const simple = officer.name.split(',')[0].trim();
    if (text.includes(`@${simple}`)) {
      found.add(officer.name);
    }
  });

  const regex = /@([A-Za-z0-9_.\s,-]+?)(?=\s|$|[.,!?\n])/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const candidate = match[1].trim();
    if (candidate && candidate.length > 1 && !found.has(candidate)) {
      found.add(candidate);
    }
  }

  return Array.from(found);
}

// Helper to check if a specific officer is mentioned in content or mentions array
export function isOfficerMentioned(
  officerName: string,
  content: string,
  mentions?: string[]
): boolean {
  if (
    mentions &&
    mentions.some((m) =>
      m.toLowerCase().includes(officerName.toLowerCase()) ||
      officerName.toLowerCase().includes(m.toLowerCase())
    )
  ) {
    return true;
  }
  const simpleName = officerName.split(',')[0].trim().toLowerCase();
  const lowerContent = content.toLowerCase();
  return (
    lowerContent.includes(`@${officerName.toLowerCase()}`) ||
    lowerContent.includes(`@${simpleName}`)
  );
}

// Recursive helper to check if an officer is mentioned anywhere in a comment tree
export function commentTreeHasOfficerMention(
  comment: AuditComment,
  officerName: string
): boolean {
  if (isOfficerMentioned(officerName, comment.content, comment.mentions)) {
    return true;
  }

  const checkReplies = (replies?: CommentReply[]): boolean => {
    if (!replies) return false;
    for (const r of replies) {
      if (isOfficerMentioned(officerName, r.content, r.mentions)) return true;
      if (r.replies && checkReplies(r.replies)) return true;
    }
    return false;
  };

  return checkReplies(comment.replies);
}

// Recursive helper to count total mentions for an officer across all comments and nested replies
export function countAllOfficerMentions(
  comments: AuditComment[],
  officerName: string
): { total: number; commentIds: string[] } {
  let total = 0;
  const commentIds: string[] = [];

  const countReplies = (replies?: CommentReply[]): number => {
    if (!replies) return 0;
    let sum = 0;
    for (const r of replies) {
      if (isOfficerMentioned(officerName, r.content, r.mentions)) {
        sum++;
      }
      if (r.replies && r.replies.length > 0) {
        sum += countReplies(r.replies);
      }
    }
    return sum;
  };

  comments.forEach((c) => {
    let hitInRoot = isOfficerMentioned(officerName, c.content, c.mentions);
    let hitInReplies = countReplies(c.replies);
    if (hitInRoot || hitInReplies > 0) {
      total += (hitInRoot ? 1 : 0) + hitInReplies;
      commentIds.push(c.id);
    }
  });

  return { total, commentIds };
}

// Helper to recursively insert a nested reply into a reply tree
export function insertReplyIntoTree(
  replies: CommentReply[],
  parentReplyId: string,
  newReply: CommentReply
): CommentReply[] {
  return replies.map((r) => {
    if (r.id === parentReplyId) {
      return {
        ...r,
        replies: [...(r.replies || []), newReply],
      };
    }
    if (r.replies && r.replies.length > 0) {
      return {
        ...r,
        replies: insertReplyIntoTree(r.replies, parentReplyId, newReply),
      };
    }
    return r;
  });
}

// Helper to recursively delete a reply from a tree
export function deleteReplyFromTree(
  replies: CommentReply[],
  replyIdToDelete: string
): CommentReply[] {
  return replies
    .filter((r) => r.id !== replyIdToDelete)
    .map((r) => {
      if (r.replies && r.replies.length > 0) {
        return {
          ...r,
          replies: deleteReplyFromTree(r.replies, replyIdToDelete),
        };
      }
      return r;
    });
}

// Recursive count of all nested replies under a reply node
export function countAllNestedReplies(reply: CommentReply): number {
  if (!reply.replies || reply.replies.length === 0) return 0;
  return (
    reply.replies.length +
    reply.replies.reduce((acc, curr) => acc + countAllNestedReplies(curr), 0)
  );
}

// Sub-component: Formatter for comment text to highlight @mentions and #tags
export const FormattedCommentText: React.FC<{
  content: string;
  activeOfficerName?: string;
  onTagClick?: (tag: string) => void;
  onMentionClick?: (mention: string) => void;
}> = ({ content, activeOfficerName, onTagClick, onMentionClick }) => {
  // Split words preserving whitespace
  const tokens = content.split(/(\s+)/);

  return (
    <span>
      {tokens.map((token, idx) => {
        if (token.startsWith('@')) {
          const mentionText = token.slice(1).replace(/[.,;:!?]+$/, '');
          const punctuation = token.slice(mentionText.length + 1);
          const isCurrentUser =
            activeOfficerName &&
            (activeOfficerName.toLowerCase().includes(mentionText.toLowerCase()) ||
              mentionText.toLowerCase().includes(activeOfficerName.split(',')[0].toLowerCase()));

          return (
            <React.Fragment key={idx}>
              <span
                onClick={() => onMentionClick && onMentionClick(mentionText)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer select-none ${
                  isCurrentUser
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-indigo-400'
                    : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 hover:border-indigo-400'
                }`}
                title={`Tagged compliance officer: @${mentionText}`}
              >
                <AtSign className="w-2.5 h-2.5" />
                <span>{mentionText}</span>
              </span>
              {punctuation}
            </React.Fragment>
          );
        }

        if (token.startsWith('#')) {
          const tagText = token.replace(/[.,;:!?]+$/, '');
          const punctuation = token.slice(tagText.length);
          return (
            <React.Fragment key={idx}>
              <span
                onClick={() => onTagClick && onTagClick(tagText)}
                className="inline-block px-1 py-0.5 rounded text-[11px] font-mono text-cyan-300 hover:text-cyan-200 hover:underline cursor-pointer transition-colors"
                title={`Filter discussion by ${tagText}`}
              >
                {tagText}
              </span>
              {punctuation}
            </React.Fragment>
          );
        }

        return <React.Fragment key={idx}>{token}</React.Fragment>;
      })}
    </span>
  );
};

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

  // Thread Reply State (Root reply or nested reply)
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(null);
  const [replyParentAuthor, setReplyParentAuthor] = useState<string>('');
  const [replyTargetPoint, setReplyTargetPoint] = useState<string>('');
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Autocomplete state for @mentions in composers
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionTargetInput, setMentionTargetInput] = useState<'root' | 'reply' | null>(null);

  // Filter and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [onlyMyMentions, setOnlyMyMentions] = useState(false);

  // Editing Note State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Storage key for local persistence backup
  const storageKey = `omniscribe_comments_${audit.audit_id}`;

  // Current active officer info
  const currentAuthorName = isCustomOfficer
    ? customOfficerName || 'Compliance Officer'
    : activeOfficer.name;
  const currentAuthorRole = isCustomOfficer
    ? customOfficerRole || 'Customs Specialist'
    : activeOfficer.role;
  const currentAvatarColor = isCustomOfficer
    ? 'from-purple-500 to-pink-600'
    : activeOfficer.avatarColor;

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
        // ignore
      }

      // If nothing found in local storage, seed initial sample discussions with nested threads
      if (isMounted) {
        const initialSeed: AuditComment[] = [
          {
            id: `c_seed_${audit.audit_id}_1`,
            audit_id: audit.audit_id,
            author_name: 'Marcus Vance, LCB',
            author_role: 'Senior Customs Broker (US CBP License #48912)',
            author_avatar_color: 'from-amber-500 to-orange-600',
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            category: 'RISK_FLAG',
            priority: 'HIGH',
            is_pinned: true,
            is_resolved: false,
            content:
              'Identified potential Section 301 ad valorem duty discrepancy and missing UN Manual of Tests and Criteria Part III, subsection 38.3 test summaries. Placed internal clearance hold on ACE filing pending broker review.',
            tags: ['#UN3480', '#Section301', '#ACE-Hold', '#DangerousGoods'],
            target_item_ref: audit.compliance_discrepancies?.[0]
              ? `Flag: ${audit.compliance_discrepancies[0]}`
              : undefined,
            mentions: ['Sarah Chen'],
            replies: [
              {
                id: `r_seed_${audit.audit_id}_1`,
                author_name: 'Sarah Chen',
                author_role: 'Chief Compliance Officer',
                author_avatar_color: 'from-emerald-500 to-teal-600',
                created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
                content:
                  'Concur with hold. @Marcus Vance, LCB please notify shipper to transmit supplier declaration of conformity and UN 38.3 laboratory test certificates before port container gate-in.',
                target_point: 'UN 38.3 Laboratory Test Certificate Requirement',
                mentions: ['Marcus Vance, LCB'],
                replies: [
                  {
                    id: `r_seed_${audit.audit_id}_sub1`,
                    author_name: 'Marcus Vance, LCB',
                    author_role: 'Senior Customs Broker (US CBP License #48912)',
                    author_avatar_color: 'from-amber-500 to-orange-600',
                    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                    parent_reply_id: `r_seed_${audit.audit_id}_1`,
                    content:
                      '@Sarah Chen - Sub-conversation on Section 301 exclusion: Checked USTR docket, exclusions expired June 2024. Full 25% supplemental duty must be entered under HTS 9903.88.03.',
                    target_point: 'Section 301 Tariff Exclusion Validity',
                    mentions: ['Sarah Chen'],
                    replies: [
                      {
                        id: `r_seed_${audit.audit_id}_subsub1`,
                        author_name: 'Elena Rostova, JD',
                        author_role: 'Trade Sanctions & Regulatory Counsel',
                        author_avatar_color: 'from-cyan-500 to-blue-600',
                        created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
                        parent_reply_id: `r_seed_${audit.audit_id}_sub1`,
                        content:
                          '@Marcus Vance, LCB - Statutory verification confirmed. 19 U.S.C. § 2411 applies without exception. I will file the legal memo to the customs docket.',
                        target_point: 'Statutory 19 U.S.C. § 2411 verification',
                        mentions: ['Marcus Vance, LCB'],
                        replies: [],
                      },
                    ],
                  },
                ],
              },
              {
                id: `r_seed_${audit.audit_id}_2`,
                author_name: 'Devin Brooks',
                author_role: 'Import Operations Lead',
                author_avatar_color: 'from-purple-500 to-indigo-600',
                created_at: new Date(Date.now() - 1800000).toISOString(),
                content:
                  'Broker team reached out to Shenzhen logistics desk. ETA on documentation packet is 09:00 EST tomorrow.',
                target_point: 'Shenzhen Documentation Packet ETA',
                mentions: ['Sarah Chen'],
                replies: [
                  {
                    id: `r_seed_${audit.audit_id}_sub2`,
                    author_name: 'Sarah Chen',
                    author_role: 'Chief Compliance Officer',
                    author_avatar_color: 'from-emerald-500 to-teal-600',
                    created_at: new Date(Date.now() - 900000).toISOString(),
                    parent_reply_id: `r_seed_${audit.audit_id}_2`,
                    content:
                      '@Devin Brooks please monitor container vessel AIS telemetry. Port demurrage clock starts on Tuesday.',
                    target_point: 'Port demurrage clock & vessel telemetry',
                    mentions: ['Devin Brooks'],
                    replies: [],
                  },
                ],
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

  // Requirement: Trigger a toast notification or indicator for the mentioned team member when they view the audit
  const activeOfficerMentions = useMemo(() => {
    return countAllOfficerMentions(comments, activeOfficer.name);
  }, [comments, activeOfficer.name]);

  // Toast notification triggered when mentioned officer views this audit
  useEffect(() => {
    if (comments.length === 0) return;
    const { total } = activeOfficerMentions;
    if (total > 0) {
      const sessionKey = `notif_mentioned_${audit.audit_id}_${activeOfficer.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        toast.info(
          `Tagged in Audit Discussion (${total})`,
          `${activeOfficer.name}, you are mentioned in ${total} discussion note${
            total > 1 ? 's' : ''
          } on this consignment.`
        );
      }
    }
  }, [activeOfficer.id, activeOfficerMentions, audit.audit_id]);

  // Update local storage when comments change
  const saveCommentsLocally = (updated: AuditComment[]) => {
    setComments(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }
  };

  // Handle adding a new root note
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentContent.trim()) {
      toast.warning('Empty Note', 'Please enter internal note text before posting.');
      return;
    }

    setIsSubmitting(true);

    const tagMatches = newCommentContent.match(/#[A-Za-z0-9_-]+/g) || [];
    const uniqueTags = Array.from(new Set(tagMatches));
    const detectedMentions = extractMentionsFromText(newCommentContent);

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
      mentions: detectedMentions,
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
        mentions: payload.mentions,
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
      setShowMentionDropdown(false);
    }
  };

  // Handle adding threaded reply or nested sub-reply
  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim()) {
      toast.warning('Empty Reply', 'Please write a reply before posting.');
      return;
    }

    setIsSubmittingReply(true);
    const detectedMentions = extractMentionsFromText(replyContent);

    const payload = {
      author_name: currentAuthorName,
      author_role: currentAuthorRole,
      author_avatar_color: currentAvatarColor,
      content: replyContent.trim(),
      parent_reply_id: replyingToReplyId || undefined,
      target_point: replyTargetPoint.trim() || undefined,
      mentions: detectedMentions,
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
            if (replyingToReplyId) {
              return {
                ...c,
                replies: insertReplyIntoTree(c.replies || [], replyingToReplyId, createdReply),
              };
            }
            return {
              ...c,
              replies: [...(c.replies || []), createdReply],
            };
          }
          return c;
        });
        saveCommentsLocally(updated);
        toast.success(
          replyingToReplyId ? 'Sub-Conversation Reply Added' : 'Reply Added',
          replyingToReplyId
            ? `Nested reply addressed to point: ${replyTargetPoint || 'discrepancy'}`
            : 'Thread discussion updated.'
        );
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
        parent_reply_id: payload.parent_reply_id,
        target_point: payload.target_point,
        mentions: payload.mentions,
        replies: [],
      };
      const updated = comments.map((c) => {
        if (c.id === commentId) {
          if (replyingToReplyId) {
            return {
              ...c,
              replies: insertReplyIntoTree(c.replies || [], replyingToReplyId, localReply),
            };
          }
          return {
            ...c,
            replies: [...(c.replies || []), localReply],
          };
        }
        return c;
      });
      saveCommentsLocally(updated);
      toast.info('Reply Saved', 'Sub-conversation response logged.');
    } finally {
      setReplyContent('');
      setReplyingToCommentId(null);
      setReplyingToReplyId(null);
      setReplyTargetPoint('');
      setReplyParentAuthor('');
      setIsSubmittingReply(false);
      setShowMentionDropdown(false);
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
    const sorted = [...updated].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
    saveCommentsLocally(sorted);
    toast.info(nextPin ? 'Note Pinned' : 'Note Unpinned', nextPin ? 'Pinned to top.' : 'Unpinned.');
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
      nextResolved ? 'Remediation completed by compliance officer.' : 'Active status restored.'
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

  // Delete a reply anywhere in the tree
  const handleDeleteReply = (commentId: string, replyId: string) => {
    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: deleteReplyFromTree(c.replies || [], replyId),
        };
      }
      return c;
    });
    saveCommentsLocally(updated);
    toast.info('Reply Deleted', 'Sub-conversation entry removed.');
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

    const updated = comments.map((c) =>
      c.id === commentId
        ? {
            ...c,
            content: editingText.trim(),
            mentions: extractMentionsFromText(editingText.trim()),
            updated_at: new Date().toISOString(),
          }
        : c
    );
    saveCommentsLocally(updated);
    setEditingCommentId(null);
    setEditingText('');
    toast.success('Note Updated', 'Changes saved to discussion thread.');
  };

  // Apply Quick Template
  const handleApplyTemplate = (tmpl: (typeof QUICK_NOTE_TEMPLATES)[0]) => {
    setSelectedCategory(tmpl.category);
    setSelectedPriority(tmpl.priority);
    setNewCommentContent((prev) => (prev ? `${prev}\n\n${tmpl.text}` : tmpl.text));
    toast.info('Template Applied', tmpl.label);
  };

  // Insert @Mention into active input
  const handleInsertMention = (officer: ComplianceOfficer, target: 'root' | 'reply') => {
    const mentionTag = `@${officer.name} `;
    if (target === 'root') {
      setNewCommentContent((prev) => `${prev} ${mentionTag}`);
    } else {
      setReplyContent((prev) => `${prev} ${mentionTag}`);
    }
    setShowMentionDropdown(false);
    toast.info('Team Member Tagged', `${officer.name} (@${officer.name}) tagged.`);
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

      const formatRepliesRecursive = (replies: CommentReply[], indent: string): string => {
        return replies
          .map((r, rIdx) => {
            const subText = r.replies && r.replies.length > 0 ? formatRepliesRecursive(r.replies, `${indent}  `) : '';
            return `${indent}[Sub-Reply ${rIdx + 1}] by ${r.author_name} (${r.author_role}) at ${r.created_at}:
${r.target_point ? `${indent}  Point: ${r.target_point}\n` : ''}${r.mentions && r.mentions.length > 0 ? `${indent}  Mentions: ${r.mentions.join(', ')}\n` : ''}${indent}  Content: ${r.content}
${subText}`;
          })
          .join('\n');
      };

      const threadsText = comments
        .map((c, idx) => {
          const repliesText = c.replies && c.replies.length > 0 ? formatRepliesRecursive(c.replies, '    ') : '';

          return `[THREAD #${idx + 1}] ${c.is_pinned ? '[PINNED] ' : ''}${c.is_resolved ? '[RESOLVED] ' : '[OPEN] '}
Author:     ${c.author_name} (${c.author_role})
Timestamp:  ${c.created_at}
Category:   ${c.category} | Priority: ${c.priority}
Target Ref: ${c.target_item_ref || 'General Audit'}
Tags:       ${(c.tags || []).join(' ') || 'None'}
Mentions:   ${(c.mentions || []).join(', ') || 'None'}
Content:
${c.content}

${repliesText ? `Nested Replies & Sub-Conversations:\n${repliesText}` : 'No nested replies.'}
--------------------------------------------------------------------------------`;
        })
        .join('\n\n');

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
      // Mention filter
      if (onlyMyMentions) {
        if (!commentTreeHasOfficerMention(c, activeOfficer.name)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = c.content.toLowerCase().includes(q);
        const matchesAuthor = c.author_name.toLowerCase().includes(q);
        const matchesRole = c.author_role.toLowerCase().includes(q);
        const matchesTags = (c.tags || []).some((t) => t.toLowerCase().includes(q));

        const searchReplies = (replies?: CommentReply[]): boolean => {
          if (!replies) return false;
          return replies.some(
            (r) =>
              r.content.toLowerCase().includes(q) ||
              r.author_name.toLowerCase().includes(q) ||
              (r.target_point && r.target_point.toLowerCase().includes(q)) ||
              searchReplies(r.replies)
          );
        };

        if (!matchesContent && !matchesAuthor && !matchesRole && !matchesTags && !searchReplies(c.replies)) {
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
  }, [comments, searchQuery, filterCategory, statusFilter, onlyMyMentions, activeOfficer.name]);

  // Available discrepancy points for sub-conversation targeting
  const discrepancyPoints = useMemo(() => {
    const list: string[] = [];
    if (audit.compliance_discrepancies) {
      audit.compliance_discrepancies.forEach((d) => list.push(d));
    }
    if (audit.discrepancy_details) {
      audit.discrepancy_details.forEach((d) => {
        if (d.title && !list.includes(d.title)) list.push(d.title);
      });
    }
    return list;
  }, [audit]);

  // Available reference items from the current audit for root note linking
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

  // Statistics
  const totalCommentsCount = comments.length;
  const activeDiscussionsCount = comments.filter((c) => !c.is_resolved).length;
  const resolvedCount = comments.filter((c) => c.is_resolved).length;

  // Recursive Component to render nested reply nodes
  const renderNestedReply = (
    reply: CommentReply,
    commentId: string,
    depth: number = 1
  ): React.ReactNode => {
    const isReplyingToThis = replyingToCommentId === commentId && replyingToReplyId === reply.id;
    const isCurrentUserMentioned = isOfficerMentioned(
      activeOfficer.name,
      reply.content,
      reply.mentions
    );
    const subRepliesCount = countAllNestedReplies(reply);

    return (
      <div
        key={reply.id}
        className={`relative ${
          depth > 1 ? 'mt-2.5 pl-3 sm:pl-4 border-l-2 border-indigo-500/25' : 'mt-2.5'
        }`}
      >
        <div
          className={`p-3 rounded-xl transition-all border ${
            isCurrentUserMentioned
              ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-500/30'
              : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700/80'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-slate-800/60">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`w-5 h-5 rounded-md bg-gradient-to-tr ${
                  reply.author_avatar_color || 'from-teal-500 to-emerald-600'
                } flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
              >
                {reply.author_name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-200">{reply.author_name}</span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                • {reply.author_role}
              </span>

              {/* Sub-Conversation Tag / Target Point Badge */}
              {reply.target_point && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-500/30">
                  <Subtitles className="w-2.5 h-2.5 text-purple-400" />
                  <span className="max-w-[200px] truncate">{reply.target_point}</span>
                </span>
              )}

              {/* Mentioned You Indicator */}
              {isCurrentUserMentioned && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white shadow-sm">
                  <AtSign className="w-2.5 h-2.5" />
                  Mentioned You
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">
                {formatTimestamp(reply.created_at)}
              </span>

              <button
                type="button"
                onClick={() => handleDeleteReply(commentId, reply.id)}
                className="text-slate-600 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                title="Delete sub-reply"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="text-xs text-slate-200 pt-2 leading-relaxed">
            <FormattedCommentText
              content={reply.content}
              activeOfficerName={activeOfficer.name}
              onTagClick={(tag) => setSearchQuery(tag)}
            />
          </div>

          {/* Action Bar for Sub-Reply */}
          <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-800/40 text-[11px]">
            <button
              type="button"
              onClick={() => {
                if (isReplyingToThis) {
                  setReplyingToCommentId(null);
                  setReplyingToReplyId(null);
                  setReplyTargetPoint('');
                  setReplyParentAuthor('');
                  setReplyContent('');
                } else {
                  setReplyingToCommentId(commentId);
                  setReplyingToReplyId(reply.id);
                  setReplyParentAuthor(reply.author_name);
                  setReplyTargetPoint(reply.target_point || '');
                  setReplyContent(`@${reply.author_name} `);
                }
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors font-medium cursor-pointer"
            >
              <CornerDownRight className="w-3 h-3 text-indigo-400" />
              <span>
                {isReplyingToThis ? 'Cancel Sub-Reply' : `Reply on Point${subRepliesCount > 0 ? ` (${subRepliesCount})` : ''}`}
              </span>
            </button>

            {depth > 1 && (
              <span className="text-[10px] font-mono text-slate-500">
                Level {depth} Sub-Thread
              </span>
            )}
          </div>
        </div>

        {/* Inline Sub-Reply Composer when responding to this specific reply node */}
        {isReplyingToThis && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-indigo-500/40 shadow-xl space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                Sub-conversation with <strong className="text-white">@{reply.author_name}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyingToCommentId(null);
                  setReplyingToReplyId(null);
                  setReplyContent('');
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Sub-Discrepancy Point Selector */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-medium">Specific Discrepancy Point:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyTargetPoint}
                  onChange={(e) => setReplyTargetPoint(e.target.value)}
                  placeholder="e.g. UN 38.3 test certificate clause 4.2, Section 301 ad valorem rate..."
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
                {discrepancyPoints.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setReplyTargetPoint(e.target.value);
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-300 max-w-[150px] truncate cursor-pointer"
                  >
                    <option value="">Insert Discrepancy</option>
                    {discrepancyPoints.map((dp, i) => (
                      <option key={i} value={dp}>
                        {dp}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Quick Mention Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-mono">Tag Officer:</span>
              {COMPLIANCE_OFFICERS.map((officer) => (
                <button
                  key={officer.id}
                  type="button"
                  onClick={() => handleInsertMention(officer, 'reply')}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 cursor-pointer"
                >
                  @{officer.name.split(',')[0]}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write sub-conversation instructions or clarification on this specific point..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingToCommentId(null);
                  setReplyingToReplyId(null);
                  setReplyContent('');
                }}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReply || !replyContent.trim()}
                onClick={() => handleAddReply(commentId)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingReply ? 'Posting...' : 'Post Sub-Reply'}
              </button>
            </div>
          </div>
        )}

        {/* Recursive rendering of nested children */}
        {reply.replies && reply.replies.length > 0 && (
          <div className="space-y-1">
            {reply.replies.map((subReply) =>
              renderNestedReply(subReply, commentId, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden ${className}`}
    >
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
              Secure team collaboration, nested discrepancy sub-conversations, and officer @mentions
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
          {/* Requirement: Team Member @Mention Indicator Banner */}
          {activeOfficerMentions.total > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/50 shadow-lg shadow-indigo-500/10 flex items-center justify-between gap-3 flex-wrap animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                  <Bell className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      Officer Alert: {activeOfficer.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow-sm">
                      {activeOfficerMentions.total} Mention
                      {activeOfficerMentions.total > 1 ? 's' : ''} in this Dossier
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    You have been tagged in compliance threads regarding discrepancy remediation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyMyMentions((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    onlyMyMentions
                      ? 'bg-indigo-500 text-white shadow'
                      : 'bg-indigo-900/60 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-500/40'
                  }`}
                >
                  {onlyMyMentions ? 'Showing All Threads' : 'Filter to My Mentions'}
                </button>
              </div>
            </div>
          )}

          {/* Officer Identity & Role Selector */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Active Officer Profile:</span>
              <span className="text-xs text-slate-400">
                (Switch personas to review officer-specific @mentions)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {COMPLIANCE_OFFICERS.map((officer) => (
                <button
                  key={officer.id}
                  type="button"
                  onClick={() => {
                    setActiveOfficer(officer);
                    setIsCustomOfficer(false);
                    // Check mentions count for this officer
                    const mentionsForThis = countAllOfficerMentions(comments, officer.name);
                    if (mentionsForThis.total > 0) {
                      toast.info(
                        `Switched to ${officer.name}`,
                        `${officer.name} is mentioned in ${mentionsForThis.total} discussion threads.`
                      );
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    !isCustomOfficer && activeOfficer.id === officer.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-gradient-to-tr ${officer.avatarColor} flex items-center justify-center text-[9px] font-bold text-white`}
                  >
                    {officer.name.slice(0, 1)}
                  </div>
                  <span>{officer.name.split(',')[0]}</span>
                  {/* Mention count pill on officer chip if tagged */}
                  {(() => {
                    const mCount = countAllOfficerMentions(comments, officer.name).total;
                    if (mCount > 0) {
                      return (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                          @{mCount}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomOfficer((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isCustomOfficer
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom Officer Form if active */}
          {isCustomOfficer && (
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-purple-300 block mb-1">
                  Officer Name:
                </label>
                <input
                  type="text"
                  value={customOfficerName}
                  onChange={(e) => setCustomOfficerName(e.target.value)}
                  placeholder="e.g. Rachel Adams, LCB"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-purple-300 block mb-1">
                  Official Role / Organization:
                </label>
                <input
                  type="text"
                  value={customOfficerRole}
                  onChange={(e) => setCustomOfficerRole(e.target.value)}
                  placeholder="e.g. Export Control Specialist"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Quick Note Templates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Statutory Templates:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">1-click insert</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_NOTE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>{tmpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* New Note Composer Form */}
          <form
            onSubmit={handleAddComment}
            className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5"
          >
            {/* Top Row: Author badge + Category + Priority */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${currentAvatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
                >
                  {currentAuthorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">
                    {currentAuthorName}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {currentAuthorRole}
                  </span>
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

            {/* Quick @Mention chips above composer */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <AtSign className="w-3 h-3 text-indigo-400" />
                Tag Officer:
              </span>
              {COMPLIANCE_OFFICERS.map((officer) => (
                <button
                  key={officer.id}
                  type="button"
                  onClick={() => handleInsertMention(officer, 'root')}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 hover:border-indigo-500 cursor-pointer transition-colors"
                >
                  @{officer.name.split(',')[0]}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Log internal compliance note, broker instructions, or flag regulation violation... (Use @Name to tag team members, #tags like #UN3480)"
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
                placeholder="Search notes, officers, points, tags (#UN3480)..."
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
              <p className="text-sm font-medium text-slate-400">
                No discussion notes match your filter criteria.
              </p>
              <p className="text-xs text-slate-500">
                Post an internal note or reset search filters to view active conversations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => {
                const categoryStyle = getCategoryBadge(comment.category);
                const isReplying = replyingToCommentId === comment.id && !replyingToReplyId;
                const isEditing = editingCommentId === comment.id;
                const isCurrentUserMentioned = isOfficerMentioned(
                  activeOfficer.name,
                  comment.content,
                  comment.mentions
                );
                const totalNestedCount = (comment.replies || []).reduce(
                  (acc, r) => acc + 1 + countAllNestedReplies(r),
                  0
                );

                return (
                  <div
                    key={comment.id}
                    className={`rounded-2xl transition-all border ${
                      comment.is_pinned
                        ? 'bg-slate-900/95 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : isCurrentUserMentioned
                        ? 'bg-slate-950/90 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : comment.is_resolved
                        ? 'bg-slate-950/60 border-slate-800/80 opacity-90'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    {/* Pinned / Resolved / Mentioned Banner */}
                    {(comment.is_pinned || comment.is_resolved || isCurrentUserMentioned) && (
                      <div className="px-4 py-1.5 rounded-t-2xl bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono flex-wrap gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          {comment.is_pinned && (
                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                              <Pin className="w-3 h-3 fill-amber-400/20" />
                              PINNED NOTE
                            </span>
                          )}
                          {isCurrentUserMentioned && (
                            <span className="flex items-center gap-1 text-indigo-400 font-bold">
                              <AtSign className="w-3 h-3 text-indigo-400" />
                              MENTIONS {activeOfficer.name.toUpperCase()}
                            </span>
                          )}
                          {comment.is_resolved && (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              RESOLVED
                            </span>
                          )}
                        </div>

                        {comment.updated_at && (
                          <span className="text-slate-500">
                            Edited {formatTimestamp(comment.updated_at)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Card Header: Author, Role, Time, Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                              comment.author_avatar_color || 'from-indigo-500 to-purple-600'
                            } flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}
                          >
                            {comment.author_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-white">
                                {comment.author_name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                • {comment.author_role}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {formatTimestamp(comment.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                          <span
                            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${categoryStyle.bg}`}
                          >
                            {categoryStyle.icon}
                            <span>{categoryStyle.label}</span>
                          </span>
                          {getPriorityBadge(comment.priority)}
                        </div>
                      </div>

                      {/* Optional Target Item Reference */}
                      {comment.target_item_ref && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-indigo-300">
                          <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="font-mono text-slate-400">Referenced:</span>
                          <span className="truncate">{comment.target_item_ref}</span>
                        </div>
                      )}

                      {/* Content / Editor */}
                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-400"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingText('');
                              }}
                              className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(comment.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
                          <FormattedCommentText
                            content={comment.content}
                            activeOfficerName={activeOfficer.name}
                            onTagClick={(tag) => setSearchQuery(tag)}
                          />
                        </div>
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
                              setReplyingToReplyId(null);
                              setReplyTargetPoint('');
                              setReplyParentAuthor('');
                              setReplyContent('');
                            }}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors font-medium cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                            <span>
                              {totalNestedCount > 0
                                ? `Reply & Sub-threads (${totalNestedCount})`
                                : 'Reply to Note'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePin(comment.id, comment.is_pinned)}
                            className={`flex items-center gap-1 transition-colors font-medium cursor-pointer ${
                              comment.is_pinned
                                ? 'text-amber-400'
                                : 'text-slate-400 hover:text-slate-200'
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
                              comment.is_resolved
                                ? 'text-emerald-400'
                                : 'text-slate-400 hover:text-emerald-400'
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
                        <div className="mt-3 pl-3 sm:pl-5 border-l-2 border-indigo-500/25 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-indigo-400" />
                              Discussion Threads & Sub-conversations ({totalNestedCount})
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Click &quot;Reply on Point&quot; to branch on a specific discrepancy
                            </span>
                          </div>

                          {comment.replies.map((reply) =>
                            renderNestedReply(reply, comment.id, 1)
                          )}
                        </div>
                      )}

                      {/* Root Thread Reply Composer */}
                      {isReplying && (
                        <div className="mt-3 pl-3 sm:pl-5 border-l-2 border-indigo-500/40 pt-2 space-y-2.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                              <span>
                                Replying as <strong className="text-white">{currentAuthorName}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReplyingToCommentId(null)}
                              className="text-slate-400 hover:text-white"
                            >
                              ✕ Close
                            </button>
                          </div>

                          {/* Quick Mention Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-mono">Tag Officer:</span>
                            {COMPLIANCE_OFFICERS.map((officer) => (
                              <button
                                key={officer.id}
                                type="button"
                                onClick={() => handleInsertMention(officer, 'reply')}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 cursor-pointer"
                              >
                                @{officer.name.split(',')[0]}
                              </button>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply or team instructions to this thread..."
                              rows={2}
                              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                            />
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={isSubmittingReply || !replyContent.trim()}
                                onClick={() => handleAddReply(comment.id)}
                                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white disabled:opacity-50 cursor-pointer shadow"
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
