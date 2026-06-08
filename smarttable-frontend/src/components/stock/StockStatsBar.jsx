import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Package, PackageCheck, TrendingDown } from 'lucide-react';
import { formatQuantity } from '../../lib/stockUtils';

const cards = [
  { key: 'total_ingredients', label: 'Ingrédients', icon: Package, color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400' },
  { key: 'healthy_count', label: 'Stock OK', icon: PackageCheck, color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
  { key: 'low_stock_count', label: 'Alertes', icon: AlertTriangle, color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
  { key: 'movements_today', label: 'Mouvements/jour', icon: TrendingDown, color: 'text-violet-600 bg-violet-500/10 dark:text-violet-400' },
  { key: 'entries_today', label: 'Entrées/jour', icon: ArrowDownToLine, color: 'text-sky-600 bg-sky-500/10 dark:text-sky-400', format: (v) => formatQuantity(v) },
  { key: 'exits_today', label: 'Sorties/jour', icon: ArrowUpFromLine, color: 'text-orange-600 bg-orange-500/10 dark:text-orange-400', format: (v) => formatQuantity(v) },
];

export default function StockStatsBar({ stats }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ key, label, icon: Icon, color, format }) => (
        <div key={key} className="surface-card p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${color}`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tabular-nums text-slate-900 dark:text-white sm:text-xl">
                {format ? format(stats?.[key]) : (stats?.[key] ?? 0)}
              </p>
              <p className="truncate text-[10px] font-medium text-slate-500 dark:text-zinc-400 sm:text-xs">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
