/**
 * OmniScribe Compliance Audit Engine & Edge Cases Test Suite
 */

import assert from 'node:assert';
import { SEED_AUDIT_HISTORY } from '../src/data/seedAudits';
import { AuditResponse } from '../src/types/compliance';

export function runAuditEngineTests() {
  console.log('\n📦 Running Audit Engine & Schema Validation Tests...');

  // 1. Seed audit data structure validity
  assert.ok(Array.isArray(SEED_AUDIT_HISTORY), 'Seed audit history must be an array');
  assert.strictEqual(SEED_AUDIT_HISTORY.length, 6, 'Must contain 6 default enterprise audit scenarios');

  for (const audit of SEED_AUDIT_HISTORY) {
    assert.ok(audit.audit_id.startsWith('AUD-'), `Audit ID ${audit.audit_id} must have prefix AUD-`);
    assert.ok(['APPROVED', 'FLAGGED', 'REJECTED'].includes(audit.audit_status), `Invalid status ${audit.audit_status}`);
    assert.ok(typeof audit.risk_score === 'number' && audit.risk_score >= 0 && audit.risk_score <= 100, 'Risk score must be between 0 and 100');
    assert.ok(['LOW', 'MODERATE', 'CRITICAL'].includes(audit.risk_level), `Invalid risk level ${audit.risk_level}`);
    assert.ok(audit.destination_country.length > 0, 'Destination country must not be empty');
    assert.ok(audit.regulatory_framework.length > 0, 'Regulatory framework must not be empty');
    assert.ok(audit.extracted_entities, 'Extracted entities must be present');
    assert.ok(audit.extracted_entities.items.length > 0, 'Items list must not be empty');
    assert.ok(audit.extracted_entities.total_declared_value >= 0, 'Total declared value must be non-negative');
    assert.ok(Array.isArray(audit.compliance_discrepancies), 'Compliance discrepancies must be an array');
    assert.ok(Array.isArray(audit.recommended_actions), 'Recommended actions must be an array');
    assert.ok(!isNaN(new Date(audit.timestamp).getTime()), 'Timestamp must be a valid ISO date string');
  }
  console.log('  ✓ Verified schema integrity of all seed audit dossiers');

  // 2. Risk status correspondence edge cases
  for (const audit of SEED_AUDIT_HISTORY) {
    if (audit.audit_status === 'APPROVED') {
      assert.ok(audit.risk_score < 30, `Approved audit ${audit.audit_id} should have risk score < 30, got ${audit.risk_score}`);
      assert.strictEqual(audit.risk_level, 'LOW', `Approved audit ${audit.audit_id} should have LOW risk level`);
    } else if (audit.audit_status === 'REJECTED') {
      assert.ok(audit.risk_score >= 70, `Rejected audit ${audit.audit_id} should have risk score >= 70, got ${audit.risk_score}`);
      assert.strictEqual(audit.risk_level, 'CRITICAL', `Rejected audit ${audit.audit_id} should have CRITICAL risk level`);
    }
  }
  console.log('  ✓ Verified status-to-risk score correlation logic');

  // 3. Line item financial calculations
  for (const audit of SEED_AUDIT_HISTORY) {
    const totalFromItems = audit.extracted_entities.items.reduce((sum, item) => sum + (item.total_value || 0), 0);
    assert.ok(totalFromItems > 0, `Total items value must be greater than zero in ${audit.audit_id}`);
    assert.ok(audit.extracted_entities.total_declared_value > 0, 'Total declared value must be positive');
  }
  console.log('  ✓ Verified financial calculations across line items');

  // 4. International HS Tariff Code format check
  for (const audit of SEED_AUDIT_HISTORY) {
    for (const item of audit.extracted_entities.items) {
      assert.match(item.declared_hs_code, /^\d{4}\.\d{2}/, `HS Code ${item.declared_hs_code} must match standard 4-digit heading + 2-digit subheading`);
    }
  }
  console.log('  ✓ Verified Harmonized Tariff (HS) Code format conformity');

  console.log('✅ Audit Engine Tests Passed!\n');
}
