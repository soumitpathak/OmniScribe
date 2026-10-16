import { jsPDF } from 'jspdf';
import { AuditResponse } from '../types/compliance';

export interface AuditorMetadata {
  name?: string | null;
  email?: string | null;
  uid?: string | null;
}

export function generateAuditPDF(audit: AuditResponse, auditor?: AuditorMetadata): void {
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
    if (y + neededHeight > pageHeight - 18) {
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
    doc.text(`DESTINATION: ${audit.destination_country} (${audit.regulatory_framework.split('/')[0].trim()})`, pageWidth - margin, y, {
      align: 'right',
    });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 8;
  };

  // --- HEADER BANNER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 28, 'F');

  // Title & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('OMNISCRIBE', margin + 5, y + 9);

  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('AUTONOMOUS CROSS-BORDER REGULATORY COMPLIANCE AGENT', margin + 5, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'Official Customs Verification Dossier & Harmonized Tariff Audit Slip',
    margin + 5,
    y + 21
  );

  // Reference & Date on right of banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: ${audit.audit_id}`, pageWidth - margin - 5, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Date: ${new Date(audit.timestamp).toLocaleDateString()} ${new Date(audit.timestamp).toLocaleTimeString()}`,
    pageWidth - margin - 5,
    y + 15,
    { align: 'right' }
  );
  doc.text(
    `Engine: Gemini 3.8 Flash | Destination: ${audit.destination_country}`,
    pageWidth - margin - 5,
    y + 21,
    { align: 'right' }
  );

  y += 33;

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
  const statusNote =
    audit.audit_status === 'APPROVED'
      ? 'All statutory import prerequisites satisfied. Eligible for Automated Green-Channel Release.'
      : audit.audit_status === 'FLAGGED'
      ? 'Conditional entry alert: Pending statutory certificates or tariff surcharges require officer review.'
      : 'Entry Prohibited: Severe regulatory non-compliance detected. Consignment subject to mandatory quarantine hold.';
  doc.text(statusNote, margin + 6, y + 14);

  // Auditor Endorsement line inside banner if present
  if (auditor?.name || auditor?.email) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`CERTIFIED BY AUDITOR: ${auditor.name || auditor.email}`, margin + 6, y + 19);
  }

  // Risk Score on right of status card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(statusText[0], statusText[1], statusText[2]);
  doc.text(`${audit.risk_score}/100`, pageWidth - margin - 6, y + 11, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`RISK LEVEL: ${audit.risk_level}`, pageWidth - margin - 6, y + 16, { align: 'right' });

  y += 26;

  // --- SECTION 1: SHIPMENT & ROUTING DOSSIER ---
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
  const shipperNameLines = doc.splitTextToSize(
    audit.extracted_entities?.shipper_name || 'N/A',
    colWidth - 6
  );
  doc.text(shipperNameLines, margin + 3, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const shipperAddrLines = doc.splitTextToSize(
    audit.extracted_entities?.shipper_address || 'Address not listed',
    colWidth - 6
  );
  doc.text(shipperAddrLines.slice(0, 2), margin + 3, y + 16);
  doc.text(
    `Origin: ${audit.extracted_entities?.shipper_country || 'N/A'} | Tax ID: ${
      audit.extracted_entities?.shipper_tax_id || 'N/A'
    }`,
    margin + 3,
    y + 27
  );

  // Consignee Box
  const col2X = margin + colWidth + 6;
  doc.rect(col2X, y, colWidth, dossierBoxHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CONSIGNEE / IMPORTER OF RECORD', col2X + 3, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const consigneeNameLines = doc.splitTextToSize(
    audit.extracted_entities?.consignee_name || 'N/A',
    colWidth - 6
  );
  doc.text(consigneeNameLines, col2X + 3, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const consigneeAddrLines = doc.splitTextToSize(
    audit.extracted_entities?.consignee_address || 'Address not listed',
    colWidth - 6
  );
  doc.text(consigneeAddrLines.slice(0, 2), col2X + 3, y + 16);
  doc.text(
    `Dest: ${audit.extracted_entities?.consignee_country || 'N/A'} | Tax ID: ${
      audit.extracted_entities?.consignee_tax_id || 'N/A'
    }`,
    col2X + 3,
    y + 27
  );

  y += dossierBoxHeight + 3;

  // Logistics quick metadata line
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const logisticsSummary = `Transport: ${
    audit.extracted_entities?.mode_of_transport || 'Ocean'
  } | POL: ${audit.extracted_entities?.port_of_loading || 'N/A'} | POD: ${
    audit.extracted_entities?.port_of_discharge || 'N/A'
  } | Incoterms: ${audit.extracted_entities?.incoterms || 'FOB'} | Declared Value: ${
    audit.extracted_entities?.currency || 'USD'
  } $${Number(audit.extracted_entities?.total_declared_value || 0).toLocaleString()}`;
  doc.text(logisticsSummary, margin + 3, y + 5);

  y += 12;

  // --- SECTION 2: LINE ITEMS TABLE ---
  checkPageBreak(35);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `2. CLASSIFIED LINE ITEMS (${audit.extracted_entities?.items?.length || 0})`,
    margin + 3,
    y + 4.5
  );
  y += 8;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text('ITEM DESCRIPTION', margin + 2, y + 4);
  doc.text('DECLARED HS', margin + 80, y + 4);
  doc.text('VERIFIED HS', margin + 110, y + 4);
  doc.text('QTY / UNIT', margin + 140, y + 4);
  doc.text('CUSTOMS VALUE', pageWidth - margin - 2, y + 4, { align: 'right' });
  y += 7;

  // Table Rows
  if (audit.extracted_entities?.items && audit.extracted_entities.items.length > 0) {
    audit.extracted_entities.items.forEach((item, idx) => {
      checkPageBreak(12);
      doc.setFillColor(
        idx % 2 === 0 ? 255 : 248,
        idx % 2 === 0 ? 255 : 250,
        idx % 2 === 0 ? 255 : 252
      );
      doc.rect(margin, y - 1, contentWidth, 9, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);

      const descText =
        item.item_description.length > 45
          ? item.item_description.slice(0, 42) + '...'
          : item.item_description;
      doc.text(descText, margin + 2, y + 3);

      doc.setFont('courier', 'bold');
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text(item.declared_hs_code || 'N/A', margin + 80, y + 3);

      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(item.verified_hs_code || item.declared_hs_code || 'Matched', margin + 110, y + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${item.quantity} ${item.unit || 'PCS'}`, margin + 140, y + 3);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `$${Number(item.total_value || 0).toLocaleString()}`,
        pageWidth - margin - 2,
        y + 3,
        { align: 'right' }
      );

      // If hazardous flag
      if (item.hazardous_class) {
        doc.setFontSize(6);
        doc.setTextColor(225, 29, 72);
        doc.text(`[DG CLASS] ${item.hazardous_class}`, margin + 2, y + 7);
      }

      y += 10;
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
  doc.text(
    `3. COMPLIANCE DISCREPANCIES & STATUTORY VARIANCES (${audit.compliance_discrepancies?.length || 0})`,
    margin + 3,
    y + 4.5
  );
  y += 8;

  if (!audit.compliance_discrepancies || audit.compliance_discrepancies.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text(
      '✓ Zero compliance variances or regulatory violations identified in this docket.',
      margin + 3,
      y + 4
    );
    y += 8;
  } else {
    audit.compliance_discrepancies.forEach((disc, idx) => {
      checkPageBreak(14);
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(254, 205, 211);
      doc.rect(margin, y, contentWidth, 9, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(225, 29, 72);
      doc.text(`[FLAG 0${idx + 1}]`, margin + 3, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const discLines = doc.splitTextToSize(disc, contentWidth - 25);
      doc.text(discLines[0] || '', margin + 22, y + 5.5);

      y += 11;
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
  doc.text(
    `4. MANDATORY REMEDIATION ACTIONS (${audit.recommended_actions?.length || 0})`,
    margin + 3,
    y + 4.5
  );
  y += 8;

  if (!audit.recommended_actions || audit.recommended_actions.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text(
      '✓ Consignment is cleared for customs processing. No action required.',
      margin + 3,
      y + 4
    );
    y += 8;
  } else {
    audit.recommended_actions.forEach((act, idx) => {
      checkPageBreak(12);
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
  const cbam = audit.duty_tariff_analysis?.cbam_or_carbon_applicable ? 'Yes (CBAM reporting required)' : 'No';
  doc.text(
    `Estimated Duty: ${dutyRate} | Involved Agencies: ${agencies} | CBAM / Carbon Duty: ${cbam}`,
    margin + 3,
    y + 9.5
  );

  y += 18;

  // --- SECTION 6: AGENT REASONING TRAIL ---
  if (audit.agent_reasoning_trace && audit.agent_reasoning_trace.length > 0) {
    checkPageBreak(30);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('6. REGULATORY AUDIT LOG & REASONING TRACE', margin + 3, y + 4.5);
    y += 8;

    audit.agent_reasoning_trace.forEach((step, idx) => {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`STEP 0${idx + 1}:`, margin + 3, y + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      const traceLines = doc.splitTextToSize(step, contentWidth - 24);
      doc.text(traceLines, margin + 20, y + 3.5);
      y += 4 * traceLines.length + 2;
    });

    y += 4;
  }

  // --- SECTION 7: OFFICIAL CUSTOMS VERIFICATION & SIGN-OFF BLOCK ---
  checkPageBreak(42);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 36, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('7. OFFICIAL CUSTOMS VERIFICATION & OFFICER ENDORSEMENT', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This verification docket is generated for offline record-keeping and official presentation to Customs Officers.',
    margin + 4,
    y + 9
  );

  // Signatures split
  const signColWidth = (contentWidth - 12) / 3;

  // Box 1: Inspecting Auditor / Declarant
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, y + 25, margin + 4 + signColWidth, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('AUDITOR / BROKER SIGNATURE', margin + 4, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(auditor?.name || auditor?.email || 'Authorized Declarant', margin + 4, y + 33);

  // Box 2: Customs Officer Endorsement
  const box2X = margin + 4 + signColWidth + 4;
  doc.line(box2X, y + 25, box2X + signColWidth, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CUSTOMS OFFICER SIGN-OFF', box2X, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Badge / Officer ID: ________________', box2X, y + 33);

  // Box 3: Official Customs Release Stamp Box
  const box3X = box2X + signColWidth + 4;
  doc.setDrawColor(203, 213, 225);
  doc.rect(box3X, y + 14, signColWidth, 19, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('[ OFFICIAL PORT STAMP ]', box3X + signColWidth / 2, y + 24, { align: 'center' });

  y += 42;

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
    doc.text(
      'OmniScribe Autonomous Logistics Regulatory Intelligence • Certified Customs Verification Slip',
      margin,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Trigger download
  doc.save(`OmniScribe_Customs_Audit_${audit.audit_id}.pdf`);
}
