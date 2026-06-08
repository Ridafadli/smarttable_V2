import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const styles = {
  success: {
    wrap: 'border-emerald-200/60 bg-white dark:bg-zinc-900 dark:border-emerald-500/25',
    bar: 'bg-emerald-500',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    wrap: 'border-red-200/60 bg-white dark:bg-zinc-900 dark:border-red-500/25',
    bar: 'bg-red-500',
    icon: AlertCircle,
    iconClass: 'text-red-600 dark:text-red-400',
  },
  info: {
    wrap: 'border-indigo-200/60 bg-white dark:bg-zinc-900 dark:border-indigo-500/25',
    bar: 'bg-indigo-500',
    icon: Info,
    iconClass: 'text-indigo-600 dark:text-indigo-400',
  },
  warning: {
    wrap: 'border-amber-200/60 bg-white dark:bg-zinc-900 dark:border-amber-500/25',
    bar: 'bg-amber-500',
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
};

function ToastItem({ toast, onDismiss }) {
  const s = styles[toast.type] || styles.success;
  const Icon = s.icon;

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-card-hover animate-slide-in-right ${s.wrap}`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-zinc-800 ${s.iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="flex-1 pt-1 text-sm font-medium leading-snug text-slate-800 dark:text-zinc-100">{toast.message}</p>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-100 dark:bg-zinc-800">
        <div className={`h-full ${s.bar} animate-toast-progress`} />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      toast,
      success: (m) => toast(m, 'success'),
      error: (m) => toast(m, 'error'),
      info: (m) => toast(m, 'info'),
      warning: (m) => toast(m, 'warning'),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-[380px] flex-col gap-2 px-4 sm:bottom-6 sm:right-6 sm:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
