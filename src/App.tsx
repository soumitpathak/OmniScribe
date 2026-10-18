import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentUploadZone } from './components/DocumentUploadZone';
import { AuditReportView } from './components/AuditReportView';
import { AuditPipelineAnimation } from './components/AuditPipelineAnimation';
import { RegulatoryRulesModal } from './components/RegulatoryRulesModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { SystemArchitectureModal } from './components/SystemArchitectureModal';
import { HSCodeLookupModal } from './components/HSCodeLookupModal';
import { SettingsModal, ComplianceSettings, DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from './components/SettingsModal';
import { HighRiskAlertBanner } from './components/HighRiskAlertBanner';
import { HomePage } from './components/HomePage';
import { DashboardPage } from './components/DashboardPage';
import { SEED_AUDIT_HISTORY } from './data/seedAudits';
import { AuditResponse } from './types/compliance';
import { RegionAnnotation } from './types/auth';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import {
  saveAuditToFirestore,
  deleteAuditFromFirestore,
  subscribeAuditsFromFirestore,
} from './services/firebase';
import { AlertCircle, Sparkles, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'omniscribe_audit_history_v1';

export default function App() {
  const toast = useToast();
  const { isAuthenticated, user, firebaseUser, isLoading: isAuthLoading } = useAuth();

  const [activePage, setActivePage] = useState<'dashboard' | 'initiate_audit'>('dashboard');
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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [injectedHSCode, setInjectedHSCode] = useState<{ code: string; title: string; timestamp: number } | null>(null);

  // User-defined compliance settings including high-risk threshold
  const [settings, setSettings] = useState<ComplianceSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Active high-risk visual alert banner state
  const [highRiskAlertAudit, setHighRiskAlertAudit] = useState<AuditResponse | null>(null);

  // Trigger desktop-style browser notification
  const triggerHighRiskDesktopNotification = (audit: AuditResponse, threshold: number) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      if (Notification.permission === 'granted') {
        new Notification(`⚠️ High-Risk Consignment Flagged (${audit.risk_score}/100)`, {
          body: `Audit ${audit.audit_id} exceeded your threshold (score > ${threshold}). Consignment held for ${audit.destination_country}.`,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(`⚠️ High-Risk Consignment Flagged (${audit.risk_score}/100)`, {
              body: `Audit ${audit.audit_id} exceeded your threshold (score > ${threshold}).`,
            });
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Desktop notification notice:', e);
    }
  };

  const sanitizeAudit = (item: any): AuditResponse => {
    return {
      ...item,
      audit_id: item.audit_id || `AUD-${item.destination_country || 'USA'}-${Date.now().toString().slice(-4)}`,
      audit_status: item.audit_status || 'FLAGGED',
      risk_score: typeof item.risk_score === 'number' ? item.risk_score : 50,
      risk_level: item.risk_level || 'MODERATE',
      destination_country: item.destination_country || 'USA',
      regulatory_framework: item.regulatory_framework || 'Customs & Border Regulatory Compliance',
      timestamp: item.timestamp || new Date().toISOString(),
      extracted_entities: item.extracted_entities && typeof item.extracted_entities === 'object' ? {
        document_type: item.extracted_entities.document_type || 'Logistics Manifest',
        document_number: item.extracted_entities.document_number || item.audit_id || 'DOC-REF',
        document_date: item.extracted_entities.document_date || new Date().toISOString().slice(0, 10),
        shipper_name: item.extracted_entities.shipper_name || item.document_file_name || 'Shipper Unspecified',
        shipper_address: item.extracted_entities.shipper_address || 'Address not listed',
        shipper_country: item.extracted_entities.shipper_country || 'Origin Country',
        shipper_tax_id: item.extracted_entities.shipper_tax_id,
        consignee_name: item.extracted_entities.consignee_name || item.destination_country || 'Consignee Unspecified',
        consignee_address: item.extracted_entities.consignee_address || 'Address not listed',
        consignee_country: item.extracted_entities.consignee_country || item.destination_country || 'USA',
        consignee_tax_id: item.extracted_entities.consignee_tax_id,
        port_of_loading: item.extracted_entities.port_of_loading || 'Origin Port',
        port_of_discharge: item.extracted_entities.port_of_discharge || 'Destination Port',
        mode_of_transport: item.extracted_entities.mode_of_transport || 'Freight Cargo',
        incoterms: item.extracted_entities.incoterms || 'FOB',
        currency: item.extracted_entities.currency || 'USD',
        total_declared_value: Number(item.extracted_entities.total_declared_value) || 0,
        items: Array.isArray(item.extracted_entities.items) ? item.extracted_entities.items : [],
      } : {
        document_type: item.documentType || 'Logistics Manifest',
        document_number: item.audit_id || 'DOC-REF',
        document_date: new Date().toISOString().slice(0, 10),
        shipper_name: item.document_file_name || 'Shipper Unspecified',
        shipper_address: 'Address not listed',
        shipper_country: 'Global',
        consignee_name: 'Consignee Unspecified',
        consignee_address: 'Address not listed',
        consignee_country: item.destination_country || 'USA',
        port_of_loading: 'Origin Port',
        port_of_discharge: 'Destination Port',
        mode_of_transport: 'Freight Cargo',
        incoterms: 'FOB',
        currency: 'USD',
        total_declared_value: 0,
        items: [],
      },
      compliance_discrepancies: Array.isArray(item.compliance_discrepancies) ? item.compliance_discrepancies : [],
      discrepancy_details: Array.isArray(item.discrepancy_details) ? item.discrepancy_details : [],
      recommended_actions: Array.isArray(item.recommended_actions) ? item.recommended_actions : [],
      action_details: Array.isArray(item.action_details) ? item.action_details : [],
      agent_reasoning_trace: Array.isArray(item.agent_reasoning_trace) ? item.agent_reasoning_trace : [],
      quick_summary: item.quick_summary || undefined,
    };
  };

  // Load audit history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed.map(sanitizeAudit));
          return;
        }
      }
      // Populate seed records if storage is empty so dashboard charts are populated
      const initial = SEED_AUDIT_HISTORY.map(sanitizeAudit);
      setHistory(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
      console.warn('Failed to load history from localStorage:', e);
      setHistory(SEED_AUDIT_HISTORY.map(sanitizeAudit));
    }
  }, []);

  // Real-time Firestore synchronization for audits
  useEffect(() => {
    if (!firebaseUser) return;
    try {
      const unsubscribe = subscribeAuditsFromFirestore((remoteAudits) => {
        if (Array.isArray(remoteAudits) && remoteAudits.length > 0) {
          setHistory((prev) => {
            const auditMap = new Map<string, AuditResponse>();
            remoteAudits.forEach((r) => auditMap.set(r.audit_id, sanitizeAudit(r)));
            prev.forEach((p) => {
              if (!auditMap.has(p.audit_id)) {
                auditMap.set(p.audit_id, p);
              }
            });
            const merged = Array.from(auditMap.values()).slice(0, 50);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {
              console.warn(e);
            }
            return merged;
          });
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not establish Firestore audit listener:', err);
    }
  }, [firebaseUser]);

  // Save audit history to local storage & Firestore
  const saveAuditToHistory = (audit: AuditResponse) => {
    const cleanAudit = sanitizeAudit(audit);
    setHistory((prev) => {
      const updated = [cleanAudit, ...prev.filter((item) => item.audit_id !== cleanAudit.audit_id)].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      return updated;
    });

    // Sync to Firestore if authenticated
    if (firebaseUser?.uid || user?.id) {
      saveAuditToFirestore(cleanAudit, firebaseUser?.uid || user?.id || 'demo-officer').catch((err) => {
        console.warn('Firestore audit sync notice:', err);
      });
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn(e);
    }
    toast.info('History Cleared', 'All local audit history records have been removed.');
  };

  const handleDeleteAuditItem = (auditId: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.audit_id !== auditId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    if (currentAudit?.audit_id === auditId) {
      setCurrentAudit(null);
    }
    // Delete from Firestore if authenticated
    deleteAuditFromFirestore(auditId).catch((err) => {
      console.warn('Firestore delete notice:', err);
    });
    toast.info('Record Removed', `Audit record ${auditId} deleted from repository.`);
  };

  const handleResetSeedData = () => {
    const cleanSeeds = SEED_AUDIT_HISTORY.map(sanitizeAudit);
    setHistory(cleanSeeds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanSeeds));
    } catch (e) {
      console.warn(e);
    }
    toast.success('Sample Records Loaded', `Loaded ${cleanSeeds.length} enterprise audit records across global jurisdictions.`);
  };

  const handleSelectAudit = (audit: AuditResponse) => {
    setCurrentAudit(audit);
    setActivePage('initiate_audit');
  };

  const handleUpdateAudit = (updatedAudit: AuditResponse) => {
    setHistory((prev) => {
      const updated = prev.map((a) => (a.audit_id === updatedAudit.audit_id ? updatedAudit : a));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    if (currentAudit && currentAudit.audit_id === updatedAudit.audit_id) {
      setCurrentAudit(updatedAudit);
    }
  };

  // Main Audit Execution Trigger
  const handleRunAudit = async (data: {
    file: File | null;
    rawText: string;
    sourceCountry?: string;
    destinationCountry: string;
    documentType: string;
    focusRegions?: RegionAnnotation[];
    tags?: string[];
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let result: AuditResponse;

      if (data.file) {
        // Send as FormData
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('sourceCountry', data.sourceCountry || 'China');
        formData.append('destinationCountry', data.destinationCountry);
        formData.append('documentType', data.documentType);
        if (data.rawText) {
          formData.append('rawText', data.rawText);
        }
        if (data.focusRegions && data.focusRegions.length > 0) {
          formData.append('focusRegions', JSON.stringify(data.focusRegions));
        }
        if (data.tags && data.tags.length > 0) {
          formData.append('tags', JSON.stringify(data.tags));
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
            sourceCountry: data.sourceCountry || 'China',
            destinationCountry: data.destinationCountry,
            documentType: data.documentType,
            rawText: data.rawText,
            focusRegions: data.focusRegions || [],
            tags: data.tags || [],
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Audit request failed with status ${response.status}`);
        }

        result = await response.json();
      }

      if (data.tags && data.tags.length > 0 && !result.applied_tags) {
        result.applied_tags = data.tags;
      }

      setCurrentAudit(result);
      saveAuditToHistory(result);

      // Evaluate user-defined high-risk threshold setting (e.g., score > 75)
      const highRiskThreshold = settings.highRiskThreshold ?? 75;
      if (result.risk_score > highRiskThreshold) {
        if (settings.enableVisualAlertBanner !== false) {
          setHighRiskAlertAudit(result);
        }
        if (settings.enableDesktopNotifications !== false) {
          triggerHighRiskDesktopNotification(result, highRiskThreshold);
        }
      }

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

  const handleTestHighRiskAlert = (threshold: number) => {
    const candidate: AuditResponse = history.find((a) => a.risk_score > threshold) || {
      audit_id: `AUD-ALERT-${Date.now().toString().slice(-4)}`,
      audit_status: 'REJECTED' as const,
      risk_score: Math.max(88, threshold + 5),
      risk_level: 'CRITICAL' as const,
      destination_country: selectedCountry || 'USA',
      regulatory_framework: 'U.S. Customs and Border Protection (CBP) / ACE',
      timestamp: new Date().toISOString(),
      extracted_entities: {
        document_type: 'Commercial Invoice & Hazardous Goods Declaration',
        document_number: 'ALERT-INV-8921',
        shipper_name: 'Shenzhen HyperPower Energy Tech Co., Ltd.',
        shipper_address: 'Building 4, High-Tech Industrial Park, Shenzhen, China',
        shipper_country: 'China',
        consignee_name: 'VoltWave Logistics & Storage Inc.',
        consignee_address: 'Long Beach, CA, USA',
        consignee_country: 'USA',
        port_of_loading: 'Shenzhen Port',
        port_of_discharge: 'Port of Los Angeles',
        mode_of_transport: 'Ocean Container Freight',
        incoterms: 'CIF Long Beach',
        currency: 'USD',
        total_declared_value: 142500,
        items: [
          {
            item_description: 'Lithium-Ion Polymer Battery Modules (UN3480 Class 9)',
            declared_hs_code: '8507.60.00',
            verified_hs_code: '8507.60.0000',
            quantity: 300,
            unit: 'Units',
            unit_value: 475,
            total_value: 142500,
            country_of_origin: 'China',
            hazardous_class: 'Class 9 Dangerous Goods (UN3480)',
            compliance_flags: ['Missing UN 38.3 Test Report', 'Section 301 Ad Valorem (25%)'],
          },
        ],
      },
      compliance_discrepancies: [
        'CRITICAL BREACH: Missing UN 38.3 Lithium Battery Safety Test Summary documentation required under 49 CFR § 173.185.',
        'Heading 8507 lithium articles of Chinese origin subject to 25% Section 301 tariff duty surcharge not itemized.',
      ],
      discrepancy_details: [],
      recommended_actions: [
        'Halt customs entry processing: Obtain manufacturer UN 38.3 Test Summary immediately.',
      ],
      action_details: [],
      agent_reasoning_trace: [],
    };

    setHighRiskAlertAudit(candidate);
    triggerHighRiskDesktopNotification(candidate, threshold);
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
      {/* Top Header with Navigation Links */}
      <Header
        activePage={activePage}
        onNavigate={setActivePage}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenHSLookup={() => setIsHSLookupOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={history.length}
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
      />

      {/* High-Risk Threshold Visual Alert Banner */}
      {highRiskAlertAudit && (
        <HighRiskAlertBanner
          audit={highRiskAlertAudit}
          threshold={settings.highRiskThreshold ?? 75}
          onDismiss={() => setHighRiskAlertAudit(null)}
          onInspect={(audit) => {
            handleSelectAudit(audit);
            setHighRiskAlertAudit(null);
          }}
        />
      )}

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

        {/* View Switch: Dashboard Page vs Initiate Audit Page */}
        {activePage === 'dashboard' ? (
          <DashboardPage
            history={history}
            onSelectAudit={handleSelectAudit}
            onNavigateToInitiate={() => {
              setCurrentAudit(null);
              setActivePage('initiate_audit');
            }}
            onClearHistory={handleClearHistory}
            onResetSeedData={handleResetSeedData}
            onDeleteAuditItem={handleDeleteAuditItem}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onUpdateAudit={handleUpdateAudit}
          />
        ) : (
          /* Initiate Audit Page */
          <div className="space-y-6">
            {/* Top breadcrumb navigation */}
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={() => setActivePage('dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-emerald-400" />
                <span>Return to Compliance Dashboard</span>
              </button>

              {currentAudit && (
                <button
                  type="button"
                  onClick={() => setCurrentAudit(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-sans font-semibold text-xs transition-colors cursor-pointer"
                >
                  + Audit Another Document
                </button>
              )}
            </div>

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
                      <span>Initiate Autonomous Audit • {user?.company || 'Global Logistics Port'}</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      Initiate Regulatory Compliance Audit
                    </h2>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                      Welcome back, <strong className="text-white">{user?.name}</strong>. Inspect bills of lading, commercial invoices, and hazardous declarations against global customs regulations before consignment dispatch.
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
                        <span className="text-slate-500 block text-[10px]">Continuous Audit Log</span>
                        <strong className="text-emerald-400 text-sm">{history.length} Inspected</strong>
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
                  onBatchAuditCompleted={saveAuditToHistory}
                />
              </div>
            )}
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChange={setSettings}
        onTestHighRiskAlert={handleTestHighRiskAlert}
      />
    </div>
  );
}
