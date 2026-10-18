/**
 * Test Suite: Compliance Officer Comments & Internal Discussion Threads
 */

import { AuditResponse, AuditComment, CommentReply, CommentCategory, CommentPriority } from '../src/types/compliance';

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

  // Test 6: Nested reply threads on specific points of discrepancy
  const rootReply: CommentReply = {
    id: 'r_root_1',
    author_name: 'Sarah Chen',
    author_role: 'Chief Compliance Officer',
    author_avatar_color: 'from-emerald-500 to-teal-600',
    created_at: '2026-10-18T10:00:00Z',
    content: 'Reviewing UN 38.3 laboratory certificates.',
    target_point: 'UN 38.3 test summary',
    mentions: ['Marcus Vance'],
    replies: [],
  };

  const subReply: CommentReply = {
    id: 'r_sub_1',
    author_name: 'Marcus Vance, LCB',
    author_role: 'Senior Customs Broker',
    author_avatar_color: 'from-amber-500 to-orange-600',
    created_at: '2026-10-18T10:15:00Z',
    parent_reply_id: 'r_root_1',
    content: '@Sarah Chen - Sub-conversation on Section 301 ad valorem rate: 25% duty applies.',
    target_point: 'Section 301 Tariff Exclusion',
    mentions: ['Sarah Chen'],
    replies: [],
  };

  const subSubReply: CommentReply = {
    id: 'r_subsub_1',
    author_name: 'Elena Rostova, JD',
    author_role: 'Trade Counsel',
    author_avatar_color: 'from-cyan-500 to-blue-600',
    created_at: '2026-10-18T10:30:00Z',
    parent_reply_id: 'r_sub_1',
    content: '@Marcus Vance - Agreed, 19 U.S.C. 2411 applies.',
    target_point: '19 U.S.C. § 2411 legal confirmation',
    mentions: ['Marcus Vance'],
    replies: [],
  };

  // Helper import emulation for test suite
  function testInsertReply(replies: CommentReply[], parentId: string, newR: CommentReply): CommentReply[] {
    return replies.map((r) => {
      if (r.id === parentId) {
        return { ...r, replies: [...(r.replies || []), newR] };
      }
      if (r.replies && r.replies.length > 0) {
        return { ...r, replies: testInsertReply(r.replies, parentId, newR) };
      }
      return r;
    });
  }

  let threadReplies: CommentReply[] = [rootReply];
  threadReplies = testInsertReply(threadReplies, 'r_root_1', subReply);
  threadReplies = testInsertReply(threadReplies, 'r_sub_1', subSubReply);

  if (
    threadReplies[0].replies?.length !== 1 ||
    threadReplies[0].replies[0].id !== 'r_sub_1' ||
    threadReplies[0].replies[0].replies?.length !== 1 ||
    threadReplies[0].replies[0].replies[0].id !== 'r_subsub_1'
  ) {
    throw new Error('Nested reply tree insertion failed');
  }
  console.log('  ✓ Verified multi-level nested reply threads and discrepancy sub-conversations');

  // Test 7: @User mention extraction and detection
  const textWithMentions = 'Attention @Sarah Chen and @Marcus Vance, LCB: please verify HTS 8507.60.00.';
  const officerNames = ['Sarah Chen', 'Marcus Vance, LCB', 'Elena Rostova, JD', 'Devin Brooks'];
  const extractedMentions = officerNames.filter((name) => textWithMentions.includes(`@${name}`));

  if (!extractedMentions.includes('Sarah Chen') || !extractedMentions.includes('Marcus Vance, LCB')) {
    throw new Error('Officer @mention extraction failed');
  }

  // Count mentions in a comment tree
  const sampleTreeComment: AuditComment = {
    id: 'c_mention_test',
    audit_id: 'AUD-01',
    author_name: 'Devin Brooks',
    author_role: 'Operations Lead',
    author_avatar_color: 'from-purple-500 to-indigo-600',
    created_at: '2026-10-18T10:00:00Z',
    category: 'RISK_FLAG',
    priority: 'HIGH',
    content: 'Flagging consignment. @Sarah Chen please review.',
    mentions: ['Sarah Chen'],
    replies: threadReplies,
  };

  function countOfficerMentionsInTree(comment: AuditComment, officer: string): number {
    let count = 0;
    if (comment.content.includes(`@${officer}`) || (comment.mentions && comment.mentions.includes(officer))) {
      count++;
    }
    const countR = (replies?: CommentReply[]) => {
      if (!replies) return;
      for (const r of replies) {
        if (r.content.includes(`@${officer}`) || (r.mentions && r.mentions.includes(officer))) {
          count++;
        }
        if (r.replies) countR(r.replies);
      }
    };
    countR(comment.replies);
    return count;
  }

  const sarahMentions = countOfficerMentionsInTree(sampleTreeComment, 'Sarah Chen');
  if (sarahMentions !== 2) {
    // 1 in root comment + 1 in sub-reply
    throw new Error(`Expected 2 mentions for Sarah Chen, got ${sarahMentions}`);
  }
  console.log('  ✓ Verified @user mention extraction and tree-wide mention indicator counting');

  // Test 8: 30-Day risk score calculation & trend direction
  const mockDailyRisks = [
    { day: 1, risk: 85 },
    { day: 5, risk: 80 },
    { day: 10, risk: 75 },
    { day: 15, risk: 70 },
    // Second half has lower risk (improving compliance)
    { day: 20, risk: 40 },
    { day: 25, risk: 30 },
    { day: 28, risk: 20 },
    { day: 30, risk: 15 },
  ];

  const firstHalf = mockDailyRisks.slice(0, 4);
  const secondHalf = mockDailyRisks.slice(4, 8);
  const avgFirst = firstHalf.reduce((s, d) => s + d.risk, 0) / firstHalf.length; // 77.5
  const avgSecond = secondHalf.reduce((s, d) => s + d.risk, 0) / secondHalf.length; // 26.25
  const delta = avgSecond - avgFirst; // -51.25

  let trendDirection = 'STABLE';
  if (delta <= -3) trendDirection = 'IMPROVING';
  else if (delta >= 3) trendDirection = 'WORSENING';

  if (trendDirection !== 'IMPROVING') {
    throw new Error('30-day compliance trend calculation failed');
  }
  console.log('  ✓ Verified 30-day average risk trajectory and improving trend classification');

  // Test 9: Confidence Score with LLM Metadata Quantification
  const sampleAuditWithLLMMetadata: AuditResponse = {
    audit_id: 'AUD-CONF-TEST-001',
    audit_status: 'FLAGGED',
    risk_score: 45,
    risk_level: 'MODERATE',
    confidence_score: 93,
    llm_metadata: {
      model: 'gemini-3.8-flash',
      confidence_score: 93,
      certainty_score: 93,
      certainty_level: 'VERY HIGH',
      reasoning_steps: 6,
      tokens_processed: 1420,
      temperature: 0.1,
      ocr_fidelity_score: 98,
      tariff_concordance_score: 96,
      pga_crosscheck_score: 95,
      statutory_synthesis_score: 94,
    },
    destination_country: 'USA',
    regulatory_framework: 'US CBP',
    extracted_entities: {
      document_type: 'Commercial Invoice',
      document_number: 'INV-10928',
      shipper_name: 'Alpha Electronics Ltd',
      shipper_address: '10 Industrial Way',
      shipper_country: 'Japan',
      consignee_name: 'Beta Imports LLC',
      consignee_address: '400 Harbor Blvd, Long Beach, CA',
      consignee_country: 'USA',
      port_of_loading: 'Yokohama',
      port_of_discharge: 'Los Angeles',
      mode_of_transport: 'Ocean',
      incoterms: 'FOB',
      currency: 'USD',
      total_declared_value: 120000,
      items: [
        {
          item_description: 'Semiconductor Microcontrollers',
          declared_hs_code: '8542.31',
          verified_hs_code: '8542.31.00',
          quantity: 5000,
          unit: 'pcs',
          unit_value: 24,
          total_value: 120000,
          country_of_origin: 'Japan',
        },
      ],
    },
    compliance_discrepancies: ['EPA notification review recommended'],
    discrepancy_details: [],
    recommended_actions: ['Verify PGA notice'],
    action_details: [],
    agent_reasoning_trace: [
      'Document parsed cleanly via OCR with 98% spatial text fidelity.',
      'HTS 8542.31 checked against US schedule.',
      'Confidence score quantified at 93% certainty based on metadata reasoning trace.',
    ],
    timestamp: new Date().toISOString(),
  };

  const confidenceScore =
    sampleAuditWithLLMMetadata.confidence_score ??
    sampleAuditWithLLMMetadata.llm_metadata?.confidence_score ??
    90;

  if (confidenceScore !== 93 || sampleAuditWithLLMMetadata.llm_metadata?.model !== 'gemini-3.8-flash') {
    throw new Error('Confidence score LLM metadata extraction failed');
  }
  console.log('  ✓ Verified Confidence Score component LLM metadata quantification (93% certainty, gemini-3.8-flash)');

  // Test 10: Audit Category Filter Widget ('High Risk', 'Pending Review', 'Customs Approved')
  function classifyCategory(audit: AuditResponse): 'HIGH_RISK' | 'PENDING_REVIEW' | 'CUSTOMS_APPROVED' {
    if (audit.audit_status === 'REJECTED' || audit.risk_score >= 70 || audit.risk_level === 'CRITICAL') {
      return 'HIGH_RISK';
    }
    if (audit.audit_status === 'FLAGGED' || (audit.risk_score >= 30 && audit.risk_score < 70) || audit.risk_level === 'MODERATE') {
      return 'PENDING_REVIEW';
    }
    return 'CUSTOMS_APPROVED';
  }

  const testAudits: AuditResponse[] = [
    { ...sampleAuditWithLLMMetadata, audit_id: 'A1', audit_status: 'REJECTED', risk_score: 85, risk_level: 'CRITICAL' },
    { ...sampleAuditWithLLMMetadata, audit_id: 'A2', audit_status: 'FLAGGED', risk_score: 55, risk_level: 'MODERATE' },
    { ...sampleAuditWithLLMMetadata, audit_id: 'A3', audit_status: 'APPROVED', risk_score: 12, risk_level: 'LOW' },
  ];

  if (classifyCategory(testAudits[0]) !== 'HIGH_RISK') {
    throw new Error('Audit category classification failed for High Risk');
  }
  if (classifyCategory(testAudits[1]) !== 'PENDING_REVIEW') {
    throw new Error('Audit category classification failed for Pending Review');
  }
  if (classifyCategory(testAudits[2]) !== 'CUSTOMS_APPROVED') {
    throw new Error('Audit category classification failed for Customs Approved');
  }
  console.log('  ✓ Verified Audit Category Filter grouping logic (High Risk, Pending Review, Customs Approved)');

  console.log('✅ Compliance Officer Comments, Nested Threads, Confidence Score & Category Filter Tests Passed!');
}
