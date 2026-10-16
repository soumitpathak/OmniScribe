import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  rawText: string;
  documentType: string;
  destinationCountry: string;
  onTriggerAudit: () => void;
  isLoading: boolean;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  rawText,
  documentType,
  destinationCountry,
  onTriggerAudit,
  isLoading,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate object URL for file
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

  // Reset zoom & rotation when file changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
    }
  }, [isOpen, file]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                  {file ? file.name : `${documentType} Preview`}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {isPdf ? 'PDF Document' : isImage ? 'Image Invoice' : 'Text Manifest'}
                </span>
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

          {/* Controls & Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Image zoom controls */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 mr-2">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono text-[11px] font-semibold">{zoom}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-4 h-4" />
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
                <span>Open in Tab</span>
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
              onClick={() => {
                onClose();
                onTriggerAudit();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Run Audit</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 flex items-center justify-center relative">
          {/* 1. Image Viewer */}
          {isImage && objectUrl ? (
            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center">
              <div
                className="transition-transform duration-200 ease-out origin-center inline-block shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={objectUrl}
                  alt={file?.name || 'Document Preview'}
                  className="max-h-[68vh] object-contain select-none"
                />
              </div>
            </div>
          ) : isPdf && objectUrl ? (
            /* 2. PDF Viewer */
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
              <iframe
                src={`${objectUrl}#toolbar=1&navpanes=1`}
                title="PDF Document Preview"
                className="w-full h-full border-none rounded-xl bg-slate-950"
              />
            </div>
          ) : hasText ? (
            /* 3. Text / Raw Manifest Viewer */
            <div className="w-full h-full flex flex-col rounded-xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Raw Logistics Manifest & Commercial Entries</span>
                <span>{rawText.split('\n').length} Lines • {rawText.length} Chars</span>
              </div>
              <pre className="p-4 overflow-auto flex-1 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500 selection:text-white">
                {rawText}
              </pre>
            </div>
          ) : (
            /* 4. Empty State */
            <div className="text-center py-16 text-slate-500 text-xs">
              <FileText className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No document content selected</p>
              <p className="mt-1">Upload a PDF or image file or choose a pre-loaded sample invoice.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Pre-Audit Inspection Preview • Ready for Gemini 3.8 Flash Extraction</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                onClose();
                onTriggerAudit();
              }}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer"
            >
              Proceed to Audit →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
