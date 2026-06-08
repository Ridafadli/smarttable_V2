/**
 * Images par défaut locales (public/menu-defaults/)
 * Correspondance par catégorie et par mots-clés dans le nom du plat.
 */
const DEFAULT_IMAGES = {
  couscous: '/menu-defaults/couscous.jpg',
  tajine: '/menu-defaults/tajine.jpg',
  salade: '/menu-defaults/salade.jpg',
  grillades: '/menu-defaults/grillades.jpg',
  dessert: '/menu-defaults/dessert.jpg',
  boisson: '/menu-defaults/boisson.jpg',
  generic: '/menu-defaults/plat-generic.jpg',
};

/** Ordre = priorité (plus spécifique en premier) */
const RULES = [
  { keys: ['couscous'], image: DEFAULT_IMAGES.couscous },
  { keys: ['tajine', 'tagine'], image: DEFAULT_IMAGES.tajine },
  { keys: ['salade', 'salad'], image: DEFAULT_IMAGES.salade },
  {
    keys: ['brochette', 'grillade', 'grill', 'kebab', 'chawarma', 'shawarma', 'viande'],
    image: DEFAULT_IMAGES.grillades,
  },
  { keys: ['dessert', 'gateau', 'gâteau', 'patisserie', 'pâtisserie', 'glace', 'crepe', 'crêpe', 'msemen', 'chebakia'], image: DEFAULT_IMAGES.dessert },
  { keys: ['boisson', 'jus', 'café', 'cafe', 'the', 'thé', 'soda', 'eau', 'smoothie', 'cocktail'], image: DEFAULT_IMAGES.boisson },
  { keys: ['tacos', 'pizza', 'burger', 'sandwich', 'pasta', 'pâtes', 'pates', 'soupe', 'harira', 'pastilla', 'rfissa'], image: DEFAULT_IMAGES.generic },
];

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Retourne le chemin public d'une image par défaut selon catégorie et nom du plat.
 */
export function getDefaultMenuImage(menu) {
  const haystack = normalize(`${menu?.categorie || ''} ${menu?.nom_plat || ''}`);

  for (const rule of RULES) {
    if (rule.keys.some((key) => haystack.includes(normalize(key)))) {
      return rule.image;
    }
  }

  return DEFAULT_IMAGES.generic;
}

/**
 * URL à afficher : image uploadée ou image par défaut locale.
 */
export function getMenuImageSrc(menu) {
  if (menu?.image) return null; // utiliser storageUrl côté composant
  return getDefaultMenuImage(menu);
}

export { DEFAULT_IMAGES };
