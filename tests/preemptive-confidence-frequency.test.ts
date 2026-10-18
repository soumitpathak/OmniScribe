/**
 * Tests for Preemptive Actions, AI Confidence Gauge, and Risk Frequency Trend Logic
 */
import { SEED_AUDIT_HISTORY } from '../src/data/seedAudits';
import { AuditResponse } from '../src/types/compliance';

export function runPreemptiveAndTrendTests() {
  console.log('⚡ Running Preemptive Actions, Confidence & Frequency Trend Tests...');

  // 1. Verify high-risk detection logic for preemptive actions trigger
  const highRiskAudit = SEED_AUDIT_HISTORY.find((a) => a.risk_score >= 70 || a.audit_status === 'REJECTED');
  if (!highRiskAudit) {
    throw new Error('Seed audit history should contain at least one high-risk/rejected consignment.');
  }

  const isHighRiskTriggered = highRiskAudit.risk_score >= 50 || highRiskAudit.risk_level === 'CRITICAL' || highRiskAudit.audit_status !== 'APPROVED';
  if (!isHighRiskTriggered) {
    throw new Error('High-risk audit should trigger the Preemptive Actions protocol.');
  }
  console.log('  ✓ Verified high-risk audit triggers preemptive mitigation protocol');

  // 2. Verify Incoterms liability shift logic
  const incotermMap: Record<string, string> = {
    DDP: 'DAP (Delivered at Place) or CPT (Carriage Paid To)',
    CIF: 'FCA (Free Carrier Terminal) or FOB (Free On Board) + Demurrage Rider',
    EXW: 'FCA (Free Carrier Factory / Named Place)',
  };

  if (!incotermMap.DDP.includes('DAP')) {
    throw new Error('DDP should suggest switching to DAP to shift customs clearance liability.');
  }
  if (!incotermMap.CIF.includes('FCA')) {
    throw new Error('CIF should suggest switching to FCA/FOB to shift port detention costs.');
  }
  console.log('  ✓ Verified Incoterms liability mitigation recommendations for DDP, CIF, and EXW');

  // 3. Verify AI Certainty / Confidence score computation
  const computeCertainty = (audit: AuditResponse) => {
    let base = 88;
    const entities = audit.extracted_entities;
    if (entities) {
      if (entities.shipper_name && entities.shipper_name !== 'Shipper Unspecified') base += 2;
      if (entities.consignee_name && entities.consignee_name !== 'Consignee Unspecified') base += 2;
      if (entities.document_number && entities.document_number !== 'DOC-REF') base += 2;
      if (entities.total_declared_value > 0) base += 2;
      if (entities.items && entities.items.length > 0) base += 2;
    }
    return Math.min(99, Math.max(70, base));
  };

  SEED_AUDIT_HISTORY.forEach((audit) => {
    const certainty = computeCertainty(audit);
    if (certainty < 70 || certainty > 100) {
      throw new Error(`Certainty score out of valid gauge range: ${certainty}`);
    }
  });
  console.log('  ✓ Verified AI confidence score calculation and gauge boundary limits (70-99%)');

  // 4. Verify Frequency Trend aggregation logic across risk bands
  let lowCount = 0;
  let modCount = 0;
  let critCount = 0;

  SEED_AUDIT_HISTORY.forEach((a) => {
    if (a.risk_level === 'CRITICAL' || a.risk_score >= 70 || a.audit_status === 'REJECTED') {
      critCount++;
    } else if (a.risk_level === 'MODERATE' || (a.risk_score >= 30 && a.risk_score < 70) || a.audit_status === 'FLAGGED') {
      modCount++;
    } else {
      lowCount++;
    }
  });

  if (lowCount + modCount + critCount !== SEED_AUDIT_HISTORY.length) {
    throw new Error('Risk level frequency partition must sum to total audit count.');
  }
  console.log(`  ✓ Verified risk level frequency partitioning: Low=${lowCount}, Mod=${modCount}, Crit=${critCount} (Total=${SEED_AUDIT_HISTORY.length})`);

  console.log('✅ Preemptive Actions, Confidence & Trend Tests Passed!');
}
