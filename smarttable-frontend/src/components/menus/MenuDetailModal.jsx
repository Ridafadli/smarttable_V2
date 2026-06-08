import { X } from 'lucide-react';
import { MEAL_TYPES, categoryColorClass, getCategoryLabel, getStockStatus, stripRuptureTag } from '../../lib/menuUtils';
import MenuDishImage from './MenuDishImage';
import MenuStockBadge from './MenuStockBadge';

export default function MenuDetailModal({ menu, onClose, onEdit }) {
  if (!menu) return null;

  const mealLabel = MEAL_TYPES.find((t) => t.value === menu.type)?.label || menu.type;
  const status = getStockStatus(menu);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl animate-slide-up">
        <div className="group relative aspect-video overflow-hidden bg-slate-200">
          <MenuDishImage menu={menu} alt={menu.nom_plat} />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{menu.nom_plat}</h2>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${categoryColorClass(getCategoryLabel(menu))}`}>
                {getCategoryLabel(menu)}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">{Number(menu.prix).toLocaleString('fr-FR')} MAD</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <MenuStockBadge status={status} />
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">{mealLabel}</span>
          </div>
          {menu.description && (
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{stripRuptureTag(menu.description)}</p>
          )}
          {menu.variantes?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Variantes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {menu.variantes.map((v) => (
                  <span key={v} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => { onEdit(menu); onClose(); }}
            className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-accent transition-colors"
          >
            Modifier ce plat
          </button>
        </div>
      </div>
    </div>
  );
}
