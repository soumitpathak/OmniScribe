import { SampleDocument } from '../types/compliance';

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'sample-lithium-usa',
    title: 'Lithium Battery Assembly (China → USA)',
    subtitle: 'High-Density Energy Storage Modules',
    destination_country: 'USA',
    document_type: 'Commercial Invoice & DG Manifest',
    badge: {
      label: 'FLAGGED / HAZMAT RISK',
      variant: 'warning',
    },
    description: 'Shipment of 300 units of 48V 100Ah Lithium-Ion battery modules. Subject to 49 CFR PHMSA UN3480 hazardous rules and US Section 301 25% tariff duties.',
    key_risks_preview: [
      'Class 9 Dangerous Goods (UN3480)',
      'Section 301 25% ad valorem tariff exposure',
      'Missing UN 38.3 Test Summary report'
    ],
    sample_text: `================================================================================
COMMERCIAL INVOICE & OCEAN BILL OF LADING
================================================================================
INVOICE NO: INV-2026-SZ-89211                       DATE: 14-OCT-2026
BILL OF LADING NO: OOLU2601994821                   CURRENCY: USD
INCOTERMS: CIF PORT OF LOS ANGELES (INCOTERMS 2020)

1. SHIPPER / EXPORTER:
   Shenzhen HyperPower Energy Tech Co., Ltd.
   Building 4, High-Tech Industrial Park, Nanshan District
   Shenzhen, Guangdong 518057, China
   Tax ID / USCI: 91440300MA5EXXX99

2. CONSIGNEE / IMPORTER OF RECORD:
   VoltWave Logistics & Storage Inc.
   2040 Harbor Blvd, Suite 300, Long Beach, CA 90802, USA
   IRS EIN: 84-9382910 | CBP Importer No: 84-938291000

3. NOTIFY PARTY:
   Apex Freight Forwarding LLC, Long Beach Terminal Gate 4
   Long Beach, CA 90802, USA

4. TRANSPORT DETAILS:
   Vessel / Voyage: EVER GIVEN / V.0441E
   Port of Loading (POL): Shenzhen Port (CNSZX), China
   Port of Discharge (POD): Port of Los Angeles (USLAX), USA
   Container: OOLU-992140-1 (40ft High Cube)

5. LINE ITEMS:
--------------------------------------------------------------------------------
Item # | Description                                    | HS Code    | Qty | Unit Price | Total Amount
--------------------------------------------------------------------------------
01     | Lithium-Ion Polymer Battery Modules            | 8507.60.00 | 300 | $475.00    | $142,500.00
       | Energy Storage System (ESS) 48V 100Ah (4.8kWh)  |            |     |            |
       | UN Number: UN3480 Class 9                      |            |     |            |
       | Gross Weight: 12,600 KG | Net: 11,400 KG       |            |     |            |
--------------------------------------------------------------------------------
TOTAL INVOICE VALUE (CIF): $142,500.00 USD

SPECIAL DECLARATIONS:
- Cargo classified under UN3480, Lithium Ion Batteries, Class 9.
- Note: UN 38.3 Test Summary pending factory laboratory re-certification.
- EPA TSCA Section 13 certification to be submitted post-discharge.
`
  },
  {
    id: 'sample-dualuse-uae',
    title: 'Dual-Use Telecom Transceivers (Taiwan → UAE)',
    subtitle: 'Ka-Band Cryptographic Satellite Equipment',
    destination_country: 'UAE',
    document_type: 'Air Waybill & Export Shipping Manifest',
    badge: {
      label: 'REJECTED / CRITICAL COMPLIANCE',
      variant: 'danger',
    },
    description: 'High-frequency Ka-band satellite transceivers with hardware encryption. Violates Wassenaar dual-use controls without license; lacks UAE TDRA type approval.',
    key_risks_preview: [
      'Dual-Use ECCN 5A002 military encryption',
      'Missing UAE TDRA telecommunications permit',
      'Critical Sanction & Non-Proliferation hold'
    ],
    sample_text: `================================================================================
AIR WAYBILL (AWB) & EXPORT DECLARATION MANIFEST
================================================================================
AIR WAYBILL NO: 772-90812390                        DATE: 15-OCT-2026
FLIGHT NO: EK-367 (Emirates SkyCargo)              CURRENCY: USD
INCOTERMS: CIP DUBAI INTERNATIONAL AIRPORT

1. SHIPPER / CONSIGNOR:
   AeroWave High-Frequency Microelectronics Corp.
   12 Science Park 2nd Road, Hsinchu Science Park
   Hsinchu City 30076, Taiwan (R.O.C.)
   Export Reg: TW-54910284

2. CONSIGNEE:
   Gulf Horizon Satellite & Telecommunications FZE
   Jebel Ali Free Zone Authority (JAFZA), South Zone 2
   Dubai, United Arab Emirates
   UAE TRN: 100293847500003

3. NOTIFY PARTY:
   SkyCargo Logistics Clearance Hub, Cargo Terminal 2
   Dubai International Airport (DXB), Dubai, UAE

4. ROUTING:
   Airport of Departure: Taipei Taoyuan Int'l (TPE)
   Airport of Destination: Dubai International (DXB)

5. LINE ITEMS:
--------------------------------------------------------------------------------
Item # | Description                                    | HS Code    | Qty | Unit Price  | Total Amount
--------------------------------------------------------------------------------
01     | Ka-Band Solid State Power Amplifiers (SSPA)     | 8517.62.00 | 25  | $19,400.00  | $485,000.00
       | Integrated Hardware Cryptographic Engine       |            |     |             |
       | Operating Frequency: 26.5 GHz - 40.0 GHz       |            |     |             |
       | ECCN: 5A002.a.1 (Information Security)         |            |     |             |
--------------------------------------------------------------------------------
TOTAL AIR FREIGHT VALUE (CIP): $485,000.00 USD

RESTRICTION NOTES:
- Strategic Goods Dual-Use classification pending destination clearance.
- No Strategic Export License attached to flight docket.
- TDRA Equipment Conformity Certificate not yet filed in UAE Customs Mirsal II.
`
  },
  {
    id: 'sample-coffee-eu',
    title: 'Specialty Arabica Coffee Beans (Brazil → EU)',
    subtitle: 'Organic Grade 1 Screen 17/18 Raw Coffee',
    destination_country: 'EU',
    document_type: 'Commercial Invoice & B/L',
    badge: {
      label: 'APPROVED / CLEAN COMPLIANCE',
      variant: 'success',
    },
    description: '19,200 KG single-origin green coffee beans destined for Rotterdam. Fully compliant with EU Deforestation Regulation (EUDR), TARIC, and Phytosanitary controls.',
    key_risks_preview: [
      'EUDR 2023/1115 Deforestation Geolocation Verified',
      'Valid Consignee EORI registered in EOS',
      '0% EU Common Customs Tariff'
    ],
    sample_text: `================================================================================
COMMERCIAL INVOICE & OCEAN BILL OF LADING
================================================================================
INVOICE NO: INV-SNT-77401                           DATE: 12-OCT-2026
BILL OF LADING NO: MAEU591820491                    CURRENCY: EUR
INCOTERMS: FOB PORT OF SANTOS (INCOTERMS 2020)

1. SHIPPER / EXPORTER:
   Fazenda Monte Verde Agroindustrial S.A.
   Rodovia BR-491, Km 22, Zona Rural
   Guaxupé, Minas Gerais 37800-000, Brazil
   CNPJ: 04.882.112/0001-44 | REX No: BRREX04882112

2. CONSIGNEE / IMPORTER:
   Nordic Roast Imports B.V.
   Keizersgracht 421, 1016 EK Amsterdam, Netherlands
   EORI: NL882910394 | Dutch BTW/VAT: NL882910394B01

3. NOTIFY PARTY:
   Rotterdam World Gateway (RWG) Logistics Desk
   Maasvlakte 2, Port of Rotterdam, Netherlands

4. SHIPMENT DETAILS:
   Vessel: MAERSK MC-KINNEY MOLLER / Voy: 2610N
   Port of Loading: Port of Santos (BRSSZ), Brazil
   Port of Discharge: Port of Rotterdam (NLRTM), Netherlands
   Container: MSKU-440192-8 (20ft Dry Box)

5. LINE ITEMS:
--------------------------------------------------------------------------------
Item # | Description                                    | HS Code    | Qty (KG) | Unit (€) | Total Amount
--------------------------------------------------------------------------------
01     | Specialty Arabica Green Coffee Beans           | 0901.11.00 | 19,200   | €5.125   | €98,400.00
       | Single-Origin Sul de Minas Grade 1 (Scr 17/18) |            |          |          |
       | Certified Organic (Reg EU 2018/848)           |            |          |          |
       | EUDR Due Diligence Ref: DDS-BR-2026-90412      |            |          |          |
--------------------------------------------------------------------------------
TOTAL FOB VALUE: €98,400.00 EUR

CERTIFICATIONS ATTACHED:
- Brazilian Ministry of Agriculture (MAPA) Phytosanitary Certificate No. BR-99214.
- EUDR Geolocation Polygon Reference included: Lat -21.3041, Long -46.7129.
- Certificate of Origin Form ICO (International Coffee Organization).
`
  },
  {
    id: 'sample-pharma-singapore',
    title: 'Biopharmaceutical Vaccines (India → Singapore)',
    subtitle: 'Cold-Chain Recombinant Therapeutics',
    destination_country: 'Singapore',
    document_type: 'Air Waybill & Pharma Manifest',
    badge: {
      label: 'FLAGGED / PERMIT PENDING',
      variant: 'warning',
    },
    description: 'Human insulin therapeutics in temperature-controlled Envirotainers (2°C-8°C). Requires Singapore HSA Health Products permit & cold-chain logger data.',
    key_risks_preview: [
      'Singapore HSA Medical Device / Drug Import License',
      'Mandatory Temperature Datalogger validation',
      'Goods and Services Tax (GST) 9% TradeNet filing'
    ],
    sample_text: `================================================================================
AIR WAYBILL & PHARMACEUTICAL SHIPPING SPECIFICATION
================================================================================
AIR WAYBILL NO: 098-44120955                        DATE: 14-OCT-2026
FLIGHT NO: SQ-423 (Singapore Airlines Cargo)       CURRENCY: USD
INCOTERMS: CIP SINGAPORE CHANGI AIRPORT

1. SHIPPER / EXPORTER:
   Bharat BioTherapeutics Laboratories Ltd.
   Genome Valley, Phase III, Shamirpet
   Hyderabad, Telangana 500078, India
   IEC Code: 0904018821 | GSTIN: 36AABCB1234F1Z0

2. CONSIGNEE:
   AuraLife Healthcare Distribution Pte. Ltd.
   8 Biopolis Way, #06-12 Helios Building
   Singapore 138667
   Singapore UEN: 201829401K | GST Reg: M90382910X

3. NOTIFY PARTY:
   Coolport Cargo Logistics, Changi Airfreight Centre
   Singapore 819642

4. ROUTING & LOGISTICS:
   Origin Airport: Rajiv Gandhi Int'l, Hyderabad (HYD)
   Destination Airport: Singapore Changi (SIN)
   Temperature Regime: +2°C to +8°C (Monitored Dry Ice Active Reefer)

5. LINE ITEMS:
--------------------------------------------------------------------------------
Item # | Description                                    | HS Code    | Qty (Vials) | Unit Price | Total Amount
--------------------------------------------------------------------------------
01     | Recombinant Human Insulin 100 IU/ml (10ml Vial)| 3004.31.00 | 15,000      | $14.50     | $217,500.00
       | Therapeutic Glargine Analog Biosimilar         |            |             |            |
       | Active Datalogger ID: SENS-99410-B             |            |             |            |
--------------------------------------------------------------------------------
TOTAL CIP VALUE: $217,500.00 USD

REGULATORY STATUS:
- Singapore Health Sciences Authority (HSA) Product Registration: PR-SIN-2024-884
- Singapore Customs TradeNet In-Payment Permit: PENDING FINAL BROKER SUBMISSION
- Data Logger Temperature report to be pulled upon de-consolidation at Coolport.
`
  }
];
