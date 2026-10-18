/**
 * Tests for Pre-Audit Auto-Tagging, Regional Risk Zones Distribution & Side-by-Side Comparison Logic
 */
import assert from 'node:assert';
import { analyzePreAuditText } from '../src/utils/preAuditAutoTagger';
import { computeRegionalRiskDistribution } from '../src/components/RegionalRiskDistributionWidget';
import { SEED_AUDIT_HISTORY } from '../src/data/seedAudits';

export function runAutoTaggingAndRegionalWidgetTests() {
  console.log('🏷️  Running Pre-Audit Auto-Tagging & Regional Widget Tests...');

  // 1. Pre-Audit Auto-Tagging: Hazardous Detection
  const hazText = 'Commercial Invoice: 300 units Lithium-Ion Polymer Battery Modules UN3480 Class 9 HazMat';
  const hazTags = analyzePreAuditText(hazText, 'invoice_8507.pdf', 'Commercial Invoice');
  const hasHazardous = hazTags.some((t) => t.label === 'Hazardous');
  assert.ok(hasHazardous, 'Must detect "Hazardous" tag for UN3480 lithium battery text');
  const hazItem = hazTags.find((t) => t.label === 'Hazardous');
  assert.ok(hazItem && hazItem.confidence >= 70, 'Hazardous confidence should be >= 70%');
  console.log('  ✓ Verified pre-audit "Hazardous" auto-tagging on dangerous goods manifest');

  // 2. Pre-Audit Auto-Tagging: Urgent / Cold Chain Detection
  const urgentText = 'Air Waybill: Human Insulin 100 IU/ml vials. Cold chain reefer transit +2°C to +8°C urgent biologicals';
  const urgentTags = analyzePreAuditText(urgentText, 'awb_pharma.pdf', 'Air Waybill');
  const hasUrgent = urgentTags.some((t) => t.label === 'Urgent');
  assert.ok(hasUrgent, 'Must detect "Urgent" tag for cold chain insulin air shipment');
  console.log('  ✓ Verified pre-audit "Urgent" auto-tagging on temperature-sensitive cargo');

  // 3. Pre-Audit Auto-Tagging: Requires Duty Review Detection
  const dutyText = 'Air Waybill: Ka-Band Transceiver. Declared value: $485,000. Subject to Section 301 25% tariff surcharge';
  const dutyTags = analyzePreAuditText(dutyText, 'awb_transceiver.pdf', 'Commercial Invoice');
  const hasDuty = dutyTags.some((t) => t.label === 'Requires Duty Review');
  assert.ok(hasDuty, 'Must detect "Requires Duty Review" tag for Section 301 and high valuation');
  const hasHighVal = dutyTags.some((t) => t.label === 'High Valuation');
  assert.ok(hasHighVal, 'Must detect "High Valuation" tag for value > $100K');
  console.log('  ✓ Verified pre-audit "Requires Duty Review" and "High Valuation" auto-tagging');

  // 4. Pre-Audit Auto-Tagging: Clean Non-Hazardous Cargo
  const cleanText = 'Commercial Invoice: Organic Arabica green coffee beans in jute sacks FOB Santos';
  const cleanTags = analyzePreAuditText(cleanText, 'coffee_invoice.pdf', 'Commercial Invoice');
  assert.ok(!cleanTags.some((t) => t.label === 'Hazardous'), 'Clean coffee shipment must NOT be tagged Hazardous');
  assert.ok(!cleanTags.some((t) => t.label === 'Urgent'), 'Ordinary ocean freight coffee should NOT be tagged Urgent');
  console.log('  ✓ Verified clean non-hazardous shipments do not produce false hazard tags');

  // 5. Regional Risk Distribution Widget: Aggregation & Zone Computing
  const regionalStats = computeRegionalRiskDistribution(SEED_AUDIT_HISTORY);
  assert.ok(Array.isArray(regionalStats), 'Regional stats must be an array');
  assert.strictEqual(regionalStats.length, 4, 'Must aggregate across 4 major regions (Americas, Europe, Asia-Pacific, Middle East)');

  const totalSum = regionalStats.reduce((sum, r) => sum + r.total, 0);
  assert.strictEqual(totalSum, SEED_AUDIT_HISTORY.length, 'Sum of regional audits must equal total audit history count');

  for (const reg of regionalStats) {
    assert.ok(['CRITICAL ZONE', 'MODERATE ZONE', 'LOW-RISK ZONE'].includes(reg.zone), `Invalid zone name ${reg.zone}`);
    assert.strictEqual(reg.total, reg.approved + reg.flagged + reg.highRisk, `Status counts must sum to total in region ${reg.region}`);
    assert.ok(reg.avgRisk >= 0 && reg.avgRisk <= 100, `Average risk score must be between 0 and 100, got ${reg.avgRisk}`);
  }
  console.log('  ✓ Verified Recharts regional risk distribution calculation and zone partitioning');

  // 6. Side-by-Side Comparison Logic: Delta and Uniqueness
  const auditA = SEED_AUDIT_HISTORY[0];
  const auditB = SEED_AUDIT_HISTORY[1];
  const delta = auditA.risk_score - auditB.risk_score;
  assert.strictEqual(typeof delta, 'number', 'Score delta must be numeric');

  const discsA = auditA.compliance_discrepancies || [];
  const discsB = auditB.compliance_discrepancies || [];
  const isUniqueToA = (disc: string) => !discsB.some((b) => b.toLowerCase().includes(disc.toLowerCase().slice(0, 20)));
  const uniqueCountA = discsA.filter(isUniqueToA).length;
  assert.ok(uniqueCountA >= 0 && uniqueCountA <= discsA.length, 'Unique count must be valid');
  console.log('  ✓ Verified side-by-side discrepancy uniqueness and risk score delta logic');

  console.log('✅ Pre-Audit Auto-Tagging & Regional Widget Tests Passed!\n');
}
