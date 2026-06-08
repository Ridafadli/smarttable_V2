import { storageUrl } from '../../lib/config';
import { getDefaultMenuImage } from '../../lib/menuDefaultImages';

/**
 * Image plat : upload API ou image locale par catégorie.
 * Cover + zoom hover + dégradé pour lisibilité des badges.
 */
export default function MenuDishImage({ menu, alt, className = '' }) {
  const src = menu?.image
    ? (menu.image_url || storageUrl(menu.image))
    : getDefaultMenuImage(menu);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-slate-200 ${className}`}>
      <img
        src={src}
        alt={alt || menu?.nom_plat || 'Plat'}
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/menu-defaults/plat-generic.jpg';
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/5"
        aria-hidden
      />
    </div>
  );
}
