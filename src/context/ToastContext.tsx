import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) => addToast('success', title, message, duration),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string, duration?: number) => addToast('error', title, message, duration || 6000),
    [addToast]
  );
  const warning = useCallback(
    (title: string, message?: string, duration?: number) => addToast('warning', title, message, duration),
    [addToast]
  );
  const info = useCallback(
    (title: string, message?: string, duration?: number) => addToast('info', title, message, duration),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Render toast overlay
interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        let borderColor = 'border-slate-700 bg-slate-900';
        let icon = <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />;
        let titleColor = 'text-white';
        let progressColor = 'bg-cyan-500';

        if (toast.type === 'success') {
          borderColor = 'border-emerald-500/40 bg-slate-900/95 text-emerald-300 shadow-emerald-950/40';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
          titleColor = 'text-emerald-400';
          progressColor = 'bg-emerald-500';
        } else if (toast.type === 'error') {
          borderColor = 'border-rose-500/40 bg-slate-900/95 text-rose-300 shadow-rose-950/40';
          icon = <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
          titleColor = 'text-rose-400';
          progressColor = 'bg-rose-500';
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-500/40 bg-slate-900/95 text-amber-300 shadow-amber-950/40';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
          titleColor = 'text-amber-400';
          progressColor = 'bg-amber-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 relative overflow-hidden ${borderColor}`}
            role="alert"
          >
            {icon}
            <div className="flex-1 min-w-0 pr-2">
              <h4 className={`text-xs sm:text-sm font-bold tracking-tight font-mono ${titleColor}`}>
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans line-clamp-3">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => onRemove(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Subtle progress bar at bottom */}
            {toast.duration && toast.duration > 0 && (
              <div
                className={`absolute bottom-0 left-0 h-0.5 ${progressColor} opacity-70 animate-[shrink_linear_forwards]`}
                style={{
                  animationDuration: `${toast.duration}ms`,
                  width: '100%',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
