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
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';

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
  stage?: string;
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
      stage: 'Queued for regulatory verification',
    }));

    setBatchQueue((prev) => [...prev, ...newItems]);
    setActiveTab('batch');
    toast.info('Batch Manifests Added', `Added ${files.length} document(s) to concurrent audit queue.`);
  };

  // Add built-in sample documents to batch queue for instant concurrent auditing test
  const handleLoadSampleBatch = () => {
    const newSamples: BatchItem[] = SAMPLE_DOCUMENTS.map((doc, idx) => ({
      id: `batch-sample-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      name: `${doc.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`,
      size: 1024 * (52 + idx * 31),
      sampleText: doc.sample_text,
      sourceCountry: doc.title.includes('China')
        ? 'China'
        : doc.title.includes('Taiwan')
        ? 'Taiwan'
        : doc.title.includes('India')
        ? 'India'
        : 'Germany',
      destinationCountry: doc.destination_country,
      documentType: doc.document_type,
      status: 'queued',
      progress: 0,
      stage: 'Queued for regulatory verification',
    }));

    setBatchQueue((prev) => [...prev, ...newSamples]);
    setActiveTab('batch');
    toast.success('Sample Manifests Loaded', `Enqueued ${newSamples.length} international shipping documents for batch auditing.`);
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemCountry = (id: string, country: string) => {
    setBatchQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, destinationCountry: country } : item))
    );
  };

  // Execute Individual Batch Item through Audit Engine
  const processBatchItem = async (item: BatchItem) => {
    // Stage 1: Ingestion & OCR
    setBatchQueue((prev) =>
      prev.map((b) =>
        b.id === item.id
          ? { ...b, status: 'processing', progress: 15, stage: 'Ingesting document & OCR extraction...' }
          : b
      )
    );

    // Dynamic timer to simulate real-world analysis progression while waiting for server response
    const progressTimer = setInterval(() => {
      setBatchQueue((prev) =>
        prev.map((b) => {
          if (b.id !== item.id || b.status !== 'processing') return b;
          const current = b.progress;
          const increment = Math.floor(Math.random() * 12) + 8;
          const nextVal = Math.min(88, current + increment);
          let stageLabel = b.stage;
          if (nextVal >= 70) {
            stageLabel = 'Synthesizing statutory verdict & customs remedies...';
          } else if (nextVal >= 45) {
            stageLabel = 'Screening Hazardous Materials (UN3480) & Trade Sanctions...';
          } else if (nextVal >= 25) {
            stageLabel = 'Cross-referencing Harmonized Tariff System (HTS)...';
          }
          return { ...b, progress: nextVal, stage: stageLabel };
        })
      );
    }, 450);

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
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Audit request failed with status ${res.status}`);
        }
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
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Audit request failed with status ${res.status}`);
        }
        auditResult = await res.json();
      }

      clearInterval(progressTimer);

      // Immediately notify parent so dashboard statistics update in real-time
      if (onBatchAuditCompleted) {
        onBatchAuditCompleted(auditResult);
      }

      setBatchQueue((prev) =>
        prev.map((b) =>
          b.id === item.id
            ? {
                ...b,
                status: 'completed',
                progress: 100,
                stage: 'Audit Completed',
                result: auditResult,
              }
            : b
        )
      );
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error(`Batch item ${item.name} failed:`, err);
      setBatchQueue((prev) =>
        prev.map((b) =>
          b.id === item.id
            ? {
                ...b,
                status: 'failed',
                progress: 100,
                stage: 'Audit Failed',
                error: err.message || 'Audit execution encountered a technical error',
              }
            : b
        )
      );
    }
  };

  // Execute Concurrent Batch Audit using a concurrency pool (up to 3 concurrent workers)
  const handleRunBatchProcessing = async () => {
    const pendingItems = batchQueue.filter((item) => item.status !== 'completed');
    if (pendingItems.length === 0) {
      toast.info('All Audits Completed', 'All documents in the batch queue have already been audited.');
      return;
    }
    if (isBatchRunning) return;

    setIsBatchRunning(true);
    toast.info(
      'Concurrent Batch Audit Started',
      `Processing ${pendingItems.length} shipping manifests concurrently (up to 3 parallel workers)...`
    );

    const CONCURRENCY_LIMIT = 3;
    const executing = new Set<Promise<void>>();

    for (const item of pendingItems) {
      const p = processBatchItem(item).then(() => {
        executing.delete(p);
      });
      executing.add(p);

      if (executing.size >= CONCURRENCY_LIMIT) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    setIsBatchRunning(false);

    // Compute summary breakdown
    setBatchQueue((currentQueue) => {
      const completed = currentQueue.filter((b) => b.status === 'completed' && b.result);
      const approved = completed.filter((b) => b.result?.audit_status === 'APPROVED').length;
      const flagged = completed.filter((b) => b.result?.audit_status === 'FLAGGED').length;
      const rejected = completed.filter((b) => b.result?.audit_status === 'REJECTED').length;
      const failed = currentQueue.filter((b) => b.status === 'failed').length;

      toast.success(
        'Concurrent Batch Audit Complete',
        `${completed.length} audited: ${approved} Approved, ${flagged} Flagged, ${rejected} Rejected${failed > 0 ? `, ${failed} Failed` : ''}.`
      );

      return currentQueue;
    });
  };

  // Retry an individual failed item concurrently
  const handleRetryBatchItem = (item: BatchItem) => {
    processBatchItem(item);
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

        {/* --- TAB 2: BATCH PROCESSING --- */}
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

            {/* Batch Ingestion Dropzone & Action Bar */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleBatchFiles(Array.from(e.dataTransfer.files));
                }
              }}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                  : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Concurrent Batch Document Ingestion</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-normal">
                      Up to 3 Parallel Workers
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Drop multiple bills of lading, invoices, or manifests to run simultaneous autonomous audits.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => batchFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Multiple Files</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSampleBatch}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Load 4 realistic international shipping test documents"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load Sample Batch</span>
                </button>

                {batchQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearBatchQueue}
                    disabled={isBatchRunning}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
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
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white shadow-md shadow-emerald-500/25 cursor-pointer transform hover:-translate-y-0.5'
                  }`}
                >
                  {isBatchRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Auditing Concurrently...</span>
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
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">
                      Batch Completion: <strong className="text-emerald-400">{batchCompletedCount}/{batchQueue.length}</strong>
                    </span>
                    {isBatchRunning && (
                      <span className="flex items-center gap-1 text-[11px] text-cyan-400 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>Active Concurrency</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>{Math.round((batchCompletedCount / batchQueue.length) * 100)}% Complete</span>
                  </div>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/30"
                    style={{ width: `${(batchCompletedCount / batchQueue.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Batch Queue List with Individual Progress State */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {batchQueue.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 p-6 space-y-2">
                  <FileUp className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-semibold text-sm">No shipments currently in batch queue</p>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Select multiple files using <strong>"Select Multiple Files"</strong>, drag documents onto this area, or test with <strong>"Load Sample Batch"</strong>.
                  </p>
                </div>
              ) : (
                batchQueue.map((item) => {
                  let statusBadge = (
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      QUEUED
                    </span>
                  );

                  if (item.status === 'processing') {
                    statusBadge = (
                      <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40 flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                        AUDITING {item.progress}%
                      </span>
                    );
                  } else if (item.status === 'completed' && item.result) {
                    const isApp = item.result.audit_status === 'APPROVED';
                    const isFlag = item.result.audit_status === 'FLAGGED';
                    statusBadge = (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                          isApp
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isFlag
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isApp ? <CheckCircle2 className="w-3 h-3" /> : isFlag ? <AlertTriangle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        <span>{item.result.audit_status} ({item.result.risk_score}/100)</span>
                      </span>
                    );
                  } else if (item.status === 'failed') {
                    statusBadge = (
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        FAILED
                      </span>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2.5 ${
                        item.status === 'processing'
                          ? 'bg-slate-900/95 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                          : item.status === 'completed'
                          ? 'bg-slate-950/80 border-slate-800/90'
                          : item.status === 'failed'
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      {/* Top Bar: Item Info & Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                            item.status === 'completed'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : item.status === 'processing'
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>

                          <div className="truncate">
                            <p className="font-bold text-white truncate max-w-sm sm:max-w-md">{item.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span>{(item.size / 1024).toFixed(0)} KB</span>
                              <span>•</span>
                              <span className="text-slate-300">{item.documentType}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <span>Dest:</span>
                                <select
                                  value={item.destinationCountry}
                                  onChange={(e) => handleUpdateItemCountry(item.id, e.target.value)}
                                  disabled={item.status === 'processing' || isBatchRunning}
                                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.2 text-[10px] text-emerald-400 font-mono focus:outline-none cursor-pointer"
                                >
                                  {DESTINATIONS.map((d) => (
                                    <option key={d.code} value={d.code} className="bg-slate-900 text-white">
                                      {d.flag} {d.code}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status & Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {statusBadge}

                          {item.status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryBatchItem(item)}
                              disabled={isBatchRunning}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-rose-500/30"
                              title="Retry audit"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}

                          {item.result && (
                            <button
                              type="button"
                              onClick={() => handleInspectBatchResult(item)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                              title="Inspect full audit dossier"
                            >
                              <span>Inspect Dossier</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          {!isBatchRunning && item.status !== 'processing' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Remove document from queue"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Individual Progress Bar and Stage Description */}
                      {(item.status === 'processing' || item.progress > 0) && (
                        <div className="pt-1 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-cyan-400 flex items-center gap-1.5">
                              {item.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin shrink-0" />}
                              <span>{item.stage || 'Auditing document...'}</span>
                            </span>
                            <span className="text-slate-400">{item.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.status === 'completed'
                                  ? 'bg-emerald-400'
                                  : item.status === 'failed'
                                  ? 'bg-rose-500'
                                  : 'bg-gradient-to-r from-cyan-400 to-teal-400'
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
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
