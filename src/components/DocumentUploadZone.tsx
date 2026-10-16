import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { Upload, FileText, Globe, Sparkles, Check, AlertCircle, FileUp, X, RefreshCw, Eye, FileSpreadsheet } from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { SampleDocument } from '../types/compliance';
import { FilePreviewModal } from './FilePreviewModal';
import { useToast } from '../context/ToastContext';

interface DocumentUploadZoneProps {
  onAudit: (data: {
    file: File | null;
    rawText: string;
    destinationCountry: string;
    documentType: string;
  }) => void;
  isLoading: boolean;
  selectedCountry: string;
  onSelectCountry: (c: string) => void;
}

const DESTINATIONS = [
  { code: 'USA', name: 'United States', flag: '🇺🇸', authority: 'CBP / ACE / FDA' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺', authority: 'TARIC / ICS2 / CBAM' },
  { code: 'Singapore', name: 'Singapore', flag: '🇸🇬', authority: 'TradeNet / HSA' },
  { code: 'UAE', name: 'United Arab Emirates', flag: '🇦🇪', authority: 'Dubai Customs / Mirsal II' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', authority: 'HMRC CDS' },
  { code: 'Japan', name: 'Japan', flag: '🇯🇵', authority: 'NACCS' },
  { code: 'Australia', name: 'Australia', flag: '🇦🇺', authority: 'ABF / ICS' },
];

const DOC_TYPES = [
  'Commercial Invoice',
  'Ocean Bill of Lading (B/L)',
  'Air Waybill (AWB)',
  'Cargo Manifest & Packing List',
  'Dangerous Goods Shipper Declaration',
  'Certificate of Origin',
];

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  onAudit,
  isLoading,
  selectedCountry,
  onSelectCountry,
}) => {
  const toast = useToast();
  const [documentType, setDocumentType] = useState('Commercial Invoice');
  const [file, setFile] = useState<File | null>(null);
  const [fileThumbnail, setFileThumbnail] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    // Validate file size (25MB limit)
    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error(
        'Upload Rejected: File Size Exceeded',
        `File "${selectedFile.name}" is ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB. The maximum allowable limit is 25MB.`
      );
      return;
    }

    setFile(selectedFile);
    setActiveSampleId(null);

    const isImg = selectedFile.type.startsWith('image/');
    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    const kind = isImg ? 'Image invoice' : isPdf ? 'PDF customs document' : 'Logistics manifest';

    // Create thumbnail if image
    if (isImg) {
      if (fileThumbnail) URL.revokeObjectURL(fileThumbnail);
      setFileThumbnail(URL.createObjectURL(selectedFile));
    } else {
      if (fileThumbnail) URL.revokeObjectURL(fileThumbnail);
      setFileThumbnail(null);
    }

    // If text file, preview its text
    if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawText((event.target?.result as string) || '');
      };
      reader.readAsText(selectedFile);
    }

    // Trigger toast notification
    toast.success(
      'Document Successfully Uploaded',
      `"${selectedFile.name}" (${(selectedFile.size / 1024).toFixed(1)} KB ${kind}) ingested. Ready for regulatory audit.`
    );
  };

  const handleLoadSample = (sample: SampleDocument) => {
    setActiveSampleId(sample.id);
    onSelectCountry(sample.destination_country);
    setDocumentType(sample.document_type);
    setRawText(sample.sample_text);
    if (fileThumbnail) URL.revokeObjectURL(fileThumbnail);
    setFileThumbnail(null);
    setFile(null);
    setActiveTab('text');

    toast.info(
      'Test Scenario Ingested',
      `Loaded "${sample.title}" for ${sample.destination_country} regulatory evaluation.`
    );
  };

  const handleClear = () => {
    if (fileThumbnail) URL.revokeObjectURL(fileThumbnail);
    setFileThumbnail(null);
    setFile(null);
    setRawText('');
    setActiveSampleId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAudit({
      file,
      rawText,
      destinationCountry: selectedCountry,
      documentType,
    });
  };

  const selectedDestinationObj = DESTINATIONS.find((d) => d.code === selectedCountry) || DESTINATIONS[0];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Card Header */}
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Document Ingestion Portal
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Autonomous Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest invoices, bills of lading, manifests, or HazMat filings for continuous regulatory cross-referencing.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            File Ingestion
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'text'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Text / Samples ({SAMPLE_DOCUMENTS.length})
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Destination & Document Type Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Country */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Destination Jurisdiction
            </label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => onSelectCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-medium cursor-pointer"
              >
                {DESTINATIONS.map((d) => (
                  <option key={d.code} value={d.code} className="bg-slate-900 text-white">
                    {d.flag} {d.name} ({d.authority})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <Globe className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Authority:</span>
              <span className="text-emerald-400 font-mono">{selectedDestinationObj.authority}</span>
            </p>
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Logistics Document Type
            </label>
            <div className="relative">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-medium cursor-pointer"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt} value={dt} className="bg-slate-900 text-white">
                    {dt}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports multi-item customs classification & valuation cross-check
            </p>
          </div>
        </div>

        {/* 1-Click Instant Sample Scenarios Bar */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Instant Pre-Packaged Test Scenarios:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">1-Click Auto-Fill</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SAMPLE_DOCUMENTS.map((sample) => {
              const isSelected = activeSampleId === sample.id;
              let badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
              if (sample.badge.variant === 'danger') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
              if (sample.badge.variant === 'success') badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className={`text-left p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                        {sample.destination_country} • {sample.badge.label.split('/')[0].trim()}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-100 line-clamp-1">{sample.title.split('(')[0]}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{sample.subtitle}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-800/60">
                    <span>{sample.destination_country === 'USA' ? '🇺🇸 49 CFR DG' : sample.destination_country === 'UAE' ? '🇦🇪 Dual-Use' : sample.destination_country === 'EU' ? '🇪🇺 EUDR Clean' : '🇸🇬 Pharma HSA'}</span>
                    <span className="text-emerald-400">Load →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Mode Tab */}
        {activeTab === 'upload' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp,.txt,.csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700/80 bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-900/60'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Drag and drop shipping manifest, B/L, or invoice here
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Supports <strong className="text-slate-300">PDF, PNG, JPG, WEBP</strong> invoices, packing lists, and text manifests (Up to 25MB)
                </p>
                <button
                  type="button"
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 border border-slate-700 transition-colors"
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  {/* Thumbnail if image, else specialized document icon */}
                  {fileThumbnail ? (
                    <div
                      onClick={() => setPreviewOpen(true)}
                      className="w-12 h-12 rounded-lg border border-emerald-500/40 overflow-hidden bg-slate-900 shrink-0 cursor-pointer hover:opacity-90 transition-opacity relative group"
                      title="Click to preview image"
                    >
                      <img src={fileThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setPreviewOpen(true)}
                      className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                      title="Click to preview document"
                    >
                      {file.type === 'application/pdf' || file.name.endsWith('.pdf') ? (
                        <FileText className="w-6 h-6 text-rose-400" />
                      ) : (
                        <FileText className="w-6 h-6 text-emerald-400" />
                      )}
                    </div>
                  )}

                  <div className="truncate min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {file.type === 'application/pdf' || file.name.endsWith('.pdf') ? 'PDF' : file.type.startsWith('image/') ? 'Image' : 'Text'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || 'Customs document'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 border border-slate-700 transition-all cursor-pointer shadow-sm hover:border-emerald-500/40"
                    title="Preview Document before Audit"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Preview Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Remove File"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Mode Tab */}
        {activeTab === 'text' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Document Text Content / OCR Stream
              </label>
              <div className="flex items-center gap-2">
                {rawText && (
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-mono font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview Full Text</span>
                  </button>
                )}
                {rawText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-mono cursor-pointer"
                  >
                    Clear Content
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setActiveSampleId(null);
              }}
              rows={7}
              placeholder="Paste raw invoice text, manifest table, bill of lading entries, or click one of the pre-loaded scenarios above..."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y"
            />
          </div>
        )}

        {/* Submit Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>GenAI Autonomous Audit Loop</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(file || rawText.trim()) && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm hover:border-emerald-500/40"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Preview Document</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || (!file && !rawText.trim())}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                isLoading || (!file && !rawText.trim())
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 cursor-pointer transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Running Autonomous Audit Loop...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Initiate Autonomous Compliance Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={file}
        rawText={rawText}
        documentType={documentType}
        destinationCountry={selectedCountry}
        onTriggerAudit={() => {
          onAudit({
            file,
            rawText,
            destinationCountry: selectedCountry,
            documentType,
          });
        }}
        isLoading={isLoading}
      />
    </div>
  );
};
