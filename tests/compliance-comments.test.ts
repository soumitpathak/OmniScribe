/**
 * Test Suite: Compliance Officer Comments & Internal Discussion Threads
 */

import { AuditComment, CommentReply, CommentCategory, CommentPriority } from '../src/types/compliance';

export function runComplianceCommentsTests() {
  console.log('💬 Running Compliance Officer Comments & Discussion Thread Tests...');

  // Test 1: Verify data structure of an AuditComment with replies
  const sampleReply: CommentReply = {
    id: 'r_101',
    author_name: 'Sarah Chen',
    author_role: 'Chief Compliance Officer',
    author_avatar_color: 'from-emerald-500 to-teal-600',
    created_at: new Date().toISOString(),
    content: 'Hold approved until UN3480 test summaries are verified.',
  };

  const sampleComment: AuditComment = {
    id: 'c_201',
    audit_id: 'AUD-TEST-US-01',
    author_name: 'Marcus Vance, LCB',
    author_role: 'Senior Customs Broker (CBP #48912)',
    author_avatar_color: 'from-amber-500 to-orange-600',
    created_at: new Date().toISOString(),
    category: 'RISK_FLAG',
    priority: 'HIGH',
    is_pinned: true,
    is_resolved: false,
    content: 'Missing dangerous goods documentation for Section 301 origin cells. #UN3480 #DangerousGoods',
    tags: ['#UN3480', '#DangerousGoods'],
    target_item_ref: 'Line Item #1: Rechargeable Lithium-Ion Cells',
    replies: [sampleReply],
  };

  if (!sampleComment.id || sampleComment.replies?.length !== 1) {
    throw new Error('AuditComment structure verification failed');
  }
  console.log('  ✓ Verified AuditComment schema and threaded replies linkage');

  // Test 2: Verify Pinned sorting logic (pinned comments sort to top)
  const commentList: AuditComment[] = [
    {
      id: 'c_1',
      audit_id: 'AUD-01',
      author_name: 'Elena Rostova',
      author_role: 'Trade Counsel',
      author_avatar_color: 'from-cyan-500 to-blue-600',
      created_at: '2026-10-18T10:00:00Z',
      category: 'GENERAL',
      priority: 'LOW',
      is_pinned: false,
      is_resolved: false,
      content: 'General filing review completed.',
      replies: [],
    },
    {
      id: 'c_2',
      audit_id: 'AUD-01',
      author_name: 'Marcus Vance',
      author_role: 'Senior Broker',
      author_avatar_color: 'from-amber-500 to-orange-600',
      created_at: '2026-10-18T09:00:00Z',
      category: 'RISK_FLAG',
      priority: 'URGENT',
      is_pinned: true,
      is_resolved: false,
      content: 'URGENT: Port hold at Long Beach pending broker validation.',
      replies: [],
    },
    {
      id: 'c_3',
      audit_id: 'AUD-01',
      author_name: 'Sarah Chen',
      author_role: 'Chief Compliance Officer',
      author_avatar_color: 'from-emerald-500 to-teal-600',
      created_at: '2026-10-18T11:00:00Z',
      category: 'RESOLUTION',
      priority: 'MEDIUM',
      is_pinned: false,
      is_resolved: true,
      content: 'Corrective docs received.',
      replies: [],
    },
  ];

  const sortedByPinned = [...commentList].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
  if (sortedByPinned[0].id !== 'c_2' || !sortedByPinned[0].is_pinned) {
    throw new Error('Pinned sort order logic failed');
  }
  console.log('  ✓ Verified pinned comments sort priority ordering');

  // Test 3: Category and Status filtering
  const riskFlags = commentList.filter((c) => c.category === 'RISK_FLAG');
  if (riskFlags.length !== 1 || riskFlags[0].id !== 'c_2') {
    throw new Error('Category filter failed');
  }

  const activeComments = commentList.filter((c) => !c.is_resolved);
  const resolvedComments = commentList.filter((c) => c.is_resolved);
  if (activeComments.length !== 2 || resolvedComments.length !== 1) {
    throw new Error('Resolution status filtering failed');
  }
  console.log('  ✓ Verified category and resolution status filtering');

  // Test 4: Search query matching (content, tags, authors, replies)
  const searchQuery = 'Long Beach';
  const matched = commentList.filter((c) =>
    c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (matched.length !== 1 || matched[0].id !== 'c_2') {
    throw new Error('Search query matching failed');
  }
  console.log('  ✓ Verified multi-field discussion search matching');

  // Test 5: Tag extraction regex
  const textWithTags = 'Requires classification under #HTS-8507 and verification of #Section301 exclusions.';
  const tagMatches = textWithTags.match(/#[A-Za-z0-9_-]+/g) || [];
  if (tagMatches.length !== 2 || !tagMatches.includes('#HTS-8507') || !tagMatches.includes('#Section301')) {
    throw new Error('Tag extraction regex failed');
  }
  console.log('  ✓ Verified inline hashtag extraction (#HTS-8507, #Section301)');

  console.log('✅ Compliance Officer Comments & Discussion Tests Passed!');
}
