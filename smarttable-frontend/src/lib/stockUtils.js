export const UNITE_OPTIONS = [
  { value: 'kg', label: 'Kilogrammes (kg)' },
  { value: 'g', label: 'Grammes (g)' },
  { value: 'L', label: 'Litres (L)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'pcs', label: 'Pièces (pcs)' },
];

export const MOVEMENT_TYPES = {
  entree: { label: 'Entrée', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  sortie: { label: 'Sortie', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  commande: { label: 'Commande', className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
  annulation: { label: 'Annulation', className: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
  ajustement: { label: 'Ajustement', className: 'bg-slate-500/10 text-slate-700 dark:text-zinc-400' },
};

export const SORT_OPTIONS = [
  { value: 'name', label: 'Nom (A-Z)' },
  { value: 'low_first', label: 'Stock faible d\'abord' },
  { value: 'quantity_asc', label: 'Quantité croissante' },
  { value: 'quantity_desc', label: 'Quantité décroissante' },
];

export const EMPTY_FORM = {
  nom: '',
  unite: 'kg',
  quantite_disponible: 0,
  quantite_minimale: 5,
  categorie: '',
  notes: '',
};

export function ingredientToForm(ingredient) {
  if (!ingredient) return { ...EMPTY_FORM };
  return {
    nom: ingredient.nom || '',
    unite: ingredient.unite || 'kg',
    quantite_disponible: ingredient.quantite_disponible ?? 0,
    quantite_minimale: ingredient.quantite_minimale ?? 0,
    categorie: ingredient.categorie || '',
    notes: ingredient.notes || '',
  };
}

export function formatQuantity(qty, unite = '') {
  const n = Number(qty);
  const formatted = Number.isInteger(n) ? n : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return unite ? `${formatted} ${unite}` : String(formatted);
}

export function getStockLevel(ingredient) {
  if (!ingredient) return 'ok';
  if (ingredient.quantite_disponible <= 0) return 'critical';
  if (ingredient.is_low_stock || ingredient.quantite_disponible <= ingredient.quantite_minimale) return 'low';
  return 'ok';
}

export function getStockBarColor(level) {
  if (level === 'critical') return 'bg-red-500';
  if (level === 'low') return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function getMovementType(type) {
  return MOVEMENT_TYPES[type] ?? MOVEMENT_TYPES.ajustement;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function filterIngredients(ingredients, { search, lowOnly }) {
  let list = [...(ingredients || [])];
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (i) => i.nom?.toLowerCase().includes(q) || i.categorie?.toLowerCase().includes(q)
    );
  }
  if (lowOnly) {
    list = list.filter((i) => i.is_low_stock);
  }
  return list;
}
