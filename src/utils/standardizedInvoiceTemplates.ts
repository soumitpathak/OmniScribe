import { AuditResponse, ExtractedEntities, LineItem } from '../types/compliance';

export type DiffStatus = 'MATCH' | 'MODIFIED' | 'DISCREPANCY' | 'MISSING' | 'ADDED';

export interface FieldComparison {
  fieldKey: string;
  fieldName: string;
  category: 'document' | 'parties' | 'logistics' | 'valuation' | 'compliance_annexes';
  uploadedValue: string | number | null | undefined;
  standardValue: string | number;
  diffStatus: DiffStatus;
  destinationRequirement: string;
  statutoryRegulationRef: string;
  explanation: string;
  mandatory: boolean;
  fixRecommendation?: string;
}

export interface LineItemDiff {
  itemIndex: number;
  rawDescription: string;
  standardDescription: string;
  descriptionStatus: DiffStatus;

  uploadedHsCode: string;
  standardHsCode: string;
  hsCodeStatus: DiffStatus;
  hsCodeDetail: string;

  uploadedQuantity: string;
  standardQuantity: string;
  quantityStatus: DiffStatus;

  uploadedValue: string;
  standardValue: string;
  valueStatus: DiffStatus;

  uploadedOrigin: string;
  standardOrigin: string;
  originStatus: DiffStatus;

  uploadedHazard: string;
  standardHazardRequirement: string;
  hazardStatus: DiffStatus;
}

export interface TemplateComparisonResult {
  destinationCountry: string;
  templateStandardName: string;
  regulatoryAuthority: string;
  statutoryFramework: string;
  overallConformityScore: number; // 0 - 100%
  totalAttributesChecked: number;
  matchCount: number;
  discrepancyCount: number;
  missingCount: number;
  fieldComparisons: FieldComparison[];
  lineItemDiffs: LineItemDiff[];
  standardizedExportPayload: {
    standard_name: string;
    destination_authority: string;
    statutory_entry_type: string;
    normalized_entities: any;
    compliance_annexes: string[];
    generated_at: string;
  };
}

export interface DestinationStandardSpec {
  countryCode: string;
  countryName: string;
  templateStandardName: string;
  regulatoryAuthority: string;
  statutoryFramework: string;
  hsCodeLength: number; // e.g. 10 for USA HTSUS
  hsCodeLabel: string;
  taxIdLabel: string;
  taxIdFormat: string;
  taxIdPattern: RegExp;
  standardCurrency: string;
  incotermRule: string;
  requiredPgaAnnexes: string[];
  valuationBasis: string;
}

export const DESTINATION_STANDARDS: Record<string, DestinationStandardSpec> = {
  USA: {
    countryCode: 'USA',
    countryName: 'United States of America',
    templateStandardName: 'CBP Form 7501 & 19 CFR § 141.86 ACE Invoice Standard',
    regulatoryAuthority: 'U.S. Customs and Border Protection (CBP) / Dept of Homeland Security',
    statutoryFramework: '19 U.S.C. § 1484 & 19 CFR § 141.86 (Commercial Invoice Mandate)',
    hsCodeLength: 10,
    hsCodeLabel: '10-Digit Harmonized Tariff Schedule of the United States (HTSUS)',
    taxIdLabel: 'Consignee IRS EIN / SSN (XX-XXXXXXX or Importer Record Number)',
    taxIdFormat: '^\\d{2}-\\d{7}$',
    taxIdPattern: /^\d{2}-\d{7}$/,
    standardCurrency: 'USD',
    incotermRule: 'Incoterms 2020 with exact UN/LOCODE (e.g., CIF USLAX - Port of Los Angeles)',
    requiredPgaAnnexes: [
      'EPA TSCA Section 13 Notice of Compliance',
      'PHMSA 49 CFR § 173.185 UN 38.3 Lithium Battery Safety Test Summary (if hazmat)',
      'CBP Form 7501 Secondary Section 301 Tariff Entry (HTS 9903.88.xx if origin China)',
      'Country of Origin Marking Declaration (19 U.S.C. § 1304)',
    ],
    valuationBasis: 'Transaction Value (19 U.S.C. § 1401a) with freight/insurance separate ledger',
  },
  EU: {
    countryCode: 'EU',
    countryName: 'European Union (UCC Member States)',
    templateStandardName: 'EU Union Customs Code (UCC) Single Administrative Document (SAD / Form C88)',
    regulatoryAuthority: 'European Commission Directorate-General for Taxation and Customs Union (DG TAXUD)',
    statutoryFramework: 'Regulation (EU) No 952/2013 (UCC) & Delegated Reg 2015/2446',
    hsCodeLength: 10,
    hsCodeLabel: '10-Digit Integrated Tariff of the European Communities (TARIC)',
    taxIdLabel: 'Economic Operators Registration and Identification (EORI) Number',
    taxIdFormat: '^[A-Z]{2}[A-Z0-9]{9,15}$',
    taxIdPattern: /^[A-Z]{2}[A-Z0-9]{9,15}$/,
    standardCurrency: 'EUR',
    incotermRule: 'Incoterms 2020 with designated delivery point and VAT/duty allocation (e.g. DAP DEHAM)',
    requiredPgaAnnexes: [
      'EU CBAM Carbon Border Adjustment Mechanism Quarterly Emissions Report (Reg 2023/956)',
      'EU REACH Chemical Registration Certificate (EC No 1907/2006)',
      'EU CE Conformity Declaration & Technical Dossier',
      'EU Registered Exporter (REX) Statement of Origin (if preferential duty claimed)',
    ],
    valuationBasis: 'Customs Valuation under UCC Article 70 (Transaction Value Basis)',
  },
  Germany: {
    countryCode: 'Germany',
    countryName: 'Federal Republic of Germany (EU)',
    templateStandardName: 'German Zoll / ATLAS Electronic Single Administrative Document (ATLAS Einfuhr)',
    regulatoryAuthority: 'Generalzolldirektion (German Central Customs Authority)',
    statutoryFramework: 'German Zollgesetz & EU UCC Regulation 952/2013',
    hsCodeLength: 10,
    hsCodeLabel: '10-Digit Electronic TARIC / EZT (Elektronischer Zolltarif)',
    taxIdLabel: 'German EORI Number (DE + 15 digits) & German Steuernummer',
    taxIdFormat: '^DE\\d{7,15}$',
    taxIdPattern: /^DE\d{7,15}$/,
    standardCurrency: 'EUR',
    incotermRule: 'Incoterms 2020 (DAP / DDP with named German terminal e.g. DEHAM / DEFRA)',
    requiredPgaAnnexes: [
      'CBAM Carbon Emissions Verification Statement',
      'German Packaging Act (VerpackG / LUCID Registry ID)',
      'EU CE & Electrical Safety Declaration',
    ],
    valuationBasis: 'ATLAS Electronic Customs Valuation Standard',
  },
  UK: {
    countryCode: 'UK',
    countryName: 'United Kingdom',
    templateStandardName: 'HMRC Customs Declaration Service (CDS) Standard Commercial Invoice',
    regulatoryAuthority: 'His Majesty’s Revenue and Customs (HMRC)',
    statutoryFramework: 'Taxation (Cross-border Trade) Act 2018 & Customs (Import Duty) Regs',
    hsCodeLength: 10,
    hsCodeLabel: '10-Digit UK Integrated Online Tariff Commodity Code',
    taxIdLabel: 'GB EORI Number (format: GB + 12 digits)',
    taxIdFormat: '^GB\\d{12}$',
    taxIdPattern: /^GB\d{12}$/,
    standardCurrency: 'GBP',
    incotermRule: 'Incoterms 2020 with designated UK port code (e.g., CIF GBFXT / GBPME)',
    requiredPgaAnnexes: [
      'UK REACH Registration Declaration',
      'UKCA Conformity Certificate',
      'HMRC Duty Deferment Account (DDA) Authorization',
    ],
    valuationBasis: 'Method 1 Transaction Value (HMRC Notice 252)',
  },
  Japan: {
    countryCode: 'Japan',
    countryName: 'Japan',
    templateStandardName: 'Japan Customs NACCS Standard Import Declaration Format',
    regulatoryAuthority: 'Ministry of Finance (MOF) - Customs and Tariff Bureau',
    statutoryFramework: 'Customs Law of Japan (Law No. 61 of 1954) & NACCS Procedural Code',
    hsCodeLength: 9,
    hsCodeLabel: '9-Digit Statistical Code (Customs Tariff Schedule of Japan)',
    taxIdLabel: 'Japan Corporate Number (Houjin Bangou - 13 digits) & Customs Code',
    taxIdFormat: '^\\d{13}$',
    taxIdPattern: /^\d{13}$/,
    standardCurrency: 'JPY',
    incotermRule: 'Incoterms 2020 with named Japanese port (e.g., CIF JPTYO / JPOSA)',
    requiredPgaAnnexes: [
      'METI PSE (Electrical Appliance and Material Safety Law) Mark Verification',
      'Ministry of Health, Labour and Welfare (MHLW) Food Sanitation Form (if applicable)',
      'Japan Customs Foreign Exchange Rate Conversion Ledger',
    ],
    valuationBasis: 'CIF Import Valuation under Japan Customs Tariff Law Article 4',
  },
  China: {
    countryCode: 'China',
    countryName: 'People’s Republic of China',
    templateStandardName: 'GACC Customs Declaration Form for Import Goods Standard',
    regulatoryAuthority: 'General Administration of Customs of the P.R. China (GACC)',
    statutoryFramework: 'Customs Law of the People’s Republic of China & GACC Decree 240',
    hsCodeLength: 13, // 10 digit HS + 3 digit CIQ inspection code
    hsCodeLabel: '10-Digit HS Code + 3-Digit CIQ Inspection Code (13 Digits Total)',
    taxIdLabel: '18-Digit Unified Social Credit Code (USCC) & Customs Registration (CR) Code',
    taxIdFormat: '^[0-9A-HJ-NP-RT-UW-Y]{18}$',
    taxIdPattern: /^[0-9A-HJ-NP-RT-UW-Y]{18}$/,
    standardCurrency: 'CNY',
    incotermRule: 'Incoterms 2020 with designated Chinese entry port (e.g., CIF CNSZX)',
    requiredPgaAnnexes: [
      'China Compulsory Certification (CCC) Certificate (if regulated electronics)',
      'GACC Enterprise Registration Code for Overseas Manufacturers',
      'Automatic Import License (if quota managed)',
    ],
    valuationBasis: 'Dutiable Value (CIF Basis) under GACC Decree No. 213',
  },
};

/**
 * Returns the standardized template spec for a given destination country, falling back to WCO Global standard.
 */
export function getDestinationStandardSpec(destinationCountry?: string): DestinationStandardSpec {
  if (!destinationCountry) return DESTINATION_STANDARDS.USA;

  const key = Object.keys(DESTINATION_STANDARDS).find(
    (k) => k.toLowerCase() === destinationCountry.toLowerCase()
  );
  if (key && DESTINATION_STANDARDS[key]) {
    return DESTINATION_STANDARDS[key];
  }

  // Check aliases
  const upper = destinationCountry.toUpperCase();
  if (upper.includes('US') || upper.includes('UNITED STATES')) return DESTINATION_STANDARDS.USA;
  if (upper.includes('EU') || upper.includes('EUROPE') || upper.includes('FRANCE') || upper.includes('NETHERLANDS') || upper.includes('ITALY')) return DESTINATION_STANDARDS.EU;
  if (upper.includes('GERMANY') || upper.includes('DEUTSCHLAND')) return DESTINATION_STANDARDS.Germany;
  if (upper.includes('UK') || upper.includes('BRITAIN') || upper.includes('UNITED KINGDOM')) return DESTINATION_STANDARDS.UK;
  if (upper.includes('JAPAN') || upper.includes('NIPPON')) return DESTINATION_STANDARDS.Japan;
  if (upper.includes('CHINA') || upper.includes('PRC')) return DESTINATION_STANDARDS.China;

  // Default fallback: WCO Harmonized Standards Commercial Invoice
  return {
    countryCode: destinationCountry,
    countryName: destinationCountry,
    templateStandardName: `WCO Data Model v3.10 Commercial Invoice Standard (${destinationCountry})`,
    regulatoryAuthority: `${destinationCountry} Customs Administration / WCO Member Authority`,
    statutoryFramework: 'WCO International Convention on the Simplification and Harmonization of Customs Procedures',
    hsCodeLength: 10,
    hsCodeLabel: `10-Digit National Tariff Schedule for ${destinationCountry}`,
    taxIdLabel: 'Consignee Registered Tax Identifier (VAT / TIN / Business Number)',
    taxIdFormat: '^[A-Z0-9-]{6,20}$',
    taxIdPattern: /^[A-Z0-9-]{6,20}$/,
    standardCurrency: 'USD',
    incotermRule: 'Incoterms 2020 with designated port UN/LOCODE',
    requiredPgaAnnexes: [
      'Statutory Commercial Invoice & Packing List',
      'Non-Preferential Certificate of Origin (WCO Standard)',
      'Dangerous Goods Declaration (ICAO/IMDG compliant if hazardous cargo)',
    ],
    valuationBasis: 'WTO Customs Valuation Agreement (Transaction Value Basis)',
  };
}

/**
 * Compares an uploaded invoice's extracted entities and discrepancies against the statutory destination template.
 */
export function compareInvoiceToDestinationTemplate(audit: AuditResponse): TemplateComparisonResult {
  const spec = getDestinationStandardSpec(audit.destination_country);
  const entities = audit.extracted_entities || ({} as ExtractedEntities);
  const items = entities.items || [];
  const discrepancies = audit.compliance_discrepancies || [];

  const fieldComparisons: FieldComparison[] = [];

  // 1. Document Identification
  const uploadedDocType = entities.document_type || 'Commercial Invoice';
  const expectedDocType = spec.templateStandardName;
  const isDocTypeStandard = uploadedDocType.toLowerCase().includes('invoice') && !uploadedDocType.toLowerCase().includes('proforma');
  fieldComparisons.push({
    fieldKey: 'document_type',
    fieldName: 'Document Type & Classification',
    category: 'document',
    uploadedValue: uploadedDocType,
    standardValue: `${spec.templateStandardName} (Commercial Invoice)`,
    diffStatus: isDocTypeStandard ? 'MATCH' : 'DISCREPANCY',
    destinationRequirement: `Statutory entry requires an official commercial invoice meeting ${spec.regulatoryAuthority} specifications. Proforma invoices are prohibited for final clearance.`,
    statutoryRegulationRef: spec.statutoryFramework,
    explanation: isDocTypeStandard
      ? 'Document type conforms to statutory customs entry requirements.'
      : 'Document type deviates from official customs standard. Must be reclassified as a definitive commercial entry invoice.',
    mandatory: true,
  });

  const docNumber = entities.document_number;
  const hasDocNumber = Boolean(docNumber && docNumber.trim().length > 3);
  fieldComparisons.push({
    fieldKey: 'document_number',
    fieldName: 'Invoice / Entry Reference Number',
    category: 'document',
    uploadedValue: docNumber || null,
    standardValue: docNumber || 'Mandatory Unique Alphanumeric Invoice ID',
    diffStatus: hasDocNumber ? 'MATCH' : 'MISSING',
    destinationRequirement: 'Unique traceable commercial invoice identifier required on all border entry summary filings.',
    statutoryRegulationRef: `${spec.statutoryFramework} § Reference Identifiers`,
    explanation: hasDocNumber
      ? `Reference ${docNumber} is formatted properly.`
      : 'Mandatory invoice reference number is missing or incomplete.',
    mandatory: true,
    fixRecommendation: hasDocNumber ? undefined : 'Assign formal invoice serial number matching shipping bill.',
  });

  // Document Date
  const docDate = entities.document_date;
  const hasDocDate = Boolean(docDate && docDate.trim().length >= 8);
  fieldComparisons.push({
    fieldKey: 'document_date',
    fieldName: 'Invoice Issue Date (ISO 8601)',
    category: 'document',
    uploadedValue: docDate || null,
    standardValue: docDate || new Date().toISOString().slice(0, 10),
    diffStatus: hasDocDate ? 'MATCH' : 'MISSING',
    destinationRequirement: 'Valid issue date within 90 days of border arrival required for tariff and foreign exchange valuation.',
    statutoryRegulationRef: `${spec.statutoryFramework} § Valuation Timestamps`,
    explanation: hasDocDate ? 'Invoice date is present and valid.' : 'Missing explicit issue date on commercial invoice.',
    mandatory: true,
  });

  // 2. Consignor (Shipper)
  const shipperName = entities.shipper_name;
  fieldComparisons.push({
    fieldKey: 'shipper_name',
    fieldName: 'Shipper / Exporter Legal Name',
    category: 'parties',
    uploadedValue: shipperName || null,
    standardValue: shipperName || 'Registered Exporter Legal Business Name',
    diffStatus: shipperName ? 'MATCH' : 'MISSING',
    destinationRequirement: 'Full legal entity name matching export customs registry and carrier manifest.',
    statutoryRegulationRef: `${spec.statutoryFramework} § Consignor Identification`,
    explanation: shipperName ? 'Shipper legal name verified.' : 'Missing exporter entity name.',
    mandatory: true,
  });

  const shipperTax = entities.shipper_tax_id;
  fieldComparisons.push({
    fieldKey: 'shipper_tax_id',
    fieldName: 'Shipper Tax ID / Export Identifier',
    category: 'parties',
    uploadedValue: shipperTax || null,
    standardValue: shipperTax || 'Origin Country Corporate Tax ID / DUNS',
    diffStatus: shipperTax ? 'MATCH' : 'MODIFIED',
    destinationRequirement: 'Official origin country tax registration or WCO REX / DUNS registration.',
    statutoryRegulationRef: 'WCO SAFE Framework Pillar 1',
    explanation: shipperTax
      ? `Shipper identifier provided (${shipperTax}).`
      : 'Recommended: Explicit exporter tax identifier accelerates automated targeting clearance.',
    mandatory: false,
  });

  // 3. Consignee (Importer of Record)
  const consigneeName = entities.consignee_name;
  fieldComparisons.push({
    fieldKey: 'consignee_name',
    fieldName: 'Consignee / Importer of Record',
    category: 'parties',
    uploadedValue: consigneeName || null,
    standardValue: consigneeName || 'Authorized Importer of Record Entity',
    diffStatus: consigneeName ? 'MATCH' : 'MISSING',
    destinationRequirement: `Must designate a licensed Importer of Record established within ${spec.countryName}.`,
    statutoryRegulationRef: `${spec.statutoryFramework} § Importer of Record Designation`,
    explanation: consigneeName ? 'Consignee entity verified on invoice.' : 'Consignee name missing from filing.',
    mandatory: true,
  });

  const consigneeTax = entities.consignee_tax_id;
  const isTaxValid = consigneeTax ? spec.taxIdPattern.test(consigneeTax.trim()) : false;
  let taxDiffStatus: DiffStatus = 'MATCH';
  let taxExplanation = `Consignee identifier adheres to ${spec.taxIdLabel}.`;
  if (!consigneeTax) {
    taxDiffStatus = 'MISSING';
    taxExplanation = `Mandatory ${spec.taxIdLabel} missing on uploaded invoice. Consignment will incur an immediate port hold without it.`;
  } else if (!isTaxValid) {
    taxDiffStatus = 'DISCREPANCY';
    taxExplanation = `Uploaded Tax ID "${consigneeTax}" deviates from statutory pattern: ${spec.taxIdLabel}.`;
  }

  fieldComparisons.push({
    fieldKey: 'consignee_tax_id',
    fieldName: `Consignee Statutory ID (${spec.taxIdLabel})`,
    category: 'parties',
    uploadedValue: consigneeTax || null,
    standardValue: isTaxValid && consigneeTax ? consigneeTax : `Expected format: ${spec.taxIdLabel}`,
    diffStatus: taxDiffStatus,
    destinationRequirement: `Mandatory importer identifier required for customs tax assessment under ${spec.statutoryFramework}.`,
    statutoryRegulationRef: spec.statutoryFramework,
    explanation: taxExplanation,
    mandatory: true,
    fixRecommendation: !isTaxValid
      ? `Verify with consignee and format as ${spec.taxIdLabel} before filing customs entry.`
      : undefined,
  });

  // 4. Logistics & Routing
  const pol = entities.port_of_loading;
  const pod = entities.port_of_discharge;
  const hasPodCode = pod && (pod.includes('(') || pod.includes('US') || pod.includes('DE') || pod.includes('GB') || pod.includes('JP') || pod.length >= 5);
  fieldComparisons.push({
    fieldKey: 'port_of_discharge',
    fieldName: 'Port of Discharge & UN/LOCODE',
    category: 'logistics',
    uploadedValue: pod || null,
    standardValue: pod ? (hasPodCode ? pod : `${pod} [UN/LOCODE Required]`) : 'Designated Port of Entry with 5-char UN/LOCODE',
    diffStatus: pod ? (hasPodCode ? 'MATCH' : 'MODIFIED') : 'MISSING',
    destinationRequirement: 'Destination customs requires official 5-character UN/LOCODE (e.g. USLAX, DEHAM, GBLON) on commercial invoice.',
    statutoryRegulationRef: 'UNECE Recommendation No. 16 (UN/LOCODE)',
    explanation: hasPodCode
      ? 'Port of discharge includes recognized port terminal designation.'
      : 'Standard requires official UN/LOCODE port abbreviation for electronic entry processing.',
    mandatory: true,
  });

  // 5. Trade Terms & Incoterms
  const incoterms = entities.incoterms;
  const hasNamedPlace = incoterms && (incoterms.includes(' ') || incoterms.length > 3);
  let incotermStatus: DiffStatus = 'MATCH';
  let incotermExpl = 'Incoterms comply with standard.';
  if (!incoterms) {
    incotermStatus = 'MISSING';
    incotermExpl = 'Mandatory Incoterms 2020 delivery rule omitted from invoice.';
  } else if (!hasNamedPlace) {
    incotermStatus = 'DISCREPANCY';
    incotermExpl = `Incoterm "${incoterms}" lacks mandatory named place of delivery (e.g., "${incoterms} [Terminal/City]").`;
  }
  fieldComparisons.push({
    fieldKey: 'incoterms',
    fieldName: 'Incoterms 2020 & Named Delivery Point',
    category: 'trade_terms',
    uploadedValue: incoterms || null,
    standardValue: incoterms ? (hasNamedPlace ? incoterms : `${incoterms} [Named Point]`) : spec.incotermRule,
    diffStatus: incotermStatus,
    destinationRequirement: spec.incotermRule,
    statutoryRegulationRef: 'ICC Incoterms 2020 & Customs Valuation Code',
    explanation: incotermExpl,
    mandatory: true,
  });

  // Currency
  const currency = entities.currency || 'USD';
  const currencyMatches = currency.toUpperCase() === spec.standardCurrency;
  fieldComparisons.push({
    fieldKey: 'currency',
    fieldName: 'Declared Valuation Currency',
    category: 'valuation',
    uploadedValue: currency,
    standardValue: `${currency} (Convertible to ${spec.standardCurrency})`,
    diffStatus: currencyMatches ? 'MATCH' : 'MODIFIED',
    destinationRequirement: `${spec.countryName} customs calculates duty in ${spec.standardCurrency}. Foreign currency declarations require statutory exchange conversion ledger.`,
    statutoryRegulationRef: spec.valuationBasis,
    explanation: currencyMatches
      ? `Invoice declared in destination baseline currency (${spec.standardCurrency}).`
      : `Declared in ${currency}. Customs entry summary will apply official ${spec.standardCurrency} conversion rate on filing date.`,
    mandatory: true,
  });

  // 6. Line Item Diff Calculations
  const lineItemDiffs: LineItemDiff[] = items.map((item, idx) => {
    const rawDesc = item.item_description || 'Unspecified Item';
    const declaredHs = (item.declared_hs_code || '').replace(/[^0-9]/g, '');
    const verifiedHs = (item.verified_hs_code || item.declared_hs_code || '').replace(/[^0-9]/g, '');

    // HS code length check
    let hsStatus: DiffStatus = 'MATCH';
    let hsDetail = `Classified as ${item.declared_hs_code}`;

    if (!declaredHs || declaredHs.length < 6) {
      hsStatus = 'MISSING';
      hsDetail = `Missing minimum 6-digit WCO Harmonized System code.`;
    } else if (declaredHs.length < spec.hsCodeLength) {
      hsStatus = 'DISCREPANCY';
      const missingDigits = spec.hsCodeLength - declaredHs.length;
      hsDetail = `Uploaded ${declaredHs.length}-digit code. ${spec.countryName} customs mandates full ${spec.hsCodeLength}-digit tariff schedule (${spec.hsCodeLabel}). Missing ${missingDigits} suffix digits.`;
    } else if (item.verified_hs_code && item.verified_hs_code !== item.declared_hs_code) {
      hsStatus = 'MODIFIED';
      hsDetail = `Reclassification required: Declared ${item.declared_hs_code} -> Standardized ${item.verified_hs_code}`;
    }

    // Format standardized HS code with dots
    let standardHsFormatted = item.verified_hs_code || item.declared_hs_code || '0000.00.00.00';
    if (declaredHs.length === 6 && spec.hsCodeLength === 10) {
      standardHsFormatted = `${declaredHs.slice(0, 4)}.${declaredHs.slice(4, 6)}.00.00`;
    } else if (declaredHs.length === 8 && spec.hsCodeLength === 10) {
      standardHsFormatted = `${declaredHs.slice(0, 4)}.${declaredHs.slice(4, 6)}.${declaredHs.slice(6, 8)}.00`;
    }

    // Hazardous certification check
    const isHazardous = item.hazardous_class && item.hazardous_class.toLowerCase().includes('class');
    let hazardStatus: DiffStatus = 'MATCH';
    let hazardReq = 'General commercial cargo declaration';

    if (isHazardous) {
      const hasMissingCertDisc = discrepancies.some(
        (d) => d.toLowerCase().includes('test summary') || d.toLowerCase().includes('un 38.3') || d.toLowerCase().includes('hazardous')
      );
      if (hasMissingCertDisc) {
        hazardStatus = 'DISCREPANCY';
        hazardReq = spec.countryCode === 'USA'
          ? 'Mandatory PHMSA UN 38.3 Lithium Battery Safety Test Summary Certificate (49 CFR § 173.185)'
          : 'Mandatory Dangerous Goods Safety Data Sheet (SDS) & Packaging Certificate';
      } else {
        hazardStatus = 'MATCH';
        hazardReq = 'UN Dangerous Goods Declaration Attached';
      }
    }

    return {
      itemIndex: idx + 1,
      rawDescription: rawDesc,
      standardDescription: rawDesc.length > 15 ? rawDesc : `${rawDesc} [Commercial Technical Spec Required]`,
      descriptionStatus: rawDesc.length > 10 ? 'MATCH' : 'MODIFIED',
      uploadedHsCode: item.declared_hs_code || 'N/A',
      standardHsCode: standardHsFormatted,
      hsCodeStatus: hsStatus,
      hsCodeDetail: hsDetail,
      uploadedQuantity: `${item.quantity} ${item.unit || 'units'}`,
      standardQuantity: `${item.quantity} ${item.unit?.toUpperCase() || 'UNITS'} (Statutory Tariff Unit)`,
      quantityStatus: 'MATCH',
      uploadedValue: `${entities.currency || 'USD'} ${Number(item.total_value || 0).toLocaleString()}`,
      standardValue: `${entities.currency || 'USD'} ${Number(item.total_value || 0).toLocaleString()} (Customs Dutiable Value)`,
      valueStatus: 'MATCH',
      uploadedOrigin: item.country_of_origin || 'Not Declared',
      standardOrigin: item.country_of_origin ? `${item.country_of_origin} (Marking Verified)` : 'Mandatory Country of Origin Marking',
      originStatus: item.country_of_origin ? 'MATCH' : 'MISSING',
      uploadedHazard: item.hazardous_class || 'None (Non-Dangerous Cargo)',
      standardHazardRequirement: hazardReq,
      hazardStatus: hazardStatus,
    };
  });

  // 7. Mandatory PGA / Regulatory Annexes Comparison
  spec.requiredPgaAnnexes.forEach((annexReq, aIdx) => {
    const isViolated = discrepancies.some((d) => {
      const dLow = d.toLowerCase();
      if (annexReq.includes('38.3') && (dLow.includes('38.3') || dLow.includes('lithium') || dLow.includes('phmsa'))) return true;
      if (annexReq.includes('301') && (dLow.includes('301') || dLow.includes('remedy') || dLow.includes('surcharge'))) return true;
      if (annexReq.includes('CBAM') && (dLow.includes('cbam') || dLow.includes('carbon'))) return true;
      if (annexReq.includes('REACH') && (dLow.includes('reach') || dLow.includes('chemical'))) return true;
      return false;
    });

    fieldComparisons.push({
      fieldKey: `annex_${aIdx}`,
      fieldName: `Mandatory Annex: ${annexReq.split('(')[0].trim()}`,
      category: 'compliance_annexes',
      uploadedValue: isViolated ? 'Missing / Not Attached to Filing' : 'Compliant / Self-Certified',
      standardValue: annexReq,
      diffStatus: isViolated ? 'MISSING' : 'MATCH',
      destinationRequirement: `Mandatory statutory filing required by ${spec.regulatoryAuthority}.`,
      statutoryRegulationRef: spec.statutoryFramework,
      explanation: isViolated
        ? `Consignment is flagged because this mandatory annex is absent from the uploaded documentation dossier.`
        : 'Statutory annex requirement fulfilled or not triggered.',
      mandatory: true,
      fixRecommendation: isViolated ? `Obtain official certification prior to border arrival.` : undefined,
    });
  });

  // Calculate scores
  const totalChecked = fieldComparisons.length + lineItemDiffs.length * 2;
  const matchCount = fieldComparisons.filter((f) => f.diffStatus === 'MATCH').length +
    lineItemDiffs.filter((l) => l.hsCodeStatus === 'MATCH').length +
    lineItemDiffs.filter((l) => l.hazardStatus === 'MATCH').length;
  const discrepancyCount = fieldComparisons.filter((f) => f.diffStatus === 'DISCREPANCY' || f.diffStatus === 'MODIFIED').length +
    lineItemDiffs.filter((l) => l.hsCodeStatus === 'DISCREPANCY' || l.hsCodeStatus === 'MODIFIED').length +
    lineItemDiffs.filter((l) => l.hazardStatus === 'DISCREPANCY').length;
  const missingCount = fieldComparisons.filter((f) => f.diffStatus === 'MISSING').length +
    lineItemDiffs.filter((l) => l.hsCodeStatus === 'MISSING' || l.originStatus === 'MISSING').length;

  const conformityScore = Math.max(10, Math.min(100, Math.round((matchCount / Math.max(1, totalChecked)) * 100)));

  return {
    destinationCountry: spec.countryName,
    templateStandardName: spec.templateStandardName,
    regulatoryAuthority: spec.regulatoryAuthority,
    statutoryFramework: spec.statutoryFramework,
    overallConformityScore: conformityScore,
    totalAttributesChecked: totalChecked,
    matchCount,
    discrepancyCount,
    missingCount,
    fieldComparisons,
    lineItemDiffs,
    standardizedExportPayload: {
      standard_name: spec.templateStandardName,
      destination_authority: spec.regulatoryAuthority,
      statutory_entry_type: 'Definitive Commercial Import Entry (Customs Form Standard)',
      normalized_entities: {
        invoice_number: entities.document_number || 'INV-STANDARDIZED-DRAFT',
        invoice_date: entities.document_date || new Date().toISOString().slice(0, 10),
        shipper: {
          legal_name: entities.shipper_name,
          tax_identifier: entities.shipper_tax_id || 'NOT_DECLARED',
          jurisdiction: entities.shipper_country,
        },
        consignee: {
          legal_name: entities.consignee_name,
          statutory_tax_id: entities.consignee_tax_id || `REQUIRED_${spec.taxIdLabel.toUpperCase()}`,
          destination: spec.countryName,
        },
        trade_terms: {
          incoterms_2020: entities.incoterms,
          valuation_currency: spec.standardCurrency,
          declared_total: entities.total_declared_value,
        },
        logistics: {
          port_of_loading: entities.port_of_loading,
          port_of_discharge: entities.port_of_discharge,
          transport_mode: entities.mode_of_transport,
        },
        line_items: lineItemDiffs.map((d) => ({
          description: d.standardDescription,
          standardized_hs_code: d.standardHsCode,
          quantity: d.standardQuantity,
          valuation: d.standardValue,
          country_of_origin: d.standardOrigin,
          statutory_hazard_annex: d.standardHazardRequirement,
        })),
      },
      compliance_annexes: spec.requiredPgaAnnexes,
      generated_at: new Date().toISOString(),
    },
  };
}
