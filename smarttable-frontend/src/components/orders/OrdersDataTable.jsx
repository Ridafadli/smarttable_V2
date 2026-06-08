import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Download, Eye, Trash2 } from 'lucide-react';
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

const PAGE_SIZE = 10;

const SORTABLE = {
  date: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  amount: (a, b) => b.total - a.total,
  statut: (a, b) => a.statut.localeCompare(b.statut),
};

function exportCsv(groups) {
  const headers = ['N°', 'Table', 'Client', 'Montant', 'Date', 'Statut', 'Articles'];
  const rows = groups.map((g) => [
    getOrderNumber(g),
    g.table?.numero_table ?? '',
    getClientLabel(g),
    g.total,
    g.created_at,
    getStatutConfig(g.statut).label,
    g.lines.map((l) => l.menu?.nom_plat).filter(Boolean).join('; '),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersDataTable({
  groups,
  onView,
  onDelete,
  onStatusChange,
  onBulkStatusChange,
  updatingKey,
  sortBy = 'date',
  onSortChange,
}) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());

  const sorted = useMemo(() => {
    const fn = SORTABLE[sortBy] || SORTABLE.date;
    return [...groups].sort(fn);
  }, [groups, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageGroups = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSelect = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllPage = () => {
    const keys = pageGroups.map((g) => g.groupKey);
    const allSelected = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const selectedGroups = sorted.filter((g) => selected.has(g.groupKey));

  const SortBtn = ({ field, label }) => (
    <button
      type="button"
      onClick={() => onSortChange?.(field)}
      className={`inline-flex items-center gap-0.5 hover:text-accent ${sortBy === field ? 'text-accent' : ''}`}
    >
      {label}
      {sortBy === field ? <ChevronDown className="h-3 w-3" /> : null}
    </button>
  );

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 bg-slate-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-xs font-medium text-slate-600">{selected.size} sélectionnée(s)</span>
              {['confirmed', 'preparing', 'ready', 'delivered'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onBulkStatusChange?.(selectedGroups, st)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-2xs font-medium hover:border-accent"
                >
                  → {getStatutConfig(st).label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-2xs text-slate-500 hover:underline"
              >
                Désélectionner
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => exportCsv(sorted)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      <div className="hidden border-b border-slate-200/70 bg-slate-50/50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/40 md:grid md:grid-cols-[2rem_1.1fr_0.7fr_1fr_0.8fr_1fr_1.2fr] md:gap-4 lg:px-6">
        <input
          type="checkbox"
          checked={pageGroups.length > 0 && pageGroups.every((g) => selected.has(g.groupKey))}
          onChange={toggleAllPage}
          className="rounded border-slate-300"
          aria-label="Tout sélectionner"
        />
        {[
          <SortBtn key="n" field="date" label="N° commande" />,
          'Table',
          'Client',
          <SortBtn key="a" field="amount" label="Montant" />,
          <SortBtn key="d" field="date" label="Date" />,
          <SortBtn key="s" field="statut" label="Statut / Actions" />,
        ].map((h, i) => (
          <span key={i} className="text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            {h}
          </span>
        ))}
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-zinc-800/80">
        {pageGroups.map((group) => {
          const next = NEXT_STATUT[group.statut];
          const isUpdating = updatingKey === group.groupKey;
          const isSelected = selected.has(group.groupKey);

          return (
            <li
              key={group.groupKey}
              className={`group transition-colors duration-150 hover:bg-slate-50/70 dark:hover:bg-zinc-800/25 ${
                isSelected ? 'bg-accent/5' : ''
              }`}
            >
              <div className="flex flex-col gap-3 p-4 md:grid md:grid-cols-[2rem_1.1fr_0.7fr_1fr_0.8fr_1fr_1.2fr] md:items-center md:gap-4 lg:px-6 lg:py-3.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(group.groupKey)}
                  className="hidden rounded border-slate-300 md:block"
                  aria-label={`Sélectionner ${getOrderNumber(group)}`}
                />
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

      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-xs text-slate-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} sur {sorted.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs disabled:opacity-40"
            >
              <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
            </button>
            <span className="flex items-center text-xs text-slate-600">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs disabled:opacity-40"
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
