import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  Sliders,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Bell,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export interface ComplianceSettings {
  highRiskThreshold: number; // e.g. score > 75
  criticalRiskThreshold: number;
  moderateRiskThreshold: number;
  enableDesktopNotifications: boolean;
  enableVisualAlertBanner: boolean;
  defaultDestinationCountry: string;
  autoQuarantineHazardous: boolean;
  enforceSection301Screening: boolean;
  enforceEUDRAssessment: boolean;
  autoGenerateActionPlan: boolean;
  notificationEmail?: string;
}

export const DEFAULT_SETTINGS: ComplianceSettings = {
  highRiskThreshold: 75,
  criticalRiskThreshold: 70,
  moderateRiskThreshold: 30,
  enableDesktopNotifications: true,
  enableVisualAlertBanner: true,
  defaultDestinationCountry: 'USA',
  autoQuarantineHazardous: true,
  enforceSection301Screening: true,
  enforceEUDRAssessment: true,
  autoGenerateActionPlan: true,
  notificationEmail: 'compliance-desk@enterprise-logistics.com',
};

export const SETTINGS_STORAGE_KEY = 'omniscribe_compliance_settings_v1';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (newSettings: ComplianceSettings) => void;
  onTestHighRiskAlert?: (threshold: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
  onTestHighRiskAlert,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [settings, onSettingsChange]);

  if (!isOpen) return null;

  // Test Desktop Notification
  const handleTestNotification = async () => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      toast.info('Browser Notification Notice', 'Native Notification API is not supported in this browser environment; visual alert banners will be used.');
      return;
    }

    try {
      if (Notification.permission === 'granted') {
        new Notification('⚠️ OmniScribe High-Risk Alert (Test)', {
          body: `High-risk threshold set to score > ${settings.highRiskThreshold}. Alerts are active!`,
          icon: '/favicon.ico',
        });
        toast.success('Notification Sent', 'Desktop test notification triggered.');
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('⚠️ OmniScribe High-Risk Alert (Test)', {
            body: `Permission granted! High-risk threshold set to score > ${settings.highRiskThreshold}.`,
          });
          toast.success('Notification Enabled', 'Desktop notifications permitted.');
        } else {
          toast.warning('Permission Denied', 'Desktop notifications were not granted. Visual alert banners will be used instead.');
        }
      } else {
        toast.warning('Permission Denied', 'Desktop notifications are blocked in your browser settings. Visual alert banners will still display.');
      }
    } catch (err: any) {
      console.warn('Notification test notice:', err);
      toast.info('Notification Handled', 'Visual alert banners are enabled for all high-risk scores.');
    }
  };

  // Preview Visual Alert Banner
  const handlePreviewVisualAlert = () => {
    if (onTestHighRiskAlert) {
      onTestHighRiskAlert(settings.highRiskThreshold);
      toast.info('Visual Alert Banner Triggered', `Previewing alert banner for risk score > ${settings.highRiskThreshold}.`);
      onClose();
    } else {
      toast.error('Alert Preview', 'Visual alert preview triggered.');
    }
  };

  // Export Settings to JSON file
  const handleExportConfig = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `OmniScribe_Compliance_Config_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Configuration Saved', 'Compliance threshold settings exported as JSON file.');
    } catch (e: any) {
      toast.error('Export Error', 'Failed to save configuration file.');
    }
  };

  // Import Settings from JSON file
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Invalid JSON configuration object');
        }

        const merged: ComplianceSettings = {
          highRiskThreshold: Number(parsed.highRiskThreshold) || DEFAULT_SETTINGS.highRiskThreshold,
          criticalRiskThreshold: Number(parsed.criticalRiskThreshold) || DEFAULT_SETTINGS.criticalRiskThreshold,
          moderateRiskThreshold: Number(parsed.moderateRiskThreshold) || DEFAULT_SETTINGS.moderateRiskThreshold,
          enableDesktopNotifications: Boolean(parsed.enableDesktopNotifications ?? DEFAULT_SETTINGS.enableDesktopNotifications),
          enableVisualAlertBanner: Boolean(parsed.enableVisualAlertBanner ?? DEFAULT_SETTINGS.enableVisualAlertBanner),
          defaultDestinationCountry: parsed.defaultDestinationCountry || DEFAULT_SETTINGS.defaultDestinationCountry,
          autoQuarantineHazardous: Boolean(parsed.autoQuarantineHazardous ?? DEFAULT_SETTINGS.autoQuarantineHazardous),
          enforceSection301Screening: Boolean(parsed.enforceSection301Screening ?? DEFAULT_SETTINGS.enforceSection301Screening),
          enforceEUDRAssessment: Boolean(parsed.enforceEUDRAssessment ?? DEFAULT_SETTINGS.enforceEUDRAssessment),
          autoGenerateActionPlan: Boolean(parsed.autoGenerateActionPlan ?? DEFAULT_SETTINGS.autoGenerateActionPlan),
          notificationEmail: parsed.notificationEmail || DEFAULT_SETTINGS.notificationEmail,
        };

        setSettings(merged);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        toast.success('Configuration Imported', 'Compliance settings successfully loaded from JSON.');
      } catch (err: any) {
        console.error('Failed to import configuration:', err);
        toast.error('Import Failed', 'Selected file is not a valid OmniScribe configuration JSON.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    toast.info('Defaults Restored', 'Threshold alerts and screening parameters reset to defaults.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Compliance Threshold & Agent Settings
              </h2>
              <p className="text-xs text-slate-400">
                Define high-risk thresholds, automated alert triggers, and regulatory screening rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: User-Defined High-Risk Threshold & Alert Notification (Requested Requirement) */}
          <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-b from-rose-950/20 to-slate-950/80 border-2 border-rose-500/40 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>High-Risk Threshold & Instant Alert Configuration</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                Score &gt; {settings.highRiskThreshold}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Define the cutoff score for high-risk consignments. When any audited document exceeds this value (e.g. score &gt; {settings.highRiskThreshold}), OmniScribe will immediately trigger a desktop-style browser notification and a visual alert banner.
            </p>

            {/* Slider & Direct Number Input */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="high-risk-input" className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>High-Risk Trigger Score Cutoff:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="high-risk-input"
                    type="number"
                    min="40"
                    max="99"
                    value={settings.highRiskThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setSettings({
                          ...settings,
                          highRiskThreshold: Math.min(99, Math.max(40, val)),
                        });
                      }
                    }}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-rose-500/50 text-right font-mono font-bold text-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <span className="text-slate-400 font-mono">/ 100</span>
                </div>
              </div>

              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={settings.highRiskThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    highRiskThreshold: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                <span>50 (Sensitive)</span>
                <span className="text-rose-400 font-bold">Recommended: 75</span>
                <span>95 (Permissive)</span>
              </div>
            </div>

            {/* Alert Channels & Test Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Desktop Notification Channel */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <label className="flex items-start justify-between gap-2 cursor-pointer">
                  <div>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-cyan-400" />
                      Desktop Browser Notification
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Triggers native browser desktop notifications when tab is active or minimized.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableDesktopNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enableDesktopNotifications: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-rose-500 bg-slate-800 border-slate-700 mt-1 cursor-pointer"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  Test Desktop Notification
                </button>
              </div>

              {/* Visual Alert Banner Channel */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <label className="flex items-start justify-between gap-2 cursor-pointer">
                  <div>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Visual Alert Banner
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Displays a glowing top banner across workspace with audit details & action link.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableVisualAlertBanner}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enableVisualAlertBanner: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-rose-500 bg-slate-800 border-slate-700 mt-1 cursor-pointer"
                  />
                </label>

                <button
                  type="button"
                  onClick={handlePreviewVisualAlert}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-[11px] font-mono text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                >
                  Preview Alert Banner
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Secondary Statutory Screening Rules */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Automated Statutory Enforcement
            </span>

            <div className="space-y-3 pt-1">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900">
                <div className="pr-4">
                  <p className="font-semibold text-white">Auto-Quarantine Uncertified HazMat</p>
                  <p className="text-[10px] text-slate-400">
                    Automatically reject shipments missing UN 38.3 lithium battery summaries or IMDG declarations.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoQuarantineHazardous}
                  onChange={(e) =>
                    setSettings({ ...settings, autoQuarantineHazardous: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900">
                <div className="pr-4">
                  <p className="font-semibold text-white">Enforce Section 301 China Tariff Verification</p>
                  <p className="text-[10px] text-slate-400">
                    Flag any Chinese origin heading 8507/8541 without declared 25% ad valorem supplemental duties.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enforceSection301Screening}
                  onChange={(e) =>
                    setSettings({ ...settings, enforceSection301Screening: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900">
                <div className="pr-4">
                  <p className="font-semibold text-white">Mandatory EUDR Deforestation Geolocation Check</p>
                  <p className="text-[10px] text-slate-400">
                    Screen coffee, cocoa, soy, and timber consignments for verified GPS polygon coordinates under EU 2023/1115.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enforceEUDRAssessment}
                  onChange={(e) =>
                    setSettings({ ...settings, enforceEUDRAssessment: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Default Jurisdiction & Notification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Default Jurisdiction</label>
              <select
                value={settings.defaultDestinationCountry}
                onChange={(e) =>
                  setSettings({ ...settings, defaultDestinationCountry: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="USA">🇺🇸 United States (CBP / ACE)</option>
                <option value="EU">🇪🇺 European Union (TARIC / ICS2)</option>
                <option value="Singapore">🇸🇬 Singapore (TradeNet / HSA)</option>
                <option value="UAE">🇦🇪 United Arab Emirates (Mirsal II)</option>
                <option value="UK">🇬🇧 United Kingdom (HMRC CDS)</option>
                <option value="Japan">🇯🇵 Japan (NACCS)</option>
                <option value="Australia">🇦🇺 Australia (ABF / ICS)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Compliance Desk Notification Email</label>
              <input
                type="email"
                value={settings.notificationEmail || ''}
                onChange={(e) =>
                  setSettings({ ...settings, notificationEmail: e.target.value })
                }
                placeholder="compliance@enterprise.com"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer with Save / Import Configuration buttons */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {/* Hidden File Input for Import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportConfig}
              accept=".json,application/json"
              className="hidden"
            />

            {/* Save Configuration (JSON download) */}
            <button
              type="button"
              onClick={handleExportConfig}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md cursor-pointer"
              title="Download your current threshold alert settings as a JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>

            {/* Import Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all cursor-pointer"
              title="Restore threshold alert settings from a JSON file"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import Configuration</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Defaults</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
