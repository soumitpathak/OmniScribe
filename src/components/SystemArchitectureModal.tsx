import React, { useState } from 'react';
import { X, FileCode2, Terminal, Cloud, Layers, CheckCircle, Copy, Check } from 'lucide-react';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dockerfile' | 'requirements' | 'fastapi'>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const dockerfileSnippet = `# OmniScribe Google Cloud Run Dockerfile
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.11-slim AS production
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./dist
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8080
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port \${PORT:-8080} --workers 2"]`;

  const reqsSnippet = `fastapi==0.115.0
uvicorn[standard]==0.32.0
google-genai==2.4.0
pydantic==2.9.2
python-multipart==0.0.12
python-dotenv==1.0.1
aiofiles==24.1.0
requests==2.32.3`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                System Architecture & Google Cloud Run Deployment
              </h2>
              <p className="text-xs text-slate-400">
                Production-ready Python (FastAPI) Backend, Gemini Multimodal SDK, & Multi-Stage Container
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

        {/* Tab Selector */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/50 flex gap-2 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture Overview
          </button>
          <button
            onClick={() => setActiveTab('dockerfile')}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'dockerfile'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dockerfile (Cloud Run)
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'requirements'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            requirements.txt
          </button>
          <button
            onClick={() => setActiveTab('fastapi')}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'fastapi'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            FastAPI Endpoints
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Autonomous Agent Pipeline Flow
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 1</span>
                    <strong className="text-white block text-xs">Document Ingestion</strong>
                    <span className="text-[11px] text-slate-400 mt-1 block">PDF, Image, B/L, Manifest OCR via Gemini multimodal</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 2</span>
                    <strong className="text-white block text-xs">Entity & HS Extraction</strong>
                    <span className="text-[11px] text-slate-400 mt-1 block">Shipper, Consignee, HTS 6-10 digit code resolution</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 3</span>
                    <strong className="text-white block text-xs">Cross-Border Rules</strong>
                    <span className="text-[11px] text-slate-400 mt-1 block">HazMat UN3480, Dual-Use, Section 301, CBAM, EUDR</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 4</span>
                    <strong className="text-white block text-xs">Autonomous Audit</strong>
                    <span className="text-[11px] text-slate-400 mt-1 block">Decision (APPROVED / FLAGGED / REJECTED) & Risk Score (0-100)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Python FastAPI Production Runner
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    The backend service in <code className="text-emerald-300">backend/main.py</code> exposes clean REST endpoints using FastAPI, Pydantic v2 schemas, and python-multipart. It compiles cleanly to Cloud Run container images listening on <code className="text-emerald-300">$PORT</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    Google GenAI SDK Integration
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Powered by <code className="text-cyan-300">gemini-3.8-flash</code> with structured JSON schema responses (<code className="text-cyan-300">responseMimeType: "application/json"</code>). Server-side executed without exposing keys to the browser.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dockerfile' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">/Dockerfile (Multi-Stage Node + Python)</span>
                <button
                  onClick={() => handleCopy(dockerfileSnippet, 'docker')}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copied === 'docker' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'docker' ? 'Copied' : 'Copy Dockerfile'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {dockerfileSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">/requirements.txt</span>
                <button
                  onClick={() => handleCopy(reqsSnippet, 'reqs')}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copied === 'reqs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'reqs' ? 'Copied' : 'Copy Requirements'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {reqsSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'fastapi' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">POST</span>
                  <span>/api/audit</span>
                </div>
                <p className="text-slate-400 mt-1 text-[11px] font-sans">
                  Accepts multipart/form-data: <code className="text-slate-200">file</code> (PDF/Image/Text), <code className="text-slate-200">destination_country</code>, <code className="text-slate-200">document_type</code>, <code className="text-slate-200">raw_text</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px]">POST</span>
                  <span>/api/audit-json</span>
                </div>
                <p className="text-slate-400 mt-1 text-[11px] font-sans">
                  JSON payload with <code className="text-slate-200">file_base64</code>, <code className="text-slate-200">file_mime_type</code>, <code className="text-slate-200">destination_country</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px]">GET</span>
                  <span>/api/health</span>
                </div>
                <p className="text-slate-400 mt-1 text-[11px] font-sans">
                  Cloud Run liveness/readiness probe endpoint.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Ready for Google Cloud Run deployment via <code>gcloud run deploy</code></span>
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
