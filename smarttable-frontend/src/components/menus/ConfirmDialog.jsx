import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

export default function ConfirmDialog({
  open,
  title,
  message,
  itemName,
  confirmLabel = 'Confirmer',
  onConfirm,
  onCancel,
  loading,
  closeOnBackdrop = false,
}) {
  if (!open) return null;

  const handleBackdrop = () => {
    if (!loading && closeOnBackdrop) onCancel();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0"
        onClick={handleBackdrop}
        aria-label="Fermer"
        tabIndex={closeOnBackdrop ? 0 : -1}
      />
      <div className="modal-panel max-w-md p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:text-red-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        {itemName && (
          <p className="mt-3 rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-center dark:border-red-500/20 dark:bg-red-500/10">
            <span className="text-sm text-slate-600 dark:text-zinc-400">Élément :</span>
            <br />
            <span className="mt-1 inline-block text-base font-bold text-slate-900 dark:text-white">« {itemName} »</span>
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
