/**
 * OmniScribe Dashboard Logic & Filtering Edge Cases Test Suite
 */

import assert from 'node:assert';
import { SEED_AUDIT_HISTORY } from '../src/data/seedAudits';
import { AuditResponse } from '../src/types/compliance';

export function runDashboardLogicTests() {
  console.log('\n🔍 Running Dashboard Logic, Filtering & Sorting Tests...');

  const data = [...SEED_AUDIT_HISTORY];

  // 1. KPI calculations on full seed data
  const total = data.length;
  const approved = data.filter((a) => a.audit_status === 'APPROVED').length;
  const flagged = data.filter((a) => a.audit_status === 'FLAGGED').length;
  const rejected = data.filter((a) => a.audit_status === 'REJECTED').length;
  const totalValue = data.reduce((sum, item) => sum + (item.extracted_entities.total_declared_value || 0), 0);
  const avgRisk = Math.round(data.reduce((sum, item) => sum + item.risk_score, 0) / total);
  const passRate = Math.round((approved / total) * 100);

  assert.strictEqual(total, 6);
  assert.strictEqual(approved, 2);
  assert.strictEqual(flagged, 2);
  assert.strictEqual(rejected, 2);
  assert.strictEqual(passRate, 33); // 2/6 = 33.3% -> 33%
  assert.ok(totalValue > 1000000, `Expected total cargo value > $1M, got ${totalValue}`);
  assert.ok(avgRisk > 0 && avgRisk < 100, `Expected reasonable average risk score, got ${avgRisk}`);
  console.log('  ✓ Verified KPI computations on standard dataset');

  // 2. KPI edge case: empty dataset handling (avoid NaN / division by zero)
  const emptyList: AuditResponse[] = [];
  const emptyTotal = emptyList.length;
  const emptyApproved = emptyList.filter((a) => a.audit_status === 'APPROVED').length;
  const emptyAvgRisk = emptyTotal > 0 ? Math.round(emptyList.reduce((sum, i) => sum + i.risk_score, 0) / emptyTotal) : 0;
  const emptyPassRate = emptyTotal > 0 ? Math.round((emptyApproved / emptyTotal) * 100) : 0;
  const emptyTotalValue = emptyList.reduce((sum, i) => sum + (i.extracted_entities?.total_declared_value || 0), 0);

  assert.strictEqual(emptyAvgRisk, 0, 'Empty list average risk must safely return 0 without NaN');
  assert.strictEqual(emptyPassRate, 0, 'Empty list pass rate must safely return 0 without NaN');
  assert.strictEqual(emptyTotalValue, 0, 'Empty list total value must safely return 0');
  console.log('  ✓ Verified KPI edge case: safe division with 0 items');

  // 3. Search filter edge cases:
  // 3a. Search by Audit ID
  const searchById = data.filter((item) => item.audit_id.toLowerCase().includes('aud-2026-us-89211'.toLowerCase()));
  assert.strictEqual(searchById.length, 1);
  assert.strictEqual(searchById[0].audit_id, 'AUD-2026-US-89211');

  // 3b. Search by Commodity / HS Code
  const searchByHS = data.filter((item) =>
    item.extracted_entities.items.some((it) => it.declared_hs_code.includes('8507') || it.item_description.toLowerCase().includes('battery'))
  );
  assert.strictEqual(searchByHS.length, 1);
  assert.strictEqual(searchByHS[0].destination_country, 'USA');

  // 3c. Search by Consignee Name (case-insensitive and partial match)
  const searchConsignee = data.filter((item) =>
    item.extracted_entities.consignee_name.toLowerCase().includes('bavaria')
  );
  assert.strictEqual(searchConsignee.length, 1);
  assert.strictEqual(searchConsignee[0].destination_country, 'EU');

  // 3d. Search by Discrepancy Keyword (e.g. 'CBAM')
  const searchCBAM = data.filter((item) =>
    item.compliance_discrepancies.some((d) => d.toLowerCase().includes('cbam'))
  );
  assert.strictEqual(searchCBAM.length, 1);
  assert.strictEqual(searchCBAM[0].audit_id, 'AUD-2026-EU-44102');

  // 3e. Search with non-matching gibberish returns 0 results
  const searchNonExistent = data.filter((item) => item.audit_id.toLowerCase().includes('xyz-nonexistent-123456'));
  assert.strictEqual(searchNonExistent.length, 0);
  console.log('  ✓ Verified multi-field search and partial matching edge cases');

  // 4. Status Filtering
  const approvedOnly = data.filter((item) => item.audit_status === 'APPROVED');
  assert.strictEqual(approvedOnly.length, 2);
  const flaggedOnly = data.filter((item) => item.audit_status === 'FLAGGED');
  assert.strictEqual(flaggedOnly.length, 2);
  const rejectedOnly = data.filter((item) => item.audit_status === 'REJECTED');
  assert.strictEqual(rejectedOnly.length, 2);
  console.log('  ✓ Verified status filtering');

  // 5. Country / Jurisdiction Filtering
  const usaOnly = data.filter((item) => item.destination_country === 'USA');
  assert.strictEqual(usaOnly.length, 2);
  const sgOnly = data.filter((item) => item.destination_country === 'Singapore');
  assert.strictEqual(sgOnly.length, 1);
  assert.strictEqual(sgOnly[0].audit_status, 'APPROVED');
  console.log('  ✓ Verified jurisdiction filtering');

  // 6. Risk Level Range Filtering
  const lowRisk = data.filter((item) => item.risk_score < 30);
  assert.strictEqual(lowRisk.length, 2);
  const moderateRisk = data.filter((item) => item.risk_score >= 30 && item.risk_score < 70);
  assert.strictEqual(moderateRisk.length, 1);
  const criticalRisk = data.filter((item) => item.risk_score >= 70);
  assert.strictEqual(criticalRisk.length, 3);
  console.log('  ✓ Verified risk score band filtering');

  // 7. Sorting Logic
  // 7a. Sort by Risk Score descending (highest risk first)
  const sortedByRiskDesc = [...data].sort((a, b) => b.risk_score - a.risk_score);
  assert.strictEqual(sortedByRiskDesc[0].risk_score, 91); // AUD-2026-US-10984
  assert.strictEqual(sortedByRiskDesc[sortedByRiskDesc.length - 1].risk_score, 8); // AUD-2026-JP-60312

  // 7b. Sort by Total Value descending (highest value first)
  const sortedByValueDesc = [...data].sort(
    (a, b) => (b.extracted_entities.total_declared_value || 0) - (a.extracted_entities.total_declared_value || 0)
  );
  assert.strictEqual(sortedByValueDesc[0].extracted_entities.total_declared_value, 490000); // Vaccines
  assert.strictEqual(sortedByValueDesc[sortedByValueDesc.length - 1].extracted_entities.total_declared_value, 67800); // Seafood

  // 7c. Sort by Timestamp descending (newest first)
  const sortedByTimeDesc = [...data].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  assert.ok(
    new Date(sortedByTimeDesc[0].timestamp).getTime() > new Date(sortedByTimeDesc[sortedByTimeDesc.length - 1].timestamp).getTime()
  );
  console.log('  ✓ Verified multi-field sorting (asc / desc)');

  console.log('✅ Dashboard Logic Tests Passed!\n');
}
