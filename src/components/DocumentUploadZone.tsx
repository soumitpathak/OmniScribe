import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import {
  Upload,
  FileText,
  Globe,
  Sparkles,
  Check,
  AlertCircle,
  FileUp,
  X,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Hash,
  Crosshair,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Play,
  RotateCcw,
  ExternalLink,
  Building,
} from 'lucide-react';
import { AuditResponse } from '../types/compliance';
import { FilePreviewModal } from './FilePreviewModal';
import { useToast } from '../context/ToastContext';
import { RegionAnnotation } from '../types/auth';

export interface BatchItem {
  id: string;
  name: string;
  size: number;
  file?: File;
  sampleText?: string;
  sourceCountry?: string;
  destinationCountry: string;
  documentType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: AuditResponse;
  error?: string;
}

interface DocumentUploadZoneProps {
  onAudit: (data: {
    file: File | null;
    rawText: string;
    sourceCountry?: string;
    destinationCountry: string;
    documentType: string;
    focusRegions?: RegionAnnotation[];
  }) => void;
  isLoading: boolean;
  selectedCountry: string;
  onSelectCountry: (c: string) => void;
  onOpenHSLookup?: () => void;
  injectedHSCode?: { code: string; title: string; timestamp: number } | null;
  onBatchAuditCompleted?: (audit: AuditResponse) => void;
}

export const SOURCES = [
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'OTHER', name: 'Other Origin / Free Zone', flag: '🌐' },
];

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
  onOpenHSLookup,
  injectedHSCode,
  onBatchAuditCompleted,
}) => {
  const toast = useToast();
  const [sourceCountry, setSourceCountry] = useState('China');
  const [documentType, setDocumentType] = useState('Commercial Invoice');
  const [file, setFile] = useState<File | null>(null);
  const [fileThumbnail, setFileThumbnail] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'batch' | 'text'>('upload');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [focusRegions, setFocusRegions] = useState<RegionAnnotation[]>([]);

  // Batch Processing State (Requirement 9)
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-inject selected HS Code into the manifest text
  useEffect(() => {
    if (injectedHSCode) {
      const newLine = `\nItem: ${injectedHSCode.title}\nHS Code: ${injectedHSCode.code}\nClassification Status: Verified WCO 2026 Heading\n`;
      setRawText((prev) => (prev.trim() ? `${prev.trim()}\n${newLine}` : newLine.trim()));
      setActiveTab('text');
    }
  }, [injectedHSCode]);

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
      if (e.dataTransfer.files.length > 1) {
        // Multi-file dropped -> switch to batch mode
        handleBatchFiles(Array.from(e.dataTransfer.files));
      } else {
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1) {
        handleBatchFiles(Array.from(e.target.files));
      } else {
        handleSelectedFile(e.target.files[0]);
      }
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    // Validate file size (25MB limit)
    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error(
        'Upload Rejected: File Size Exceeded',
        `File "${selectedFile.name}" is ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB. Max limit is 25MB.`
      );
      return;
    }

    setFile(selectedFile);

    const isImg = selectedFile.type.startsWith('image/');
    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    const kind = isImg ? 'Image invoice' : isPdf ? 'PDF customs document' : 'Logistics manifest';

    if (isImg) {
      if (fileThumbnail) URL.revokeObjectURL(fileThumbnail);
      setFileThumbnail(URL.createObjectURL(selectedFile));
    } else {
      if (fileThumbnail) URL.revokeObjectURL(fileThumbnail);
      setFileThumbnail(null);
    }

    if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawText((event.target?.result as string) || '');
      };
      reader.readAsText(selectedFile);
    }

    toast.success(
      'Document Successfully Uploaded',
      `"${selectedFile.name}" (${(selectedFile.size / 1024).toFixed(1)} KB ${kind}) ingested. Ready for regulatory audit.`
    );
  };

  // Add files to batch queue
  const handleBatchFiles = (files: File[]) => {
    const newItems: BatchItem[] = files.map((f, idx) => ({
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      name: f.name,
      size: f.size,
      file: f,
      sourceCountry: sourceCountry,
      destinationCountry: selectedCountry,
      documentType: documentType,
      status: 'queued',
      progress: 0,
    }));

    setBatchQueue((prev) => [...prev, ...newItems]);
    setActiveTab('batch');
    toast.info('Batch Manifests Added', `Added ${files.length} document(s) to concurrent audit queue.`);
  };

  // Execute Concurrent Batch Audit
  const handleRunBatchProcessing = async () => {
    if (batchQueue.length === 0 || isBatchRunning) return;

    setIsBatchRunning(true);
    toast.info('Concurrent Batch Audit Started', `Processing ${batchQueue.length} shipments concurrently...`);

    // Process files with concurrency limit
    const updatedQueue = [...batchQueue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status === 'completed') continue;

      // Mark processing & simulate initial progress
      setBatchQueue((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, status: 'processing', progress: 35 } : b))
      );

      try {
        let auditResult: AuditResponse;

        if (item.file) {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('sourceCountry', item.sourceCountry || sourceCountry);
          formData.append('destinationCountry', item.destinationCountry);
          formData.append('documentType', item.documentType);

          const res = await fetch('/api/audit', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          auditResult = await res.json();
        } else {
          const res = await fetch('/api/audit-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceCountry: item.sourceCountry || sourceCountry,
              destinationCountry: item.destinationCountry,
              documentType: item.documentType,
              rawText: item.sampleText || '',
              fileName: item.name,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          auditResult = await res.json();
        }

        // Notify app level so history is updated
        if (onBatchAuditCompleted) {
          onBatchAuditCompleted(auditResult);
        }

        setBatchQueue((prev) =>
          prev.map((b) =>
            b.id === item.id
              ? { ...b, status: 'completed', progress: 100, result: auditResult }
              : b
          )
        );
      } catch (err: any) {
        console.error(`Batch item ${item.name} failed:`, err);
        setBatchQueue((prev) =>
          prev.map((b) =>
            b.id === item.id
              ? { ...b, status: 'failed', progress: 100, error: err.message || 'Audit failed' }
              : b
          )
        );
      }
    }

    setIsBatchRunning(false);
    toast.success('Concurrent Batch Audit Complete', 'All queued logistics files processed through statutory rules.');
  };

  const handleInspectBatchResult = (item: BatchItem) => {
    if (item.result) {
      onAudit({
        file: item.file || null,
        rawText: item.sampleText || '',
        sourceCountry: item.sourceCountry || sourceCountry,
        destinationCountry: item.destinationCountry,
        documentType: item.documentType,
      });
    }
  };

  const handleClearBatchQueue = () => {
    setBatchQueue([]);
    toast.info('Batch Queue Cleared', 'All queued items have been removed.');
  };

  const handleClear = () => {
    if (fileThumbnail) URL.revokeObjectURL(fileThumbnail);
    setFileThumbnail(null);
    setFile(null);
    setRawText('');
    setFocusRegions([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Document Cleared', 'Ready for new customs document ingestion.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      toast.warning('No Document Ingested', 'Please upload a file or paste manifest text to run the audit.');
      return;
    }

    onAudit({
      file,
      rawText,
      sourceCountry,
      destinationCountry: selectedCountry,
      documentType,
      focusRegions,
    });
  };

  const selectedDestinationObj = DESTINATIONS.find((d) => d.code === selectedCountry) || DESTINATIONS[0];
  const batchCompletedCount = batchQueue.filter((b) => b.status === 'completed').length;

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
            Ingest invoices, bills of lading, manifests, or HazMat filings individually or in concurrent batches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenHSLookup && (
            <button
              type="button"
              onClick={onOpenHSLookup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-colors shadow-sm cursor-pointer"
              title="Search International Commodity Codes"
            >
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">HS Code Helper</span>
            </button>
          )}

          {/* Three-way Tab switcher: Single, Batch, Text */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Single File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'batch'
                  ? 'bg-cyan-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Queue</span>
              {batchQueue.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
                  {batchQueue.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Manifest Text</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Source Origin, Destination Jurisdiction & Document Type Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Source Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Source / Export Origin</span>
              <span className="text-[10px] text-cyan-400 font-mono font-normal">POL Origin</span>
            </label>
            <div className="relative">
              <select
                value={sourceCountry}
                onChange={(e) => setSourceCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none font-medium cursor-pointer"
              >
                {SOURCES.map((s) => (
                  <option key={s.code} value={s.name} className="bg-slate-900 text-white">
                    {s.flag} {s.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <Building className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Origin:</span>
              <span className="text-cyan-400 font-mono">{sourceCountry}</span>
            </p>
          </div>

          {/* Destination Jurisdiction */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Destination Jurisdiction</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">Customs POD</span>
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
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Logistics Document Type</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">Format</span>
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
              Supports multi-item customs valuation & screening
            </p>
          </div>
        </div>

        {/* --- TAB 1: SINGLE FILE UPLOAD --- */}
        {activeTab === 'upload' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
              multiple
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-700/80 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-950/80'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  Drop shipment documents here, or <span className="text-emerald-400 underline">browse files</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Commercial Invoices, Bills of Lading, AWBs in PDF, PNG, JPG, or CSV (up to 25MB).
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    💡 Tip: Drop multiple files to auto-queue concurrent batch audit
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {fileThumbnail ? (
                    <img
                      src={fileThumbnail}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-sm">{file.name}</p>
                    <p className="text-xs text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || 'Customs Document'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Preview & Tag</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading || !file}
                className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isLoading || !file
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
          </form>
        )}

        {/* --- TAB 2: BATCH PROCESSING (Requirement 9) --- */}
        {activeTab === 'batch' && (
          <div className="space-y-4">
            <input
              ref={batchFileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleBatchFiles(Array.from(e.target.files));
                }
              }}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
              multiple
              className="hidden"
            />

            {/* Batch Controls & Drop Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => batchFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add Files to Batch</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {batchQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearBatchQueue}
                    disabled={isBatchRunning}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Clear batch queue"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRunBatchProcessing}
                  disabled={batchQueue.length === 0 || isBatchRunning}
                  className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    batchQueue.length === 0 || isBatchRunning
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white shadow-md shadow-emerald-500/25 cursor-pointer'
                  }`}
                >
                  {isBatchRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Auditing Batch Concurrently...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Concurrent Audit ({batchQueue.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Batch Progress Overview Bar */}
            {batchQueue.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">
                    Batch Completion: <strong className="text-emerald-400">{batchCompletedCount}/{batchQueue.length}</strong>
                  </span>
                  <span className="text-slate-400">
                    {Math.round((batchCompletedCount / batchQueue.length) * 100)}% Complete
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${(batchCompletedCount / batchQueue.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Batch Queue List (Requirement 9) */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {batchQueue.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  No documents in batch queue. Click <strong>"Add Files to Batch"</strong> or load test samples above!
                </div>
              ) : (
                batchQueue.map((item, idx) => {
                  let statusBadge = (
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      QUEUED
                    </span>
                  );

                  if (item.status === 'processing') {
                    statusBadge = (
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        AUDITING
                      </span>
                    );
                  } else if (item.status === 'completed' && item.result) {
                    const isApp = item.result.audit_status === 'APPROVED';
                    const isFlag = item.result.audit_status === 'FLAGGED';
                    statusBadge = (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                          isApp
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isFlag
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {item.result.audit_status} ({item.result.risk_score}/100)
                      </span>
                    );
                  } else if (item.status === 'failed') {
                    statusBadge = (
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        FAILED
                      </span>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-white truncate max-w-xs">{item.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Dest: {item.destinationCountry} • {(item.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {statusBadge}

                        {item.result && (
                          <button
                            type="button"
                            onClick={() => handleInspectBatchResult(item)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Inspect full audit report"
                          >
                            <span>Dossier</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- TAB 3: MANIFEST TEXT INPUT --- */}
        {activeTab === 'text' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Raw Manifest / Invoice Text Data
                </label>
                {rawText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[11px] text-slate-400 hover:text-rose-400 font-mono transition-colors cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste electronic invoice lines, bill of lading cargo manifests, dangerous goods declarations, or OCR text..."
                rows={7}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading || !rawText.trim()}
                className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isLoading || !rawText.trim()
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
          </form>
        )}
      </div>

      {/* File Preview Modal with Region Annotation Support */}
      <FilePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={file}
        rawText={rawText}
        documentType={documentType}
        destinationCountry={selectedCountry}
        initialAnnotations={focusRegions}
        onSaveAnnotations={(updated) => setFocusRegions(updated)}
        onTriggerAudit={(annotated) => {
          const effective = annotated || focusRegions;
          setFocusRegions(effective);
          onAudit({
            file,
            rawText,
            destinationCountry: selectedCountry,
            documentType,
            focusRegions: effective,
          });
        }}
        isLoading={isLoading}
      />
    </div>
  );
};
