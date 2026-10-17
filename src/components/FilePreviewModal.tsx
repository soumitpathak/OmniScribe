import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Copy,
  Check,
  Sparkles,
  Crosshair,
  Tag,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { RegionAnnotation } from '../types/auth';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  rawText: string;
  documentType: string;
  destinationCountry: string;
  onTriggerAudit: (annotations?: RegionAnnotation[]) => void;
  isLoading: boolean;
  initialAnnotations?: RegionAnnotation[];
  onSaveAnnotations?: (annotations: RegionAnnotation[]) => void;
}

const PRESET_LABELS = [
  { label: 'HS Tariff Code', color: '#10B981', desc: 'Verify Harmonized Commodity Code' },
  { label: 'Dangerous Goods / UN3480', color: '#F59E0B', desc: 'Inspect HazMat test certificates' },
  { label: 'Incoterms & Declared Value', color: '#06B6D4', desc: 'Check CIF/FOB valuation & invoice terms' },
  { label: 'Country of Origin / Section 301', color: '#EF4444', desc: 'Review tariff surcharge liability' },
  { label: 'Shipper / Consignee Credentials', color: '#8B5CF6', desc: 'Audit Tax ID, EORI, or EIN number' },
];

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  rawText,
  documentType,
  destinationCountry,
  onTriggerAudit,
  isLoading,
  initialAnnotations = [],
  onSaveAnnotations,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Region Annotation State
  const [annotations, setAnnotations] = useState<RegionAnnotation[]>(initialAnnotations);
  const [isAnnotatingMode, setIsAnnotatingMode] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [activeBox, setActiveBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Pending Annotation Dialog
  const [pendingBox, setPendingBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>(PRESET_LABELS[0].label);
  const [customNote, setCustomNote] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync annotations when modal opens
  useEffect(() => {
    if (isOpen) {
      setAnnotations(initialAnnotations || []);
      setZoom(100);
      setRotation(0);
      setIsAnnotatingMode(false);
      setPendingBox(null);
    }
  }, [isOpen, initialAnnotations]);

  // Object URL for file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setObjectUrl(null);
    }
  }, [file]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isImage = file?.type.startsWith('image/');
  const isPdf = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');
  const hasText = Boolean(rawText && rawText.trim().length > 0);

  const handleCopyText = () => {
    if (rawText) {
      navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetView = () => {
    setZoom(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Mouse Interaction for Drawing Annotation Regions
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotatingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setDrawStart({ x, y });
    setActiveBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.max(0, Math.min(drawStart.x, currentX));
    const y = Math.max(0, Math.min(drawStart.y, currentY));
    const width = Math.min(100 - x, Math.abs(currentX - drawStart.x));
    const height = Math.min(100 - y, Math.abs(currentY - drawStart.y));

    setActiveBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !activeBox) return;
    setIsDrawing(false);
    setDrawStart(null);

    // Minimum size check (width & height > 2% of area)
    if (activeBox.width > 2 && activeBox.height > 2) {
      setPendingBox(activeBox);
    }
    setActiveBox(null);
  };

  const handleConfirmAnnotation = () => {
    if (!pendingBox) return;
    const preset = PRESET_LABELS.find((p) => p.label === selectedLabel);
    const newAnnotation: RegionAnnotation = {
      id: `region-${Date.now().toString().slice(-5)}`,
      label: selectedLabel,
      note: customNote.trim() || undefined,
      x: Math.round(pendingBox.x * 10) / 10,
      y: Math.round(pendingBox.y * 10) / 10,
      width: Math.round(pendingBox.width * 10) / 10,
      height: Math.round(pendingBox.height * 10) / 10,
      color: preset?.color || '#10B981',
      createdAt: Date.now(),
    };

    const updated = [...annotations, newAnnotation];
    setAnnotations(updated);
    if (onSaveAnnotations) {
      onSaveAnnotations(updated);
    }
    setPendingBox(null);
    setCustomNote('');
  };

  const handleRemoveAnnotation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = annotations.filter((a) => a.id !== id);
    setAnnotations(updated);
    if (onSaveAnnotations) {
      onSaveAnnotations(updated);
    }
  };

  const handleTriggerAuditWithRegions = () => {
    if (onSaveAnnotations) {
      onSaveAnnotations(annotations);
    }
    onClose();
    onTriggerAudit(annotations);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                  {file ? file.name : `${documentType} Inspection`}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {isPdf ? 'PDF Document' : isImage ? 'Image Invoice' : 'Text Manifest'}
                </span>
                {annotations.length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {annotations.length} Focus Region{annotations.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>Dest: <strong className="text-emerald-400">{destinationCountry}</strong></span>
                <span>•</span>
                <span>Type: <strong className="text-slate-300">{documentType}</strong></span>
                {file && (
                  <>
                    <span>•</span>
                    <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            {/* Region Annotation Toggle Button */}
            <button
              type="button"
              onClick={() => setIsAnnotatingMode(!isAnnotatingMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isAnnotatingMode
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Click and drag on document to tag focus regions for Gemini agent"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isAnnotatingMode ? 'Highlighting Active' : 'Highlight Focus Regions'}</span>
            </button>

            {/* Image zoom controls */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono text-[11px] font-semibold">{zoom}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-0.5"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* If PDF, open in new tab */}
            {isPdf && objectUrl && (
              <a
                href={objectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open PDF</span>
              </a>
            )}

            {/* If Text, copy text button */}
            {hasText && (
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {/* Run Audit from Modal */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleTriggerAuditWithRegions}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Run Audit</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Region Tagging Hint Banner when enabled */}
        {isAnnotatingMode && (
          <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-6 py-2 flex items-center justify-between text-xs text-emerald-300 font-mono">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Click and drag over any document area below to highlight and label a focus zone for Gemini.</span>
            </div>
            <button
              onClick={() => setIsAnnotatingMode(false)}
              className="text-emerald-400 hover:text-white underline cursor-pointer text-[11px]"
            >
              Exit Highlight Mode
            </button>
          </div>
        )}

        {/* Modal Main Body / Canvas View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Document Viewport with Annotation Overlay */}
          <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 flex items-center justify-center relative select-none">
            {/* 1. Image Viewer with Interactive Highlighting Overlay */}
            {isImage && objectUrl ? (
              <div className="max-w-full max-h-full overflow-auto flex items-center justify-center">
                <div
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className={`relative transition-transform duration-200 ease-out origin-center inline-block shadow-2xl rounded-xl overflow-hidden border border-slate-800 bg-slate-900 ${
                    isAnnotatingMode ? 'cursor-crosshair ring-2 ring-emerald-500/40' : ''
                  }`}
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={objectUrl}
                    alt={file?.name || 'Document Preview'}
                    className="max-h-[66vh] object-contain pointer-events-none"
                    draggable={false}
                  />

                  {/* Render Existing Annotations */}
                  {annotations.map((region, idx) => (
                    <div
                      key={region.id}
                      className="absolute border-2 rounded transition-all group pointer-events-auto"
                      style={{
                        left: `${region.x}%`,
                        top: `${region.y}%`,
                        width: `${region.width}%`,
                        height: `${region.height}%`,
                        borderColor: region.color || '#10B981',
                        backgroundColor: `${region.color || '#10B981'}25`,
                      }}
                    >
                      {/* Badge Tag on top of box */}
                      <div
                        className="absolute -top-6 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-md whitespace-nowrap"
                        style={{ backgroundColor: region.color || '#10B981' }}
                      >
                        <span>#{idx + 1} {region.label}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAnnotation(region.id, e)}
                          className="hover:opacity-80 p-0.5"
                          title="Remove Tag"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Tooltip on hover */}
                      {region.note && (
                        <div className="hidden group-hover:block absolute top-full left-0 mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white shadow-xl z-20 max-w-xs font-sans">
                          <p className="text-[11px] font-mono text-emerald-400 font-bold mb-0.5">Inspector Note:</p>
                          <p className="text-slate-300 text-[11px] leading-tight">{region.note}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Active Bounding Box being drawn */}
                  {activeBox && (
                    <div
                      className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/30 pointer-events-none rounded"
                      style={{
                        left: `${activeBox.x}%`,
                        top: `${activeBox.y}%`,
                        width: `${activeBox.width}%`,
                        height: `${activeBox.height}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            ) : isPdf && objectUrl ? (
              /* 2. PDF Viewer */
              <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl relative">
                <iframe
                  src={`${objectUrl}#toolbar=1&navpanes=1`}
                  title="PDF Document Preview"
                  className="w-full h-full border-none rounded-2xl bg-slate-950"
                />
              </div>
            ) : hasText ? (
              /* 3. Text Manifest Viewer with Interactive Highlighting Mode */
              <div className="w-full h-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden relative">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Logistics Manifest & Commercial Invoice Entries</span>
                  <span>{rawText.split('\n').length} Lines • {rawText.length} Chars</span>
                </div>
                <div
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className={`p-4 overflow-auto flex-1 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap relative ${
                    isAnnotatingMode ? 'cursor-crosshair ring-1 ring-emerald-500/40' : ''
                  }`}
                >
                  {rawText}

                  {/* Render Annotations on Text */}
                  {annotations.map((region, idx) => (
                    <div
                      key={region.id}
                      className="absolute border-2 rounded transition-all pointer-events-auto"
                      style={{
                        left: `${region.x}%`,
                        top: `${region.y}%`,
                        width: `${region.width}%`,
                        height: `${region.height}%`,
                        borderColor: region.color || '#10B981',
                        backgroundColor: `${region.color || '#10B981'}20`,
                      }}
                    >
                      <div
                        className="absolute -top-5 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-md whitespace-nowrap"
                        style={{ backgroundColor: region.color || '#10B981' }}
                      >
                        <span>#{idx + 1} {region.label}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAnnotation(region.id, e)}
                          className="hover:opacity-80 p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Active drawing box */}
                  {activeBox && (
                    <div
                      className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/30 pointer-events-none rounded"
                      style={{
                        left: `${activeBox.x}%`,
                        top: `${activeBox.y}%`,
                        width: `${activeBox.width}%`,
                        height: `${activeBox.height}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              /* 4. Empty State */
              <div className="text-center py-16 text-slate-500 text-xs">
                <FileText className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">No document content selected</p>
                <p className="mt-1">Upload an invoice file or choose a pre-loaded sample document.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar: Tagged Focus Regions List & Inspector Controls */}
          {annotations.length > 0 && (
            <div className="w-72 sm:w-80 border-l border-slate-800 bg-slate-900/90 flex flex-col p-4 overflow-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Focus Regions ({annotations.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAnnotations([]);
                    if (onSaveAnnotations) onSaveAnnotations([]);
                  }}
                  className="text-[11px] font-mono text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <p className="text-[11px] text-slate-400 my-2 leading-relaxed">
                Gemini 3.8 Flash will prioritize these coordinates and instructions during the compliance audit.
              </p>

              <div className="space-y-2 mt-2 flex-1 overflow-auto">
                {annotations.map((region, idx) => (
                  <div
                    key={region.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: region.color || '#10B981' }}
                        />
                        <span className="font-bold text-white text-[11px]">#{idx + 1} {region.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnnotation(region.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Delete region"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 mb-1">
                      Box: X:{region.x}% Y:{region.y}% • W:{region.width}% H:{region.height}%
                    </div>

                    {region.note && (
                      <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                        "{region.note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAnnotatingMode(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Highlight Another Area</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pending Region Labeling Popover / Dialog */}
        {pendingBox && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Label Document Region</h4>
                    <p className="text-[11px] text-slate-400">Instruct Gemini to prioritize this area</p>
                  </div>
                </div>
                <button
                  onClick={() => setPendingBox(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preset Label Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Select Focus Category
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESET_LABELS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSelectedLabel(preset.label)}
                      className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                        selectedLabel === preset.label
                          ? 'bg-slate-800 border-emerald-500/60 text-white font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span>{preset.label}</span>
                      </div>
                      {selectedLabel === preset.label && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Inspector Note */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Specific Instructions / Questions for Agent (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Verify if UN 38.3 test summary covers this 48V 100Ah battery module..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Confirm / Cancel */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPendingBox(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAnnotation}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Save Focus Region
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Bar */}
        <div className="p-3.5 px-6 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {annotations.length > 0
                ? `${annotations.length} focus region${annotations.length > 1 ? 's' : ''} targeted for Gemini 3.8 Flash inspection`
                : 'Pre-Audit Inspection Preview • Click "Highlight Focus Regions" to tag specific lines'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleTriggerAuditWithRegions}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Proceed to Audit →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
