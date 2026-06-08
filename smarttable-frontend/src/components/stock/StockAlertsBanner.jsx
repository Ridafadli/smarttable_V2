import { AlertTriangle } from 'lucide-react';
import { formatQuantity } from '../../lib/stockUtils';

export default function StockAlertsBanner({ alerts }) {
  if (!alerts?.length) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            {alerts.length} alerte{alerts.length > 1 ? 's' : ''} stock faible
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {alerts.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200/80 dark:bg-zinc-900/80 dark:text-amber-300 dark:ring-amber-500/30"
              >
                {a.nom}: {formatQuantity(a.quantite_disponible, a.unite)}
                <span className="text-amber-600/70">/ min {formatQuantity(a.quantite_minimale, a.unite)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
