import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Download, Upload, Sliders, Shield, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export interface ComplianceSettings {
  criticalRiskThreshold: number;
  moderateRiskThreshold: number;
  defaultDestinationCountry: string;
  autoQuarantineHazardous: boolean;
  enforceSection301Screening: boolean;
  enforceEUDRAssessment: boolean;
  autoGenerateActionPlan: boolean;
  notificationEmail?: string;
}

export const DEFAULT_SETTINGS: ComplianceSettings = {
  criticalRiskThreshold: 70,
  moderateRiskThreshold: 30,
  defaultDestinationCountry: 'USA',
  autoQuarantineHazardous: true,
  enforceSection301Screening: true,
  enforceEUDRAssessment: true,
  autoGenerateActionPlan: true,
  notificationEmail: 'compliance-desk@enterprise-logistics.com',
};

const SETTINGS_STORAGE_KEY = 'omniscribe_compliance_settings_v1';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (newSettings: ComplianceSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
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

        // Basic validation
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Invalid JSON configuration object');
        }

        const merged: ComplianceSettings = {
          criticalRiskThreshold: Number(parsed.criticalRiskThreshold) || DEFAULT_SETTINGS.criticalRiskThreshold,
          moderateRiskThreshold: Number(parsed.moderateRiskThreshold) || DEFAULT_SETTINGS.moderateRiskThreshold,
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
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
                Configure regulatory cutoff triggers, screening rules, and export configuration profiles
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

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Risk Score Cutoff Thresholds */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Risk Cutoff Thresholds (0 - 100)
              </span>
              <span className="text-[11px] font-mono text-slate-400">Agent Status Trigger</span>
            </div>

            {/* Critical Threshold Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Critical Risk Cutoff (Trigger REJECTED / Quarantine):</span>
                <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                  {settings.criticalRiskThreshold} / 100
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                value={settings.criticalRiskThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, criticalRiskThreshold: parseInt(e.target.value, 10) })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Any audited manifest with a risk score at or above this threshold will immediately mandate customs hold.
              </p>
            </div>

            {/* Moderate Threshold Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Moderate Risk Cutoff (Trigger FLAGGED Review):</span>
                <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {settings.moderateRiskThreshold} / 100
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="49"
                value={settings.moderateRiskThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, moderateRiskThreshold: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Audits scoring between this threshold and Critical are flagged for broker review and missing documentation.
              </p>
            </div>
          </div>

          {/* Section 2: Statutory Screening Rules */}
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
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Defaults</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
