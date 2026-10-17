import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentUploadZone } from './components/DocumentUploadZone';
import { AuditReportView } from './components/AuditReportView';
import { AuditPipelineAnimation } from './components/AuditPipelineAnimation';
import { RegulatoryRulesModal } from './components/RegulatoryRulesModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { SystemArchitectureModal } from './components/SystemArchitectureModal';
import { HSCodeLookupModal } from './components/HSCodeLookupModal';
import { HomePage } from './components/HomePage';
import { AuditResponse } from './types/compliance';
import { RegionAnnotation } from './types/auth';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import { AlertCircle, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'omniscribe_audit_history_v1';

export default function App() {
  const toast = useToast();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState<string>('USA');
  const [currentAudit, setCurrentAudit] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<AuditResponse[]>([]);

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);
  const [isHSLookupOpen, setIsHSLookupOpen] = useState<boolean>(false);
  const [injectedHSCode, setInjectedHSCode] = useState<{ code: string; title: string; timestamp: number } | null>(null);

  // Load audit history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage:', e);
    }
  }, []);

  // Save audit history to local storage
  const saveAuditToHistory = (audit: AuditResponse) => {
    setHistory((prev) => {
      const updated = [audit, ...prev.filter((item) => item.audit_id !== audit.audit_id)].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  // Main Audit Execution Trigger
  const handleRunAudit = async (data: {
    file: File | null;
    rawText: string;
    destinationCountry: string;
    documentType: string;
    focusRegions?: RegionAnnotation[];
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let result: AuditResponse;

      if (data.file) {
        // Send as FormData
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('destinationCountry', data.destinationCountry);
        formData.append('documentType', data.documentType);
        if (data.rawText) {
          formData.append('rawText', data.rawText);
        }
        if (data.focusRegions && data.focusRegions.length > 0) {
          formData.append('focusRegions', JSON.stringify(data.focusRegions));
        }

        const response = await fetch('/api/audit', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Audit request failed with status ${response.status}`);
        }

        result = await response.json();
      } else {
        // Send as JSON
        const response = await fetch('/api/audit-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinationCountry: data.destinationCountry,
            documentType: data.documentType,
            rawText: data.rawText,
            focusRegions: data.focusRegions || [],
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Audit request failed with status ${response.status}`);
        }

        result = await response.json();
      }

      setCurrentAudit(result);
      saveAuditToHistory(result);

      // Trigger audit completion toast
      const isApproved = result.audit_status === 'APPROVED';
      const isFlagged = result.audit_status === 'FLAGGED';
      if (isApproved) {
        toast.success(
          'Audit Completed: Entry Cleared',
          `Consignment ${result.audit_id} approved for ${result.destination_country} (Risk Score: ${result.risk_score}/100).`
        );
      } else if (isFlagged) {
        toast.warning(
          'Audit Completed: Review Required',
          `Consignment ${result.audit_id} flagged (Risk Score: ${result.risk_score}/100) — ${result.compliance_discrepancies.length} discrepancies identified.`
        );
      } else {
        toast.error(
          'Audit Completed: Entry Rejected',
          `Consignment ${result.audit_id} rejected (Risk Score: ${result.risk_score}/100) — Quarantine hold mandated.`
        );
      }
    } catch (err: any) {
      console.error('Audit execution failed:', err);
      const msg = err.message || 'An unexpected technical error occurred during the compliance audit. Please retry.';
      setErrorMessage(msg);
      toast.error('Audit Technical Error', msg, 7000);
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not authenticated, render the professional OmniScribe HomePage
  if (!isAuthenticated && !isAuthLoading) {
    return (
      <>
        <HomePage
          onOpenRulesPreview={() => setIsRulesOpen(true)}
          onOpenHSLookupPreview={() => setIsHSLookupOpen(true)}
        />

        {/* Global Modals for Landing View */}
        <RegulatoryRulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
        />

        <HSCodeLookupModal
          isOpen={isHSLookupOpen}
          onClose={() => setIsHSLookupOpen(false)}
          onApplyCode={(code, title) => {
            setInjectedHSCode({ code, title, timestamp: Date.now() });
            setIsHSLookupOpen(false);
          }}
        />
      </>
    );
  }

  // Once authenticated: User sees the full OmniScribe Compliance Workspace
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenHSLookup={() => setIsHSLookupOpen(true)}
        historyCount={history.length}
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white font-mono px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic State: Upload Portal vs Pipeline Animation vs Audit Results */}
        {isLoading ? (
          <AuditPipelineAnimation country={selectedCountry} />
        ) : currentAudit ? (
          <AuditReportView
            audit={currentAudit}
            onReset={() => setCurrentAudit(null)}
            history={history}
            onSelectAudit={(audit) => setCurrentAudit(audit)}
          />
        ) : (
          <div className="space-y-8">
            {/* Auditor Greeting & Welcome Banner */}
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-3xl space-y-4 relative z-10">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Authenticated Workspace • {user?.company || 'Global Logistics Port'}</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Logistics Regulatory Compliance Agent
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Welcome back, <strong className="text-white">{user?.name}</strong>. Inspect bills of lading, commercial invoices, and hazardous declarations against global customs regulations ({selectedCountry} framework) before consignment dispatch.
                </p>

                {/* Key stats banner */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Harmonized Codes</span>
                    <strong className="text-white text-sm">6 - 10 Digits</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Hazard Controls</span>
                    <strong className="text-amber-400 text-sm">UN3480 / DG 9</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Tariff Defense</span>
                    <strong className="text-cyan-400 text-sm">Section 301 / CBAM</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Audit Status</span>
                    <strong className="text-emerald-400 text-sm">Approved / Flagged</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Ingestion Zone */}
            <DocumentUploadZone
              onAudit={handleRunAudit}
              isLoading={isLoading}
              selectedCountry={selectedCountry}
              onSelectCountry={setSelectedCountry}
              onOpenHSLookup={() => setIsHSLookupOpen(true)}
              injectedHSCode={injectedHSCode}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-300">OmniScribe</span>
            <span>•</span>
            <span>Autonomous Regulatory Compliance & Continuous Audit Agent</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RegulatoryRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <AuditHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectAudit={(audit) => setCurrentAudit(audit)}
        onClearHistory={handleClearHistory}
      />

      <SystemArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <HSCodeLookupModal
        isOpen={isHSLookupOpen}
        onClose={() => setIsHSLookupOpen(false)}
        onApplyCode={(code, title) => {
          setInjectedHSCode({ code, title, timestamp: Date.now() });
          setCurrentAudit(null);
        }}
      />
    </div>
  );
}
