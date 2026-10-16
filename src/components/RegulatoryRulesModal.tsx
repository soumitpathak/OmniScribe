import React, { useState } from 'react';
import { X, BookOpen, Search, Shield, Globe, Scale } from 'lucide-react';

interface RegulatoryRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REGULATORY_DOCS = [
  {
    jurisdiction: 'USA',
    agency: 'U.S. Customs and Border Protection (CBP) & Partner Government Agencies',
    flag: '🇺🇸',
    regulations: [
      {
        title: '19 CFR § 141.86 - Mandatory Commercial Invoice Contents',
        summary: 'Requires exact names of buyer/seller, currency, detailed merchandise description, quantities, Incoterms, and invoice numbers.',
        riskNote: 'Missing shipper/consignee tax IDs or inaccurate Incoterms triggers automatic entry rejections.',
      },
      {
        title: '49 CFR § 173.185 - Lithium Battery Transport (UN3480 / UN3481)',
        summary: 'Standalone lithium ion batteries must meet UN 38.3 test criteria, be packed in approved UN spec packaging, and display Class 9 Hazard & Cargo Aircraft Only labels.',
        riskNote: 'High regulatory penalty: Undisclosed lithium battery cells can incur civil penalties up to $90,000 per violation.',
      },
      {
        title: '19 U.S.C. § 2411 - Section 301 China Tariff Surcharges',
        summary: 'Enforces 7.5% to 25% ad valorem supplemental duties on specified electronics, raw materials, and machinery originating in China.',
        riskNote: 'Failure to declare secondary Chapter 99 HTSUS lines results in CBP liquidated damages claims.',
      },
      {
        title: 'EPA TSCA Section 13 Import Certification',
        summary: 'Requires certification that chemical substances or mixtures (including solvents and electrolyte fluids) comply with TSCA rules.',
        riskNote: 'Positive or negative certification must be filed electronically via the ACE PGA message set.',
      },
    ],
  },
  {
    jurisdiction: 'EU',
    agency: 'European Union Customs Union & DG TAXUD',
    flag: '🇪🇺',
    regulations: [
      {
        title: 'Regulation (EU) 2023/956 - Carbon Border Adjustment Mechanism (CBAM)',
        summary: 'Requires reporting of embedded greenhouse gas emissions for imported iron, steel, aluminum, cement, fertilizers, and hydrogen.',
        riskNote: 'Non-filing of quarterly CBAM reports incurs financial penalties per ton of unreported carbon emissions.',
      },
      {
        title: 'Regulation (EU) 2023/1115 - EU Deforestation Regulation (EUDR)',
        summary: 'Mandates geolocation coordinates of production land plots for cattle, cocoa, coffee, oil palm, rubber, soya, and wood.',
        riskNote: 'Consignments without verified non-deforestation due diligence statements are prohibited from customs release.',
      },
      {
        title: 'Import Control System 2 (ICS2) Release 3',
        summary: 'Mandatory Entry Summary Declaration (ENS) datasets for all maritime, rail, and road cargo entering the EU customs safety zone.',
        riskNote: 'Missing ENS pre-arrival filings results in mandatory vessel hold orders at EU outer ports.',
      },
      {
        title: 'TARIC 10-Digit Integrated Customs Tariff',
        summary: 'Exact 10-digit classification required for calculation of Common Customs Tariff and trade defense measures.',
        riskNote: 'Tariff misclassification triggers retroactive duty clawbacks and post-clearance audits.',
      },
    ],
  },
  {
    jurisdiction: 'Singapore',
    agency: 'Singapore Customs (TradeNet) & Health Sciences Authority (HSA)',
    flag: '🇸🇬',
    regulations: [
      {
        title: 'Strategic Goods (Control) Act (SGCA) - Dual-Use Transshipments',
        summary: 'Regulates export, transshipment, and transit of strategic goods and technology capable of military/WMD proliferation.',
        riskNote: 'Unauthorized transshipment of high-speed cryptography or telecommunications items carries severe criminal liability.',
      },
      {
        title: 'Health Sciences Authority (HSA) - Health Products Act',
        summary: 'Pharmaceuticals, biologics, and medical devices require registered product licenses and dealer import permits.',
        riskNote: 'Consignments lacking cold-chain datalogger logs or HSA permits are quarantined at Coolport.',
      },
      {
        title: 'Singapore GST 9% TradeNet In-Payment Valuation',
        summary: 'Strict CIF customs valuation rules for calculating Goods and Services Tax on imported merchandise.',
        riskNote: 'Undervaluation of freight or insurance charges triggers customs fines and duty evasion investigations.',
      },
    ],
  },
  {
    jurisdiction: 'UAE',
    agency: 'Dubai Customs (Mirsal II) & Federal Customs Authority',
    flag: '🇦🇪',
    regulations: [
      {
        title: 'Common Customs Law for GCC States (Decree 11/2002)',
        summary: 'Unified customs tariff (typically 5% ad valorem) with strict prohibition on banned items and counterfeit articles.',
        riskNote: 'Invoices must carry clear commercial stamps and original chambers of commerce attestation.',
      },
      {
        title: 'MOIAT ECAS & Emirates Conformity Assessment Scheme',
        summary: 'Mandatory safety and technical standard certificates for electrical appliances, cosmetics, and automotive parts.',
        riskNote: 'Non-conforming items cannot receive customs release in mainland UAE.',
      },
      {
        title: 'TDRA Telecom Equipment Homologation & Type Approval',
        summary: 'Transceivers, satellite amplifiers, and wireless devices must obtain TDRA registered approval certificates.',
        riskNote: 'Unapproved wireless transmission equipment is seized upon airport arrival.',
      },
    ],
  },
];

export const RegulatoryRulesModal: React.FC<RegulatoryRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredDocs = REGULATORY_DOCS.filter((doc) => {
    if (selectedJurisdiction !== 'ALL' && doc.jurisdiction !== selectedJurisdiction) return false;
    return true;
  }).map((doc) => ({
    ...doc,
    regulations: doc.regulations.filter((reg) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        reg.title.toLowerCase().includes(term) ||
        reg.summary.toLowerCase().includes(term) ||
        reg.riskNote.toLowerCase().includes(term)
      );
    }),
  })).filter((doc) => doc.regulations.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Customs Regulatory Knowledge Base
              </h2>
              <p className="text-xs text-slate-400">
                Statutory cross-border import restrictions, HTS tariff rules, and agency mandates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search statutes (e.g. 19 CFR, UN3480, CBAM, ECCN, TDRA)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedJurisdiction('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedJurisdiction === 'ALL'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Jurisdictions
            </button>
            {REGULATORY_DOCS.map((doc) => (
              <button
                key={doc.jurisdiction}
                onClick={() => setSelectedJurisdiction(doc.jurisdiction)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedJurisdiction === doc.jurisdiction
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {doc.flag} {doc.jurisdiction}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {filteredDocs.map((doc) => (
            <div key={doc.jurisdiction} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{doc.flag}</span>
                  <h3 className="text-sm font-bold text-white">{doc.agency}</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {doc.jurisdiction} Customs Territory
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doc.regulations.map((reg, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <Scale className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 font-mono">{reg.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{reg.summary}</p>
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-amber-400/90 font-mono">
                          ⚠️ <strong>Risk Exposure:</strong> {reg.riskNote}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching regulations found for your search term.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>OmniScribe Agent Knowledge Engine • Active GenAI Cross-Referencing</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
