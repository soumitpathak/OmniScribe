import React from 'react';
import { ExtractedEntities } from '../types/compliance';
import { Building2, UserCheck, Ship, DollarSign, Package, MapPin, Hash, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExtractedEntitiesCardProps {
  entities?: ExtractedEntities;
}

export const ExtractedEntitiesCard: React.FC<ExtractedEntitiesCardProps> = ({ entities: rawEntities }) => {
  const entities = rawEntities || {
    document_type: 'Logistics Manifest',
    document_number: 'N/A',
    shipper_name: 'Not Declared',
    shipper_address: 'Address unlisted',
    shipper_country: 'N/A',
    consignee_name: 'Not Declared',
    consignee_address: 'Address unlisted',
    consignee_country: 'N/A',
    port_of_loading: 'N/A',
    port_of_discharge: 'N/A',
    mode_of_transport: 'Ocean / Air Cargo',
    incoterms: 'FOB',
    currency: 'USD',
    total_declared_value: 0,
    items: [],
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Extracted Logistics Entities & Manifest Dossier
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Doc: {entities.document_number || 'N/A'}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Shipper & Consignee Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shipper Dossier */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shipper / Exporter</span>
            </div>
            <p className="text-sm font-bold text-white">{entities.shipper_name || 'Not Declared'}</p>
            <p className="text-xs text-slate-300 mt-1 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
              <span>{entities.shipper_address || 'Address unlisted'}</span>
            </p>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Origin Country:</span>
              <span className="text-slate-200 font-semibold">{entities.shipper_country || 'N/A'}</span>
            </div>
            {entities.shipper_tax_id && (
              <div className="mt-1 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Tax / EORI / USCI:</span>
                <span className="text-cyan-400">{entities.shipper_tax_id}</span>
              </div>
            )}
          </div>

          {/* Consignee Dossier */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Consignee / Importer of Record</span>
            </div>
            <p className="text-sm font-bold text-white">{entities.consignee_name || 'Not Declared'}</p>
            <p className="text-xs text-slate-300 mt-1 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
              <span>{entities.consignee_address || 'Address unlisted'}</span>
            </p>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Destination Country:</span>
              <span className="text-slate-200 font-semibold">{entities.consignee_country || 'N/A'}</span>
            </div>
            {entities.consignee_tax_id && (
              <div className="mt-1 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Tax ID / EIN / VAT:</span>
                <span className="text-emerald-400">{entities.consignee_tax_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Transport & Commercial Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/70">
          <div>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
              Transport Mode
            </span>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1 mt-0.5">
              <Ship className="w-3.5 h-3.5 text-blue-400" />
              {entities.mode_of_transport || 'Ocean / Air'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
              Incoterms 2020
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 mt-0.5 block">
              {entities.incoterms || 'FOB'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
              Port of Loading (POL)
            </span>
            <span className="text-xs font-medium text-slate-300 truncate mt-0.5 block">
              {entities.port_of_loading || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
              Declared Customs Value
            </span>
            <span className="text-xs font-mono font-extrabold text-emerald-400 flex items-center gap-0.5 mt-0.5">
              <DollarSign className="w-3.5 h-3.5" />
              {entities.total_declared_value
                ? Number(entities.total_declared_value).toLocaleString(undefined, { minimumFractionDigits: 2 })
                : '0.00'}{' '}
              {entities.currency || 'USD'}
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Classified Line Items ({entities.items?.length || 0})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">HS Tariff Schedule Cross-Reference</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Declared HS Code</th>
                  <th className="py-2.5 px-3">Verified HS Code</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Value ({entities.currency || 'USD'})</th>
                  <th className="py-2.5 px-3">Risk Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {entities.items && entities.items.length > 0 ? (
                  entities.items.map((item, idx) => {
                    const hsMatch = item.verified_hs_code && item.declared_hs_code.startsWith(item.verified_hs_code.slice(0, 4));
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-white max-w-xs">
                          <p className="line-clamp-2">{item.item_description}</p>
                          {item.hazardous_class && (
                            <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              ⚠️ {item.hazardous_class}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                          {item.declared_hs_code}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {item.verified_hs_code ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {item.verified_hs_code}
                            </span>
                          ) : (
                            <span className="text-slate-500">Matches declared</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {item.quantity} {item.unit || 'PCS'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                          ${Number(item.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.compliance_flags && item.compliance_flags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.compliance_flags.map((flag, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">None flagged</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                      No line items extracted from this manifest.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
