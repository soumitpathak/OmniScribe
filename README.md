# OmniScribe - Autonomous Logistics Regulatory Compliance Agent

OmniScribe is a continuous audit and regulatory compliance agent for cross-border international trade and logistics. Powered by Google Gemini (`gemini-3.8-flash`), it extracts entities from bills of lading, commercial invoices, and cargo manifests, validating them against real-time global customs statutes (U.S. CBP 19 CFR, EU TARIC / CBAM / EUDR, Singapore TradeNet / HSA, and UAE Dubai Customs Mirsal II).

---

## 🌟 Core Features

1. **Document Ingestion Portal:**
   - Drag-and-drop file upload zone supporting **PDF**, **PNG**, **JPG**, **WEBP**, and plain-text/CSV manifests (up to 25MB).
   - Target destination selector supporting:
     - 🇺🇸 **USA** (CBP / ACE / FDA / EPA TSCA / 49 CFR HazMat)
     - 🇪🇺 **European Union** (TARIC / ICS2 / CBAM / EUDR)
     - 🇸🇬 **Singapore** (TradeNet / HSA / SFA / Strategic Goods Control)
     - 🇦🇪 **United Arab Emirates** (Dubai Customs Mirsal II / MOIAT / TDRA)
     - 🇬🇧 **United Kingdom** (HMRC CDS)
     - 🇯🇵 **Japan** (NACCS)
     - 🇦🇺 **Australia** (ABF / ICS)
   - 4 built-in **1-Click Pre-Packaged Test Scenarios** for immediate evaluation without needing to locate documents manually.

2. **Autonomous Agent Compliance Loop (GenAI Backend):**
   - Extracts: Shipper, Consignee, Notify Party, Document No., POL, POD, Incoterms, Currency, Total Value, and classified Line Items.
   - Cross-checks Harmonized System (HS) Codes (6-10 digits) against destination country tariff schedules.
   - Screens for Dangerous Goods (UN3480 Lithium Batteries, UN38.3 test summaries), Dual-Use Munitions (Wassenaar 5A002), and punitive tariffs (Section 301, CBAM carbon border tax).
   - Returns structured JSON:
     - `audit_status`: `"APPROVED"`, `"FLAGGED"`, or `"REJECTED"`
     - `risk_score`: Integer (0 to 100)
     - `risk_level`: `"LOW"`, `"MODERATE"`, or `"CRITICAL"`
     - `extracted_entities`: Comprehensive logistics manifest dossier
     - `compliance_discrepancies`: List of discrepancies with statutory references
     - `recommended_actions`: Action items with target agencies and required certificates
     - `duty_tariff_analysis`: Estimated duty rate and partner government agencies (PGAs)
     - `agent_reasoning_trace`: Step-by-step reasoning trail of the agent

3. **Interactive Compliance Dashboard:**
   - Overall Status Badge (Green for Approved, Yellow/Amber for Flagged, Red for Rejected).
   - Visual SVG radial **Risk Score Meter** (0-100) with animated needle and clearance velocity gauge.
   - Structured breakdown cards for Extracted Entities, Discrepancies, and Action Items with interactive resolution checkboxes.
   - Export options:
     - **Export Audit JSON**
     - **Download Customs Clearance Slip** (Formatted text summary)
     - **Copy Brief Summary**
   - Customs Regulatory Knowledge Explorer modal.
   - Continuous Audit History modal with local storage persistence.

---

## 🚀 Deployment to Google Cloud Run

OmniScribe is configured to run as a Node.js application.

### Local Development

```bash
npm install
export GEMINI_API_KEY="your-gemini-api-key"
npm run dev
```

---

## 📂 Repository Structure

```
├── src/
│   ├── components/
│   │   ├── Header.tsx                 # Brand navigation & jurisdiction switcher
│   │   ├── DocumentUploadZone.tsx     # Drag-and-drop ingestion & sample selector
│   │   ├── RiskMeter.tsx              # SVG radial speedometer & risk tier gauge
│   │   ├── AuditReportView.tsx        # Hero status badge & audit summary dashboard
│   │   ├── ExtractedEntitiesCard.tsx  # Shipper/Consignee dossier & line-item table
│   │   ├── DiscrepanciesCard.tsx      # Severity-tagged regulatory discrepancies
│   │   ├── ActionItemsCard.tsx        # Interactive checklist for remediation
│   │   ├── DutyTariffCard.tsx         # Duty estimate, PGAs, and CBAM status
│   │   ├── AgentThoughtTrace.tsx      # Transparent agent reasoning log
│   │   ├── RegulatoryRulesModal.tsx   # Statutory customs knowledge explorer
│   │   ├── AuditHistoryModal.tsx      # Stored past audits in localStorage
│   │   ├── SystemArchitectureModal.tsx# Architecture & Cloud Run deployment docs
│   │   └── AuditPipelineAnimation.tsx # Real-time 4-stage pipeline animation
│   ├── data/
│   │   └── sampleDocuments.ts         # Pre-configured test manifests & invoices
│   ├── types/
│   │   └── compliance.ts              # TypeScript schemas
│   ├── App.tsx                        # Master application state coordinator
│   ├── main.tsx                       # React DOM entry point
│   └── index.css                      # Tailwind CSS v4 styling
├── server.ts                          # Express server with Vite middleware & Gemini API
├── package.json
└── tsconfig.json
```
