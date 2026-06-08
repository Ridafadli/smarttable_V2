import { useEffect, useMemo, useRef } from 'react';
import { ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react';
import { storageUrl } from '../../lib/config';
import {
  formatFileSize,
  MENU_IMAGE_ACCEPT,
  MENU_IMAGE_MAX_BYTES,
  validateMenuImageFile,
} from '../../lib/imageUpload';
import { CATEGORIES_SUGGESTIONS, MEAL_TYPES } from '../../lib/menuUtils';
import Button from '../ui/Button';

export default function MenuForm({
  form,
  setForm,
  editMenu,
  image,
  setImage,
  removeImage,
  setRemoveImage,
  imageError,
  setImageError,
  newVariante,
  setNewVariante,
  onSubmit,
  onCancel,
  addVariante,
  removeVariante,
  isSubmitting,
}) {
  const inputRef = useRef(null);
  const previewUrl = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const hasExistingImage = Boolean(editMenu?.image) && !removeImage;
  const displaySrc = previewUrl || (hasExistingImage ? storageUrl(editMenu.image) : null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { valid, error } = validateMenuImageFile(file);
    if (!valid) {
      setImageError(error);
      setImage(null);
      e.target.value = '';
      return;
    }

    setImageError('');
    setImage(file);
    setRemoveImage(false);
  };

  const clearNewImage = (e) => {
    e?.stopPropagation();
    setImage(null);
    setImageError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeCurrentImage = (e) => {
    e?.stopPropagation();
    setImage(null);
    setRemoveImage(true);
    setImageError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const openFilePicker = () => inputRef.current?.click();

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card animate-slide-up">
      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-white">
          {editMenu ? 'Modifier le plat' : 'Nouveau plat'}
        </h3>
      </div>

      <form onSubmit={onSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nom du plat <span className="text-red-500">*</span>
            </label>
            <input
              value={form.nom_plat}
              onChange={(e) => setForm((p) => ({ ...p, nom_plat: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Ex: Couscous Royal"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Prix (MAD) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={form.prix}
                onChange={(e) => setForm((p) => ({ ...p, prix: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-14 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">MAD</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Catégorie</label>
            <input
              value={form.categorie}
              onChange={(e) => setForm((p) => ({ ...p, categorie: e.target.value }))}
              list="categories-list"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <datalist id="categories-list">
              {CATEGORIES_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CATEGORIES_SUGGESTIONS.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, categorie: cat }))}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    form.categorie === cat ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Période de service</label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: value }))}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    form.type === value
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 text-slate-600 hover:border-accent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Variantes / options</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {form.variantes.map((v, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
                >
                  {v}
                  <button type="button" onClick={() => removeVariante(i)} className="hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newVariante}
                onChange={(e) => setNewVariante(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariante())}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Ajouter une variante..."
              />
              <Button type="button" variant="accent" onClick={addVariante} icon={Plus}>
                Ajouter
              </Button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Description courte du plat..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Photo du plat
              <span className="ml-1 font-normal text-slate-400">
                (JPG, JPEG, PNG, WEBP — max {formatFileSize(MENU_IMAGE_MAX_BYTES)})
              </span>
            </label>

            <div
              className={`overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
                imageError ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-slate-50/50 hover:border-accent'
              }`}
            >
              {displaySrc ? (
                <div className="relative">
                  <div className="aspect-[16/9] w-full bg-slate-200">
                    <img
                      src={displaySrc}
                      alt="Aperçu du plat"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                    <div className="min-w-0 text-white">
                      {image ? (
                        <>
                          <p className="truncate text-sm font-medium">{image.name}</p>
                          <p className="text-xs text-white/80">{formatFileSize(image.size)}</p>
                        </>
                      ) : (
                        <p className="text-sm font-medium">Image actuelle</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-white"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={image ? clearNewImage : removeCurrentImage}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="flex w-full flex-col items-center gap-3 px-6 py-10 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                    <ImagePlus className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Cliquez pour choisir une photo
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ordinateur ou téléphone — glissez-déposez aussi supporté
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">
                    <Upload className="h-3.5 w-3.5" />
                    Parcourir les fichiers
                  </span>
                </button>
              )}
            </div>

            {imageError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {imageError}
              </p>
            )}

            {!displaySrc && !editMenu && (
              <p className="mt-2 text-xs text-slate-500">
                Sans photo, une image par défaut s&apos;affichera sur la carte du plat.
              </p>
            )}

            <input
              ref={inputRef}
              id="menu-image-input"
              type="file"
              accept={MENU_IMAGE_ACCEPT}
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, disponible: !p.disponible }))}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.disponible ? 'bg-success' : 'bg-slate-300'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.disponible ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-700">Disponible à la commande</p>
              <p className="text-xs text-slate-500">{form.disponible ? 'Visible dans le menu client' : 'Masqué du menu'}</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ordre d&apos;affichage</label>
            <input
              type="number"
              value={form.ordre}
              onChange={(e) => setForm((p) => ({ ...p, ordre: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <Button type="submit" loading={isSubmitting}>
            {editMenu ? 'Enregistrer' : 'Ajouter le plat'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
