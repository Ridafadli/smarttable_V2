import { ArrowDownToLine, ArrowUpFromLine, Edit2, Trash2 } from 'lucide-react';
import {
  formatQuantity,
  getStockBarColor,
  getStockLevel,
} from '../../lib/stockUtils';

export default function IngredientList({
  ingredients,
  loading,
  onEdit,
  onDelete,
  onMovement,
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="surface-card animate-pulse p-5">
            <div className="skeleton-shine h-4 w-32 rounded-lg" />
            <div className="skeleton-shine mt-4 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!ingredients.length) {
    return (
      <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
        <PackageIcon />
        <p className="font-medium text-slate-700 dark:text-zinc-300">Aucun ingrédient</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">Ajoutez vos premiers ingrédients pour suivre le stock.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ingredients.map((ingredient) => {
        const level = getStockLevel(ingredient);
        const percent = Math.min(100, Math.max(0, ingredient.stock_percent ?? 0));

        return (
          <article key={ingredient.id} className="surface-card surface-card-hover group p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-900 dark:text-white">{ingredient.nom}</h3>
                {ingredient.categorie && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">{ingredient.categorie}</p>
                )}
              </div>
              {ingredient.is_low_stock && (
                <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Faible
                </span>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatQuantity(ingredient.quantite_disponible, ingredient.unite)}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  Min. {formatQuantity(ingredient.quantite_minimale, ingredient.unite)}
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${getStockBarColor(level)}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => onMovement(ingredient, 'entree')}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Entrée
              </button>
              <button
                type="button"
                onClick={() => onMovement(ingredient, 'sortie')}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-orange-200 bg-orange-50 px-2 py-2 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400"
              >
                <ArrowUpFromLine className="h-3.5 w-3.5" />
                Sortie
              </button>
              <button type="button" onClick={() => onEdit(ingredient)} className="btn-icon" aria-label="Modifier">
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(ingredient)}
                className="btn-icon text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PackageIcon() {
  return (
    <svg className="mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
