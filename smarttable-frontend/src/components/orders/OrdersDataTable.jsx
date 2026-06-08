import { ChevronRight, Eye, Trash2 } from 'lucide-react';
import {
  formatDateTime,
  formatMoney,
  getClientLabel,
  getOrderNumber,
  getStatutConfig,
  NEXT_STATUT,
} from '../../lib/orderUtils';
import OrderStatusBadge from './OrderStatusBadge';
import Button from '../ui/Button';

export default function OrdersDataTable({
  groups,
  onView,
  onDelete,
  onStatusChange,
  updatingKey,
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="hidden border-b border-slate-200/70 bg-slate-50/50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/40 md:grid md:grid-cols-[1.1fr_0.7fr_1fr_0.8fr_1fr_1.2fr] md:gap-4 lg:px-6">
        {['N° commande', 'Table', 'Client', 'Montant', 'Date', 'Statut / Actions'].map((h) => (
          <span key={h} className="text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            {h}
          </span>
        ))}
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-zinc-800/80">
        {groups.map((group) => {
          const next = NEXT_STATUT[group.statut];
          const isUpdating = updatingKey === group.groupKey;

          return (
            <li
              key={group.groupKey}
              className="group transition-colors duration-150 hover:bg-slate-50/70 dark:hover:bg-zinc-800/25"
            >
              <div className="flex flex-col gap-3 p-4 md:grid md:grid-cols-[1.1fr_0.7fr_1fr_0.8fr_1fr_1.2fr] md:items-center md:gap-4 lg:px-6 lg:py-3.5">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{getOrderNumber(group)}</p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500">{group.lines.length} article(s)</p>
                </div>
                <div>
                  <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                    #{group.table?.numero_table ?? '—'}
                  </span>
                </div>
                <p className="truncate text-sm text-slate-600 dark:text-zinc-400">{getClientLabel(group)}</p>
                <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{formatMoney(group.total)}</p>
                <p className="text-sm text-slate-500 dark:text-zinc-500">{formatDateTime(group.created_at)}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge statut={group.statut} />
                  <div className="flex flex-wrap gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                    {next && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isUpdating}
                        onClick={() => onStatusChange(group, next)}
                        className="!px-2 !py-1 !text-2xs"
                      >
                        → {getStatutConfig(next).label}
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => onView(group)}
                      className="btn-icon !p-1.5"
                      aria-label="Voir détails"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(group)}
                      className="btn-icon !p-1.5 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onView(group)}
                className="flex w-full items-center justify-center gap-1 border-t border-slate-100 py-2.5 text-xs font-medium text-indigo-600 md:hidden dark:border-zinc-800 dark:text-indigo-400"
              >
                Voir détails
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
