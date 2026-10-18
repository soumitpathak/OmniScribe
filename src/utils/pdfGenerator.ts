import { jsPDF } from 'jspdf';
import { AuditResponse, LineItem } from '../types/compliance';

// Calculate risk intensity for PDF export
function getPdfItemRisk(item: LineItem, overallScore: number, auditStatus: string): {
  score: number;
  tier: string;
  isHigh: boolean;
} {
  let score = 12;
  const desc = (item.item_description || '').toLowerCase();
  const haz = (item.hazardous_class || '').toLowerCase();
  const flags = item.compliance_flags || [];

  if (haz.includes('class 9') || haz.includes('un3480') || haz.includes('un3481') || haz.includes('lithium') || desc.includes('lithium') || desc.includes('battery')) {
    score += 48;
  }
  if (haz.includes('5a002') || haz.includes('dual-use') || haz.includes('munitions') || desc.includes('ka-band') || desc.includes('transceiver') || desc.includes('cryptographic')) {
    score += 65;
  }
  if (haz.includes('temperature') || haz.includes('pharma') || haz.includes('biological') || desc.includes('insulin')) {
    score += 35;
  }
  for (const f of flags) {
    const fl = f.toLowerCase();
    if (fl.includes('unlicensed') || fl.includes('quarantine') || fl.includes('high-risk')) score += 25;
    else if (fl.includes('missing') || fl.includes('absent') || fl.includes('section 301')) score += 20;
    else score += 15;
  }
  if (item.verified_hs_code && item.declared_hs_code) {
    const d = item.declared_hs_code.replace(/[^0-9]/g, '').slice(0, 4);
    const v = item.verified_hs_code.replace(/[^0-9]/g, '').slice(0, 4);
    if (d !== v) score += 24;
  }
  if (auditStatus === 'REJECTED') score = Math.max(score, 75);
  else if (auditStatus === 'APPROVED' && score <= 25) score = Math.min(score, 18);
  else if (auditStatus === 'FLAGGED' && score <= 30) score = Math.max(score, 38);

  score = Math.min(99, Math.max(5, score));
  const tier = score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 50 ? 'ELEVATED' : score >= 26 ? 'MODERATE' : 'LOW';
  return { score, tier, isHigh: score >= 70 };
}

export function generateAuditPDF(audit: AuditResponse): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = margin + 5;
      drawMiniHeader();
    }
  };

  const drawMiniHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`OMNISCRIBE COMPLIANCE AUDIT — REF: ${audit.audit_id}`, margin, y);
    doc.text(`DESTINATION: ${audit.destination_country}`, pageWidth - margin, y, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 8;
  };

  // --- HEADER BANNER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 26, 'F');

  // Vector Company Logo Emblem
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(margin + 5, y + 4.5, 16, 16, 3, 3, 'F');
  doc.setFillColor(15, 23, 42); // slate-900 center cutout
  doc.circle(margin + 13, y + 12.5, 5, 'F');
  doc.setFillColor(16, 185, 129); // inner dot
  doc.circle(margin + 13, y + 12.5, 2.2, 'F');

  // Title & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('OMNISCRIBE', margin + 25, y + 10);

  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('AUTONOMOUS CROSS-BORDER REGULATORY COMPLIANCE & CONTINUOUS AUDIT AGENT', margin + 25, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Continuous Customs Clearance & Statutory Tariff Audit Dossier', margin + 25, y + 20);

  // Reference & Date on right of banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: ${audit.audit_id}`, pageWidth - margin - 5, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${new Date(audit.timestamp).toLocaleDateString()} ${new Date(audit.timestamp).toLocaleTimeString()}`, pageWidth - margin - 5, y + 15, { align: 'right' });
  doc.text(`Model: gemini-3.8-flash`, pageWidth - margin - 5, y + 21, { align: 'right' });

  y += 31;

  // --- STATUS & RISK HIGHLIGHT CARD ---
  let statusBg = [240, 253, 244]; // emerald-50
  let statusBorder = [16, 185, 129]; // emerald-500
  let statusText = [4, 120, 87]; // emerald-700
  if (audit.audit_status === 'REJECTED') {
    statusBg = [255, 241, 242]; // rose-50
    statusBorder = [244, 63, 94]; // rose-500
    statusText = [190, 18, 60]; // rose-700
  } else if (audit.audit_status === 'FLAGGED') {
    statusBg = [254, 252, 232]; // amber-50
    statusBorder = [245, 158, 11]; // amber-500
    statusText = [180, 83, 9]; // amber-700
  }

  // Draw Status Box
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.setDrawColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.setLineWidth(0.6);
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(statusText[0], statusText[1], statusText[2]);
  doc.text(`AUDIT VERDICT: ${audit.audit_status}`, margin + 6, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const statusNote = audit.audit_status === 'APPROVED'
    ? 'All statutory import prerequisites satisfied. Eligible for Automated Green-Channel Release.'
    : audit.audit_status === 'FLAGGED'
    ? 'Conditional entry alert: Pending statutory certificates or tariff surcharges require resolution.'
    : 'Entry Prohibited: Severe regulatory non-compliance detected. Consignment subject to mandatory quarantine hold.';
  doc.text(statusNote, margin + 6, y + 14);

  // Risk Score on right of status card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(statusText[0], statusText[1], statusText[2]);
  doc.text(`${audit.risk_score} / 100`, pageWidth - margin - 6, y + 9, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`RISK TIER: ${audit.risk_level}`, pageWidth - margin - 6, y + 14, { align: 'right' });

  // Risk Visual Gauge Bar
  const meterWidth = 44;
  const meterX = pageWidth - margin - meterWidth - 6;
  const meterY = y + 16.5;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(meterX, meterY, meterWidth, 2.5, 1, 1, 'F');
  doc.setFillColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.roundedRect(meterX, meterY, Math.max(3, (meterWidth * Math.min(100, audit.risk_score)) / 100), 2.5, 1, 1, 'F');

  y += 26;

  // --- EXECUTIVE SUMMARY OF COMPLIANCE FINDINGS ---
  const items = audit.extracted_entities?.items || [];
  const evaluatedItems = items.map((it) => getPdfItemRisk(it, audit.risk_score, audit.audit_status));
  const highRiskItemCount = evaluatedItems.filter((e) => e.isHigh).length;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE SUMMARY OF COMPLIANCE FINDINGS', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);

  // Key KPI bullets in 2 columns
  const col1Text = [
    `• Target Jurisdiction: ${audit.destination_country} (${audit.regulatory_framework.split('/')[0].trim()})`,
    `• Discrepancies Detected: ${audit.compliance_discrepancies.length} variance(s) identified`,
    `• Mandatory Remediation Actions: ${audit.recommended_actions.length} action item(s) required`,
  ];
  const col2Text = [
    `• High-Risk Cargo Flag: ${highRiskItemCount > 0 ? `${highRiskItemCount} high-risk line item(s) highlighted` : 'None (Compliant)'}`,
    `• Estimated Duty Assessment: ${audit.duty_tariff_analysis?.estimated_duty_rate || 'Standard Tariff'}`,
    `• Declared Cargo Value: ${audit.extracted_entities?.currency || 'USD'} $${Number(audit.extracted_entities?.total_declared_value || 0).toLocaleString()}`,
  ];

  col1Text.forEach((line, i) => {
    doc.text(line, margin + 4, y + 10 + i * 4);
  });
  col2Text.forEach((line, i) => {
    doc.text(line, margin + contentWidth / 2 + 2, y + 10 + i * 4);
  });

  y += 26;

  // --- SECTION 1: SHIPMENT & ROUTING DOSSIER ---
  const entities = audit.extracted_entities || {
    document_type: 'Logistics Manifest',
    document_number: 'N/A',
    document_date: new Date().toISOString().slice(0, 10),
    shipper_name: 'Not Declared',
    shipper_address: 'Address not listed',
    shipper_country: 'N/A',
    shipper_tax_id: undefined,
    consignee_name: 'Not Declared',
    consignee_address: 'Address not listed',
    consignee_country: 'N/A',
    consignee_tax_id: undefined,
    port_of_loading: 'N/A',
    port_of_discharge: 'N/A',
    mode_of_transport: 'Ocean / Air Cargo',
    incoterms: 'FOB',
    currency: 'USD',
    total_declared_value: 0,
    items: [],
  };

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. CONSIGNMENT & ROUTING DOSSIER', margin + 3, y + 4.5);
  y += 8;

  const colWidth = (contentWidth - 6) / 2;
  const dossierBoxHeight = 32;

  // Shipper Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, colWidth, dossierBoxHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SHIPPER / EXPORTER', margin + 3, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const shipperNameLines = doc.splitTextToSize(entities.shipper_name || 'N/A', colWidth - 6);
  doc.text(shipperNameLines, margin + 3, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const shipperAddrLines = doc.splitTextToSize(entities.shipper_address || 'Address not listed', colWidth - 6);
  doc.text(shipperAddrLines.slice(0, 2), margin + 3, y + 16);
  doc.text(`Origin: ${entities.shipper_country || 'N/A'} | Tax ID: ${entities.shipper_tax_id || 'N/A'}`, margin + 3, y + 27);

  // Consignee Box
  const col2X = margin + colWidth + 6;
  doc.rect(col2X, y, colWidth, dossierBoxHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CONSIGNEE / IMPORTER OF RECORD', col2X + 3, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const consigneeNameLines = doc.splitTextToSize(entities.consignee_name || 'N/A', colWidth - 6);
  doc.text(consigneeNameLines, col2X + 3, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const consigneeAddrLines = doc.splitTextToSize(entities.consignee_address || 'Address not listed', colWidth - 6);
  doc.text(consigneeAddrLines.slice(0, 2), col2X + 3, y + 16);
  doc.text(`Dest: ${entities.consignee_country || 'N/A'} | Tax ID: ${entities.consignee_tax_id || 'N/A'}`, col2X + 3, y + 27);

  y += dossierBoxHeight + 3;

  // Logistics metadata line
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const logisticsSummary = `Transport: ${entities.mode_of_transport || 'Ocean'} | POL: ${entities.port_of_loading || 'N/A'} | POD: ${entities.port_of_discharge || 'N/A'} | Incoterms: ${entities.incoterms || 'FOB'} | Declared: ${entities.currency || 'USD'} $${Number(entities.total_declared_value || 0).toLocaleString()}`;
  doc.text(logisticsSummary, margin + 3, y + 5);

  y += 12;

  // --- SECTION 2: LINE ITEMS & RISK-FACTOR INTENSITY TABLE ---
  checkPageBreak(38);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. CLASSIFIED LINE ITEMS & RISK-FACTOR INTENSITY (${entities.items?.length || 0})`, margin + 3, y + 4.5);
  y += 8;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text('ITEM DESCRIPTION', margin + 2, y + 4);
  doc.text('RISK INTENSITY', margin + 74, y + 4);
  doc.text('DECLARED / VERIFIED HS', margin + 110, y + 4);
  doc.text('QTY / UNIT', margin + 146, y + 4);
  doc.text('CUSTOMS VALUE', pageWidth - margin - 2, y + 4, { align: 'right' });
  y += 7;

  // Table Rows
  if (entities.items && entities.items.length > 0) {
    entities.items.forEach((item, idx) => {
      checkPageBreak(14);
      const evalItem = getPdfItemRisk(item, audit.risk_score, audit.audit_status);

      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y - 1, contentWidth, 11, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);

      const descText = item.item_description.length > 42 ? item.item_description.slice(0, 39) + '...' : item.item_description;
      doc.text(descText, margin + 2, y + 3);

      // Risk Intensity Pill
      if (evalItem.score >= 85) {
        doc.setTextColor(225, 29, 72); // rose-600
        doc.setFont('helvetica', 'bold');
        doc.text(`CRITICAL (${evalItem.score}%)`, margin + 74, y + 3);
      } else if (evalItem.score >= 70) {
        doc.setTextColor(234, 88, 12); // orange-600
        doc.setFont('helvetica', 'bold');
        doc.text(`HIGH (${evalItem.score}%)`, margin + 74, y + 3);
      } else if (evalItem.score >= 50) {
        doc.setTextColor(217, 119, 6); // amber-600
        doc.setFont('helvetica', 'normal');
        doc.text(`ELEVATED (${evalItem.score}%)`, margin + 74, y + 3);
      } else {
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.setFont('helvetica', 'normal');
        doc.text(`LOW (${evalItem.score}%)`, margin + 74, y + 3);
      }

      // HS Codes
      doc.setFont('courier', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`${item.declared_hs_code} → ${item.verified_hs_code || item.declared_hs_code}`, margin + 110, y + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${item.quantity} ${item.unit || 'PCS'}`, margin + 146, y + 3);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`$${Number(item.total_value || 0).toLocaleString()}`, pageWidth - margin - 2, y + 3, { align: 'right' });

      // Secondary details: Hazardous class or compliance warning
      if (item.hazardous_class || evalItem.isHigh) {
        doc.setFontSize(6);
        doc.setTextColor(225, 29, 72);
        const warnText = item.hazardous_class ? `⚠️ ${item.hazardous_class}` : '⚠️ High-Risk Compliance Classification';
        doc.text(warnText, margin + 2, y + 7.5);
      }

      y += 12;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No line items itemized in entry manifest.', margin + 3, y + 4);
    y += 8;
  }

  y += 4;

  // --- SECTION 3: COMPLIANCE DISCREPANCIES ---
  checkPageBreak(30);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`3. COMPLIANCE DISCREPANCIES & STATUTORY VARIANCES (${audit.compliance_discrepancies.length})`, margin + 3, y + 4.5);
  y += 8;

  if (audit.compliance_discrepancies.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text('✓ Zero compliance variances or regulatory violations identified in this docket.', margin + 3, y + 4);
    y += 8;
  } else {
    audit.compliance_discrepancies.forEach((disc, idx) => {
      checkPageBreak(12);
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(254, 205, 211);
      doc.rect(margin, y, contentWidth, 8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(225, 29, 72);
      doc.text(`[FLAG 0${idx + 1}]`, margin + 3, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const discLines = doc.splitTextToSize(disc, contentWidth - 25);
      doc.text(discLines[0] || '', margin + 22, y + 5);

      y += 10;
    });
  }

  y += 4;

  // --- SECTION 4: RECOMMENDED ACTIONS ---
  checkPageBreak(30);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`4. MANDATORY REMEDIATION ACTIONS (${audit.recommended_actions.length})`, margin + 3, y + 4.5);
  y += 8;

  if (audit.recommended_actions.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text('✓ Consignment is cleared for customs processing. No action required.', margin + 3, y + 4);
    y += 8;
  } else {
    audit.recommended_actions.forEach((act, idx) => {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(14, 116, 144); // cyan-700
      doc.text(`[ACTION ${idx + 1}]`, margin + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const actLines = doc.splitTextToSize(act, contentWidth - 26);
      doc.text(actLines, margin + 24, y + 4);
      y += 5 * actLines.length + 3;
    });
  }

  // --- SECTION 5: TARIFF & PGA SUMMARY ---
  checkPageBreak(22);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('5. TARIFF ASSESSMENT & PARTNER GOVERNMENT AGENCIES (PGA)', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const dutyRate = audit.duty_tariff_analysis?.estimated_duty_rate || '0.0% MFN';
  const agencies = audit.duty_tariff_analysis?.applicable_agencies?.join(', ') || 'Customs';
  doc.text(`Estimated Duty: ${dutyRate} | Involved Agencies: ${agencies}`, margin + 3, y + 9.5);

  y += 18;

  // --- FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('OmniScribe Autonomous Logistics Regulatory Intelligence • Certified Compliance Findings Report', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Trigger download
  doc.save(`OmniScribe_Compliance_Report_${audit.audit_id}.pdf`);
}
