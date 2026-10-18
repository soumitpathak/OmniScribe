import React, { useState } from 'react';
import { AuditResponse } from '../types/compliance';
import {
  ShieldAlert,
  FileText,
  ExternalLink,
  ArrowRight,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Building,
  Info,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface PreemptiveActionsCardProps {
  audit: AuditResponse;
}

interface RegulatoryFormLink {
  code: string;
  name: string;
  agency: string;
  jurisdiction: string;
  url: string;
  purpose: string;
  deadline: string;
  badge: string;
}

interface IncotermRecommendation {
  currentIncoterm: string;
  recommendedIncoterm: string;
  riskReductionSummary: string;
  liabilityShiftDetails: string[];
  clausesToInsert: string;
}

export const PreemptiveActionsCard: React.FC<PreemptiveActionsCardProps> = ({ audit }) => {
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedClause, setCopiedClause] = useState<boolean>(false);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  const country = (audit.destination_country || 'USA').toUpperCase();
  const currentIncoterm = (audit.extracted_entities?.incoterms || 'CIF').toUpperCase().trim();
  const isHighRisk = audit.risk_score >= 50 || audit.risk_level === 'CRITICAL' || audit.audit_status !== 'APPROVED';

  // Catalog of official regulatory forms and direct links
  const getAllRegulatoryForms = (): RegulatoryFormLink[] => {
    const list: RegulatoryFormLink[] = [];

    // USA Forms
    if (country === 'USA' || country.includes('US') || country.includes('AMERICA')) {
      list.push(
        {
          code: 'CBP Form 7501',
          name: 'Entry Summary & Tariff Duty Assessment',
          agency: 'U.S. Customs & Border Protection (CBP)',
          jurisdiction: 'USA',
          url: 'https://www.cbp.gov/document/forms/form-7501-entry-summary',
          purpose: 'Formal entry filing to declare Harmonized Tariff Schedule (HTSUS) classification, Section 301 ad valorem duty surcharges, and liquidation bonds.',
          deadline: 'Within 10 working days of cargo arrival at port of entry',
          badge: 'Mandatory Customs Form',
        },
        {
          code: 'EPA Form 7720-59',
          name: 'TSCA Section 13 Chemical & Electrolyte Certification',
          agency: 'U.S. Environmental Protection Agency (EPA)',
          jurisdiction: 'USA',
          url: 'https://www.epa.gov/tsca-import-export-requirements/tsca-section-13-import-certification',
          purpose: 'Positive certification statement confirming lithium-ion battery electrolytes and imported chemical mixtures comply with Section 13 of TSCA.',
          deadline: 'Submitted electronically with initial entry paperwork via ACE portal',
          badge: 'EPA Compliance Notice',
        },
        {
          code: 'DOT PHMSA UN 38.3',
          name: 'Lithium Battery Safety Test Summary',
          agency: 'U.S. Department of Transportation (DOT / PHMSA)',
          jurisdiction: 'USA',
          url: 'https://www.phmsa.dot.gov/lithiumbatteries',
          purpose: 'Mandatory accredited laboratory test summary verifying cells/batteries have completed UN 38.3 thermal, shock, and short-circuit testing before transport.',
          deadline: 'Prior to freight loading onto ocean vessel or air cargo freighter',
          badge: 'Dangerous Goods Protocol',
        },
        {
          code: 'BIS-711',
          name: 'Statement by Ultimate Consignee & Purchaser (Dual-Use)',
          agency: 'Bureau of Industry and Security (BIS / Dept of Commerce)',
          jurisdiction: 'USA',
          url: 'https://www.bis.doc.gov/index.php/documents/forms-documents/forms/1922-bis-711-pdf/file',
          purpose: 'End-user assurance certification confirming high-frequency electronics, amplifiers, or cryptographic hardware will not be diverted for prohibited munitions.',
          deadline: 'Must accompany license application prior to export filing',
          badge: 'Export Control / EAR',
        }
      );
    }

    // EU Forms
    if (country === 'EU' || country === 'GERMANY' || country === 'FRANCE' || country === 'NETHERLANDS' || country.includes('EUROPE')) {
      list.push(
        {
          code: 'ICS2 ENS Filing',
          name: 'Entry Summary Declaration (Safety & Security)',
          agency: 'European Union Customs Union (DG TAXUD)',
          jurisdiction: 'EU',
          url: 'https://taxation-customs.ec.europa.eu/customs-4/customs-security/import-control-system-2-ics2-general-information_en',
          purpose: 'Pre-arrival cargo security manifest data filed by carriers/freight forwarders into the EU Import Control System 2 prior to vessel loading.',
          deadline: '24 hours prior to loading container at foreign port of origin',
          badge: 'EU Security Mandate',
        },
        {
          code: 'EUDR DDS Statement',
          name: 'EU Deforestation Regulation Due Diligence Statement',
          agency: 'European Commission (Regulation EU 2023/1115)',
          jurisdiction: 'EU',
          url: 'https://green-forum.eu/eudr',
          purpose: 'TRACES-NT digital declaration containing exact geographic plot polygon coordinates proving goods (coffee, cocoa, timber) did not cause deforestation.',
          deadline: 'Prior to making consignment available on EU Single Market',
          badge: 'Deforestation Clearance',
        },
        {
          code: 'CBAM Communication',
          name: 'Carbon Border Adjustment Mechanism Declarant Template',
          agency: 'European Commission (Regulation EU 2023/956)',
          jurisdiction: 'EU',
          url: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en',
          purpose: 'Quarterly embedded emissions report for carbon-intensive imports (steel, aluminum, fertilizers, hydrogen).',
          deadline: 'End of month following each calendar quarter of import',
          badge: 'Carbon Tariff Mechanism',
        }
      );
    }

    // Singapore Forms
    if (country === 'SINGAPORE' || country === 'SGP') {
      list.push(
        {
          code: 'TradeNet In-Payment',
          name: 'Customs In-Payment & GST Permit Application',
          agency: 'Singapore Customs (National Single Window)',
          jurisdiction: 'Singapore',
          url: 'https://www.customs.gov.sg/businesses/national-single-window/tradenet/',
          purpose: 'Electronic customs permit for the clearance of dutiable and non-dutiable cargo into Singapore customs territory with 9% GST assessment.',
          deadline: 'Prior to vessel berthing at PSA terminals or Changi air hub',
          badge: 'Singapore TradeNet',
        },
        {
          code: 'HSA Form PR-12',
          name: 'Therapeutic Product Import Licence Application',
          agency: 'Singapore Health Sciences Authority (HSA)',
          jurisdiction: 'Singapore',
          url: 'https://www.hsa.gov.sg/therapeutic-products/overview',
          purpose: 'Mandatory pre-clearance licensing for biologics, insulin, and regulated pharmaceuticals entering Singapore with temperature audit trail.',
          deadline: '5 business days prior to consignment arrival',
          badge: 'HSA Therapeutic Licence',
        }
      );
    }

    // UAE Forms
    if (country === 'UAE' || country.includes('EMIRATES') || country === 'DUBAI') {
      list.push(
        {
          code: 'Mirsal II Customs Declaration',
          name: 'Dubai Customs Unified Electronic Declaration',
          agency: 'Dubai Customs / Federal Customs Authority',
          jurisdiction: 'UAE',
          url: 'https://www.dubaicustoms.gov.ae/en/eServices/ServicesForBusinesses/Pages/CustomsDeclarations.aspx',
          purpose: 'Consignment import declaration submitted through Mirsal II portal with digital invoice and Certificate of Origin (COO) verification.',
          deadline: 'Prior to cargo discharge at Jebel Ali (JAFZA) or DWC',
          badge: 'Dubai Mirsal II',
        },
        {
          code: 'TDRA Type Approval',
          name: 'Telecommunications Equipment Homologation Certificate',
          agency: 'Telecommunications and Digital Government Regulatory Authority (TDRA)',
          jurisdiction: 'UAE',
          url: 'https://tdra.gov.ae/en/Services/equipment-approval',
          purpose: 'Mandatory certification for wireless, satellite transceivers, and RF apparatus verifying compliance with UAE electromagnetic spectrum laws.',
          deadline: 'Required prior to issuance of customs clearance release order',
          badge: 'TDRA Homologation',
        }
      );
    }

    // Multimodal Dangerous Goods Declaration (Always relevant for high-risk / DG cargo)
    list.push({
      code: 'IMO DG Multimodal Form',
      name: 'International Multimodal Dangerous Goods Declaration',
      agency: 'International Maritime Organization (IMO) / IATA',
      jurisdiction: 'Global / WCO',
      url: 'https://www.imo.org/en/OurWork/Safety/Pages/DangerousGoods-default.aspx',
      purpose: 'Standardized declaration documenting UN hazardous classification (e.g. UN3480 Class 9, UN3481), Packing Group, and Emergency Response procedures.',
      deadline: '48 hours prior to vessel cut-off time at port of origin',
      badge: 'Multimodal HazMat',
    });

    return list;
  };

  const forms = getAllRegulatoryForms();

  // Alternative Incoterms Liability Shifting Analysis
  const getIncotermRecommendation = (): IncotermRecommendation => {
    const incoterm = currentIncoterm;

    if (incoterm === 'DDP') {
      return {
        currentIncoterm: 'DDP (Delivered Duty Paid)',
        recommendedIncoterm: 'DAP (Delivered at Place) or CPT (Carriage Paid To)',
        riskReductionSummary:
          'DDP places maximum statutory and financial liability on the foreign seller, who must act as the Importer of Record (IOR) and assume all customs penalties, liquidated damages, and tariff audits in a foreign jurisdiction.',
        liabilityShiftDetails: [
          'Shifts customs entry filing and legal Importer of Record (IOR) status entirely onto the domestic consignee, who possesses a local customs bond and tax registration.',
          'Insulates seller from unexpected Section 301 tariff surcharges, anti-dumping duties, and port demurrage detention penalties.',
          'Eliminates need for seller to register for local foreign VAT/GST accounts and navigate foreign agency homologation hurdles.',
        ],
        clausesToInsert:
          '"Delivery shall be DAP [Destination Warehouse]. Consignee assumes sole legal responsibility as Importer of Record for customs declarations, duties, and statutory clearances. Seller shall provide technical compliance dossier within 48 hours of shipment."',
      };
    }

    if (incoterm.includes('CIF') || incoterm.includes('CFR')) {
      return {
        currentIncoterm: `${incoterm} (Cost, Insurance & Freight)`,
        recommendedIncoterm: 'FCA (Free Carrier Terminal) or FOB (Free On Board) + Demurrage Rider',
        riskReductionSummary:
          'Under CIF/CFR, risk of cargo damage transfers at loading, but the seller pays freight to destination. If customs holds the cargo for statutory compliance discrepancies, the carrier bills destination detention and demurrage back to the shipping line docket, causing severe financial disputes.',
        liabilityShiftDetails: [
          'Cleanly terminates seller maritime risk and carrier custody at origin departure terminal.',
          'Assigns carrier detention, port demurrage, and customs inspection fees unambiguously to buyer.',
          'Permits buyer customs broker to pre-clear goods before vessel departure, avoiding container dwell fees.',
        ],
        clausesToInsert:
          '"Terms of sale: FCA [Origin Port/Airport]. Any destination customs quarantine, partner government agency (PGA) holds, or demurrage fees resulting from regulatory review shall be for the buyer’s exclusive account."',
      };
    }

    if (incoterm === 'EXW') {
      return {
        currentIncoterm: 'EXW (Ex Works)',
        recommendedIncoterm: 'FCA (Free Carrier Factory / Named Place)',
        riskReductionSummary:
          'EXW obligates the foreign buyer to handle origin export clearance. If the shipment contains dual-use cryptographic hardware or restricted goods, the manufacturer/seller may be held legally liable by origin export authorities for unauthorized unlicensed export.',
        liabilityShiftDetails: [
          'Ensures the manufacturing seller maintains control over origin export declarations (AES filing) and strategic goods licensing.',
          'Protects exporter from export enforcement violations under EAR, Wassenaar, or local Strategic Goods Control Acts.',
          'Provides verified Automated Export System (AES) Internal Transaction Number (ITN) proof to origin customs.',
        ],
        clausesToInsert:
          '"Sale is governed by FCA [Seller Facility]. Seller shall be the exporter of record for origin customs formalities and AES filing, while buyer bears all international carriage and destination import clearance obligations."',
      };
    }

    // Default recommendation for FOB or DAP
    return {
      currentIncoterm: incoterm || 'FOB (Free On Board)',
      recommendedIncoterm: 'DAP (with Bonded Warehouse Contingency Clause)',
      riskReductionSummary:
        'Standard Incoterms do not automatically allocate costs for statutory regulatory quarantines, laboratory testing holds, or binding tariff disputes. A preemptive customs indemnity clause reduces exposure.',
      liabilityShiftDetails: [
        'Mandates pre-arrival document audit 72 hours prior to vessel departure to eliminate port congestion holds.',
        'Authorizes immediate diversion to a Customs Bonded Warehouse (CBW) if statutory hold exceeds 48 hours, freezing duty liability.',
        'Imposes reciprocal obligations: Seller guarantees technical certification validity; Buyer guarantees prompt local PGA liaison.',
      ],
      clausesToInsert:
        '"In the event of customs or regulatory hold exceeding 48 hours, cargo shall be staged in a licensed Customs Bonded Warehouse at buyer’s direction. Demurrage penalties and bonded storage costs shall be apportioned based on fault."',
    };
  };

  const incotermAdvice = getIncotermRecommendation();

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    toast.success('Official Form URL Copied', `Direct link to ${name} copied to clipboard.`);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleCopyClause = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClause(true);
    toast.info('Incoterm Contract Rider Copied', 'Paste this liability-shifting rider directly into your commercial contract or pro-forma invoice.');
    setTimeout(() => setCopiedClause(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-rose-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/10 shadow-2xl overflow-hidden space-y-6">
      {/* Header Banner */}
      <div className="p-5 border-b border-rose-500/20 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Preemptive Actions & Liability Mitigation</span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                HIGH-RISK PROTOCOL
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Specific statutory filings, official agency forms, and contractual Incoterm modifications to shield against border seizures and fines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
            Jurisdiction: <strong className="text-white">{country}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
            Risk: <strong className="text-rose-400">{audit.risk_score}/100</strong>
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* SECTION 1: Alternative Incoterms Liability Shifting */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Incoterms Liability Mitigation Strategy</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Recommended Switch
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Reassign customs clearance duty obligations and port detention liability
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 line-through">
                {incotermAdvice.currentIncoterm.split(' ')[0]}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                {incotermAdvice.recommendedIncoterm.split(' ')[0]}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            {incotermAdvice.riskReductionSummary}
          </p>

          {/* Key Advantages of Suggested Incoterm */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Contractual Risk Reductions:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {incotermAdvice.liabilityShiftDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2 text-xs text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Contract Clause Rider with Copy Button */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Preemptive Contract Clause (Rider to Commercial Invoice):</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopyClause(incotermAdvice.clausesToInsert)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedClause ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedClause ? 'Copied to Clipboard!' : 'Copy Clause'}</span>
              </button>
            </div>
            <p className="text-xs text-emerald-300/90 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 select-all">
              {incotermAdvice.clausesToInsert}
            </p>
          </div>
        </div>

        {/* SECTION 2: Direct Links to Specific Regulatory Forms */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Mandatory Preemptive Regulatory Forms & Agency Filings</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Official statutory forms required to cure detected discrepancies before cargo arrival
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {forms.length} Verified Forms Available
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {forms.map((form) => {
              const isSelected = selectedForm === form.code;
              return (
                <div
                  key={form.code}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-rose-500/50 shadow-md shadow-rose-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 uppercase">
                          {form.badge}
                        </span>
                        <h5 className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
                          <span>{form.code}</span>
                          <span className="text-slate-400 font-normal text-xs">— {form.name}</span>
                        </h5>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        {form.jurisdiction}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{form.agency}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {form.purpose}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Deadline: {form.deadline}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(form.url, form.code)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                        title="Copy official form link"
                      >
                        {copiedLink === form.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer group"
                      >
                        <span>Access Regulatory Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Emergency Pre-Arrival Protocols */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Preemptive Quotas & Demurrage Shield Protocols:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
              <strong className="text-white block font-mono text-[11px]">1. Bonded Warehouse Staging:</strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                Request transit into a Class 3 Customs Bonded Warehouse before arrival to stop the 15-day G.O. (General Order) clock and prevent seizure.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
              <strong className="text-white block font-mono text-[11px]">2. 19 CFR § 177 Advance Ruling:</strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                File an expedited Binding Tariff Information (BTI) inquiry with customs HQ to settle ambiguous HS codes prior to vessel arrival.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
              <strong className="text-white block font-mono text-[11px]">3. Post-Summary Correction (PSC):</strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                Submit an electronic PSC adjustment in the customs portal within 300 days of entry date to adjust Section 301 ad valorem deposits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
