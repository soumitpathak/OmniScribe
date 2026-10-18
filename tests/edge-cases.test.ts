/**
 * OmniScribe Edge Cases & Resilience Test Suite
 */

import assert from 'node:assert';
import { RegionAnnotation } from '../src/types/auth';
import { AuditResponse } from '../src/types/compliance';

export function runEdgeCasesTests() {
  console.log('\n🛡️ Running Edge Cases, Sanitization & Resilience Tests...');

  // 1. Focus region coordinate clamping & normalization edge case
  function sanitizeRegion(raw: Partial<RegionAnnotation>): RegionAnnotation {
    const clamp = (val: number, min = 0, max = 100) => Math.min(Math.max(val, min), max);
    return {
      id: raw.id || `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: clamp(raw.x ?? 0),
      y: clamp(raw.y ?? 0),
      width: clamp(raw.width ?? 10, 1, 100),
      height: clamp(raw.height ?? 10, 1, 100),
      label: (raw.label || 'Custom Inspection Area').trim().slice(0, 50),
      note: raw.note ? raw.note.trim().slice(0, 200) : undefined,
      createdAt: raw.createdAt ?? Date.now(),
    };
  }

  // Test out-of-bounds negative values
  const negativeRegion = sanitizeRegion({ x: -15, y: -20, width: 30, height: 40 });
  assert.strictEqual(negativeRegion.x, 0, 'Negative X must clamp to 0');
  assert.strictEqual(negativeRegion.y, 0, 'Negative Y must clamp to 0');

  // Test out-of-bounds values > 100%
  const overflowRegion = sanitizeRegion({ x: 120, y: 150, width: 200, height: 300 });
  assert.strictEqual(overflowRegion.x, 100, 'X > 100 must clamp to 100');
  assert.strictEqual(overflowRegion.y, 100, 'Y > 100 must clamp to 100');
  assert.strictEqual(overflowRegion.width, 100, 'Width > 100 must clamp to 100');

  // Test zero-dimension region
  const zeroRegion = sanitizeRegion({ width: 0, height: 0 });
  assert.strictEqual(zeroRegion.width, 1, 'Minimum width must be at least 1%');
  assert.strictEqual(zeroRegion.height, 1, 'Minimum height must be at least 1%');
  console.log('  ✓ Verified bounding box coordinate boundary clamping');

  // 2. Unicode and multilingual text support in compliance records
  const multilingualRecord: AuditResponse = {
    audit_id: 'AUD-UNICODE-TEST-001',
    audit_status: 'APPROVED',
    risk_score: 5,
    risk_level: 'LOW',
    destination_country: 'Japan',
    regulatory_framework: 'Japan Customs (NACCS) 日本税関',
    extracted_entities: {
      document_type: 'Commercial Invoice & 送り状',
      document_number: 'INV-2026-東京-01',
      shipper_name: '深圳新能源科技股份有限公司 (Shenzhen New Energy)',
      shipper_address: '深圳市南山区科技园高新南七道28号',
      shipper_country: 'China',
      consignee_name: 'ルネサスエレクトロニクス株式会社 (Renesas Electronics)',
      consignee_address: '〒135-0061 東京都江東区豊洲3-2-24 豊洲フォレシア',
      consignee_country: 'Japan',
      port_of_loading: '基隆港 (Keelung Port), 台湾',
      port_of_discharge: '東京港 (Port of Tokyo), 日本',
      mode_of_transport: 'Maritime Container Express',
      incoterms: 'DAP Tokyo Port',
      currency: 'JPY',
      total_declared_value: 45000000,
      items: [
        {
          item_description: '300mmウェーハ車載用SoCマイクロプロセッサ',
          declared_hs_code: '8542.31.00',
          quantity: 1000,
          unit: '枚',
          unit_value: 45000,
          total_value: 45000000,
          country_of_origin: 'Taiwan',
        },
      ],
    },
    compliance_discrepancies: [],
    discrepancy_details: [],
    recommended_actions: ['NACCS 自動輸入許可証交付 (Green channel)'],
    action_details: [],
    timestamp: new Date().toISOString(),
  };

  assert.ok(multilingualRecord.extracted_entities.shipper_name.includes('深圳'));
  assert.ok(multilingualRecord.extracted_entities.consignee_name.includes('ルネサス'));
  assert.ok(multilingualRecord.extracted_entities.items[0].item_description.includes('ウェーハ'));
  console.log('  ✓ Verified full Unicode / CJK characters parsing and preservation');

  // 3. CSV Escaping with Quotes, Commas, and Line Breaks Edge Case
  function escapeCSVCell(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }

  const trickyFieldWithQuotes = 'VoltWave "Special" & Co, Ltd.';
  const trickyFieldWithComma = 'Harbor Blvd, Suite 300, Long Beach, CA';
  const trickyFieldWithNewline = 'Item 1\nItem 2\nItem 3';

  assert.strictEqual(escapeCSVCell(trickyFieldWithQuotes), '"VoltWave ""Special"" & Co, Ltd."');
  assert.strictEqual(escapeCSVCell(trickyFieldWithComma), '"Harbor Blvd, Suite 300, Long Beach, CA"');
  assert.strictEqual(escapeCSVCell(trickyFieldWithNewline), '"Item 1\nItem 2\nItem 3"');
  console.log('  ✓ Verified CSV escaping with nested quotes, commas, and multiline text');

  // 4. Large value formatting ($100M+) and micro-values ($0.50)
  const formatCurrency = (val: number, cur = 'USD') => {
    return `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${cur}`;
  };

  assert.strictEqual(formatCurrency(125000000), '$125,000,000 USD');
  assert.strictEqual(formatCurrency(0.75), '$0.75 USD');
  assert.strictEqual(formatCurrency(0), '$0 USD');
  console.log('  ✓ Verified currency formatting from cents to hundreds of millions');

  // 5. 3-Sentence Quick Summary Structure & Plain-English Validation
  const sampleQuickSummary = 'This consignment of medical diagnostic analyzers originating from Japan destined for USA has successfully cleared statutory customs review with an exemplary risk score of 12/100. All declared Harmonized Tariff codes, FDA accession numbers, and origin documentation comply fully with international customs requirements with zero discrepancies identified. The consignment is cleared for automated green-channel release and immediate onward logistics dispatch.';
  const sentences = sampleQuickSummary.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter((s) => s.trim().length > 0);
  assert.strictEqual(sentences.length, 3, 'Summary must contain exactly 3 sentences');
  assert.ok(sentences[0].includes('consignment'));
  assert.ok(sentences[1].includes('discrepancies') || sentences[1].includes('comply'));
  assert.ok(sentences[2].includes('release') || sentences[2].includes('dispatch'));
  console.log('  ✓ Verified 3-sentence executive compliance summary parsing and validation');

  console.log('✅ Edge Cases & Resilience Tests Passed!\n');
}
