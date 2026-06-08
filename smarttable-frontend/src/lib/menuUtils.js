export const CATEGORIES_SUGGESTIONS = [
  'Tacos', 'Couscous', 'Tajine', 'Pizza', 'Burger',
  'Salade', 'Sandwich', 'Dessert', 'Boisson', 'Autre',
];

export const MEAL_TYPES = [
  { value: 'petit_dejeuner', label: 'Petit-déjeuner' },
  { value: 'dejeuner', label: 'Déjeuner' },
  { value: 'diner', label: 'Dîner' },
  { value: 'tout', label: 'Tout le jour' },
];

export const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nom (A → Z)' },
  { value: 'name_desc', label: 'Nom (Z → A)' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'recent', label: 'Plus récent' },
];

export const RUPTURE_TAG = '[RUPTURE]';

export function getCategoryLabel(menu) {
  return menu.categorie?.trim() || 'Sans catégorie';
}

/** available | unavailable | out_of_stock (rupture via tag description) */
export function getStockStatus(menu) {
  if (menu.disponible) return 'available';
  if (menu.description?.includes(RUPTURE_TAG)) return 'out_of_stock';
  return 'unavailable';
}

export function stripRuptureTag(description) {
  if (description == null || description === '') return '';
  return String(description).replace(RUPTURE_TAG, '').trim();
}

export function sortMenus(menus, sortBy) {
  const list = [...menus];
  switch (sortBy) {
    case 'name_asc':
      return list.sort((a, b) => a.nom_plat.localeCompare(b.nom_plat));
    case 'name_desc':
      return list.sort((a, b) => b.nom_plat.localeCompare(a.nom_plat));
    case 'price_asc':
      return list.sort((a, b) => Number(a.prix) - Number(b.prix));
    case 'price_desc':
      return list.sort((a, b) => Number(b.prix) - Number(a.prix));
    case 'recent':
      return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    default:
      return list.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  }
}

export function filterMenus(menus, { search, category, mealType, availability, priceMin, priceMax }) {
  return menus.filter((menu) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${menu.nom_plat} ${menu.description || ''} ${menu.categorie || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (category && category !== 'Tous' && getCategoryLabel(menu) !== category) return false;
    if (mealType && mealType !== 'all' && menu.type !== mealType) return false;

    if (availability && availability !== 'all') {
      const status = getStockStatus(menu);
      if (availability !== status) return false;
    }

    const price = Number(menu.prix);
    if (priceMin !== '' && price < Number(priceMin)) return false;
    if (priceMax !== '' && price > Number(priceMax)) return false;

    return true;
  });
}

export const CATEGORY_COLORS = [
  'bg-blue-50 text-blue-700 ring-blue-600/20',
  'bg-violet-50 text-violet-700 ring-violet-600/20',
  'bg-amber-50 text-amber-800 ring-amber-600/20',
  'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'bg-rose-50 text-rose-700 ring-rose-600/20',
  'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
];

export function categoryColorClass(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}
