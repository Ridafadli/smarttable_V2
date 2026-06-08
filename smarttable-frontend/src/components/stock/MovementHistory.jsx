import { formatDateTime, formatQuantity, getMovementType } from '../../lib/stockUtils';

export default function MovementHistory({ movements, loading }) {
  if (loading) {
    return (
      <div className="surface-card overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse border-b border-slate-100 px-4 py-4 dark:border-zinc-800">
            <div className="skeleton-shine h-4 w-48 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!movements.length) {
    return (
      <div className="surface-card px-6 py-12 text-center text-sm text-slate-500 dark:text-zinc-500">
        Aucun mouvement enregistré
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Ingrédient</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Quantité</th>
              <th className="px-4 py-3">Stock après</th>
              <th className="px-4 py-3">Motif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {movements.map((m) => {
              const cfg = getMovementType(m.type);
              return (
                <tr key={m.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5">
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{formatDateTime(m.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.ingredient_nom}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatQuantity(m.quantite, m.unite)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-zinc-400">{formatQuantity(m.quantite_apres, m.unite)}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-slate-500 dark:text-zinc-500">{m.motif || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
