import { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Eye,
  ImageIcon,
  MoreVertical,
  Pencil,
  Sun,
  Moon,
  Coffee,
  Clock,
  Trash2,
} from 'lucide-react';
import MenuDishImage from './MenuDishImage';
import {
  categoryColorClass,
  getCategoryLabel,
  getStockStatus,
  MEAL_TYPES,
  stripRuptureTag,
} from '../../lib/menuUtils';
import MenuStockBadge from './MenuStockBadge';

const typeIcons = {
  petit_dejeuner: Coffee,
  dejeuner: Sun,
  diner: Moon,
  tout: Clock,
};

export default function MenuCard({
  menu,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  onToggleDisponible,
  onMarkRupture,
  onRegenerateImage,
  isRegenerating = false,
  isDeleting = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const status = getStockStatus(menu);
  const TypeIcon = typeIcons[menu.type] || Clock;
  const mealLabel = MEAL_TYPES.find((t) => t.value === menu.type)?.label;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden surface-card surface-card-hover p-0 ${status !== 'available' ? 'opacity-90' : ''}`}
    >
      <button type="button" onClick={() => onView(menu)} className="group/img relative aspect-[16/10] w-full overflow-hidden bg-slate-200 text-left">
        <MenuDishImage menu={menu} alt={menu.nom_plat} />
        <div className="absolute left-3 top-3 z-10">
          <MenuStockBadge status={status} />
        </div>
        <div className="absolute right-3 top-3 z-10 rounded-lg bg-white/95 px-2.5 py-1 text-sm font-bold text-primary shadow-sm backdrop-blur">
          {Number(menu.prix).toLocaleString('fr-FR')}{' '}
          <span className="text-xs font-medium text-slate-500">MAD</span>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-slate-900 dark:text-white">{menu.nom_plat}</h3>
            <span
              className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${categoryColorClass(getCategoryLabel(menu))}`}
            >
              {getCategoryLabel(menu)}
            </span>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Actions"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200/80 bg-white py-1 shadow-card-hover animate-slide-up dark:border-zinc-700 dark:bg-zinc-900">
                <ActionItem icon={Eye} label="Voir détails" onClick={() => { onView(menu); setMenuOpen(false); }} />
                <ActionItem icon={Pencil} label="Modifier" onClick={() => { onEdit(menu); setMenuOpen(false); }} />
                <ActionItem icon={Copy} label="Dupliquer" onClick={() => { onDuplicate(menu); setMenuOpen(false); }} />
                <ActionItem
                  icon={ImageIcon}
                  label={isRegenerating ? 'Génération...' : 'Régénérer l\'image'}
                  onClick={() => { onRegenerateImage(menu); setMenuOpen(false); }}
                />
                <hr className="my-1 border-slate-100" />
                <ActionItem
                  icon={Pencil}
                  label={menu.disponible ? 'Marquer indisponible' : 'Marquer disponible'}
                  onClick={() => { onToggleDisponible(menu); setMenuOpen(false); }}
                />
                {status !== 'out_of_stock' && (
                  <ActionItem icon={Pencil} label="Rupture de stock" onClick={() => { onMarkRupture(menu); setMenuOpen(false); }} />
                )}
                <hr className="my-1 border-slate-100" />
                <ActionItem icon={Trash2} label="Supprimer" danger onClick={() => { onDelete(menu); setMenuOpen(false); }} />
              </div>
            )}
          </div>
        </div>

        <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">
          {stripRuptureTag(menu.description) || 'Aucune description pour ce plat.'}
        </p>

        <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <TypeIcon className="h-3.5 w-3.5 text-accent" />
          {mealLabel}
        </div>

        {menu.variantes?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {menu.variantes.slice(0, 3).map((v) => (
              <span key={v} className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                {v}
              </span>
            ))}
            {menu.variantes.length > 3 && (
              <span className="text-[10px] text-slate-400">+{menu.variantes.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto space-y-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onRegenerateImage(menu)}
              disabled={isRegenerating || isDeleting}
              className="inline-flex flex-1 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {isRegenerating ? '...' : 'Image auto'}
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(menu)}
              disabled={isDeleting}
              className="inline-flex flex-1 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Dupliquer
            </button>
            <button
              type="button"
              onClick={() => onEdit(menu)}
              disabled={isDeleting}
              className="inline-flex flex-1 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-accent hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          </div>
          <button
            type="button"
            onClick={() => onDelete(menu)}
            disabled={isDeleting}
            aria-label={`Supprimer ${menu.nom_plat}`}
            className="group/delete inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50/60 py-2.5 text-xs font-semibold text-red-600 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/delete:scale-110" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </article>
  );
}

function ActionItem({ icon: Icon, label, onClick, danger, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'
      } ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}
