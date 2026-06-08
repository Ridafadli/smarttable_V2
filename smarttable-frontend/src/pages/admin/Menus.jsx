import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import MenuCard from '../../components/menus/MenuCard';
import MenuCardSkeleton from '../../components/menus/MenuCardSkeleton';
import MenuDetailModal from '../../components/menus/MenuDetailModal';
import MenuForm from '../../components/menus/MenuForm';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { validateMenuImageFile } from '../../lib/imageUpload';
import {
  filterMenus,
  getCategoryLabel,
  RUPTURE_TAG,
  sortMenus,
  SORT_OPTIONS,
  MEAL_TYPES,
} from '../../lib/menuUtils';

const PAGE_SIZE = 9;
const EMPTY_FORM = {
  nom_plat: '',
  prix: '',
  type: 'tout',
  categorie: '',
  variantes: [],
  description: '',
  disponible: true,
  ordre: 0,
};

export default function Menus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editMenu, setEditMenu] = useState(null);
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [newVariante, setNewVariante] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [mealFilter, setMealFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [detailMenu, setDetailMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: menus = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['menus'],
    queryFn: () => api.get('/menus').then((r) => r.data),
  });

  const buildFormData = (data, img, opts = {}) => {
    const fd = new FormData();
    fd.append('nom_plat', data.nom_plat);
    fd.append('prix', data.prix);
    fd.append('type', data.type);
    fd.append('categorie', data.categorie);
    fd.append('variantes', JSON.stringify(data.variantes));
    fd.append('description', data.description);
    fd.append('disponible', data.disponible ? 1 : 0);
    fd.append('ordre', data.ordre);
    if (img) fd.append('image', img);
    if (opts.removeImage) fd.append('remove_image', '1');
    return fd;
  };

  const apiValidationMessage = (err) => {
    const errors = err.response?.data?.errors;
    if (errors?.image?.[0]) return errors.image[0];
    return err.response?.data?.message;
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/menus', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Plat ajouté avec succès');
      closeForm();
    },
    onError: (err) => {
      toast.error(apiValidationMessage(err) || 'Erreur lors de l\'ajout du plat');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`/menus/${id}?_method=PUT`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Plat mis à jour');
      closeForm();
    },
    onError: (err) => {
      toast.error(apiValidationMessage(err) || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }) => api.delete(`/menus/${id}`),
    onSuccess: (_data, { id, nom_plat }) => {
      queryClient.setQueryData(['menus'], (old = []) =>
        old.filter((m) => m.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success(nom_plat ? `« ${nom_plat} » a été supprimé` : 'Plat supprimé avec succès');
      setDeleteTarget(null);
      if (detailMenu?.id === id) setDetailMenu(null);
      if (editMenu?.id === id) closeForm();
    },
    onError: (err) => {
      const msg =
        err.response?.data?.error
        || err.response?.data?.message
        || (err.response?.status === 403
          ? 'Vous n\'êtes pas autorisé à supprimer ce plat'
          : 'Impossible de supprimer ce plat. Réessayez.');
      toast.error(msg);
    },
  });

  const toggleDisponible = useMutation({
    mutationFn: ({ id, disponible, description }) => {
      const fd = new FormData();
      fd.append('disponible', disponible ? 1 : 0);
      if (description !== undefined) fd.append('description', description);
      return api.post(`/menus/${id}?_method=PUT`, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Disponibilité mise à jour');
    },
  });

  const regenerateImageMutation = useMutation({
    mutationFn: (menuId) => api.post(`/menus/${menuId}/regenerate-image`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Image régénérée automatiquement');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Impossible de régénérer l\'image');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (menu) => {
      const fd = buildFormData(
        {
          nom_plat: `${menu.nom_plat} (copie)`,
          prix: menu.prix,
          type: menu.type,
          categorie: menu.categorie || '',
          variantes: menu.variantes || [],
          description: (menu.description || '').replace(RUPTURE_TAG, '').trim(),
          disponible: menu.disponible,
          ordre: menu.ordre || 0,
        },
        null
      );
      return api.post('/menus', fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Plat dupliqué');
    },
    onError: () => toast.error('Erreur lors de la duplication'),
  });

  const categories = useMemo(() => {
    const cats = new Set(menus.map((m) => getCategoryLabel(m)));
    return ['Tous', ...Array.from(cats).sort()];
  }, [menus]);

  const categoryCounts = useMemo(() => {
    const counts = { Tous: menus.length };
    menus.forEach((m) => {
      const c = getCategoryLabel(m);
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [menus]);

  const filtered = useMemo(() => {
    const list = filterMenus(menus, {
      search,
      category: categoryFilter,
      mealType: mealFilter,
      availability: availabilityFilter,
      priceMin,
      priceMax,
    });
    return sortMenus(list, sortBy);
  }, [menus, search, categoryFilter, mealFilter, availabilityFilter, priceMin, priceMax, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const groupedForDisplay = useMemo(() => {
    if (categoryFilter !== 'Tous') {
      return { [categoryFilter]: paginated };
    }
    return paginated.reduce((acc, menu) => {
      const cat = getCategoryLabel(menu);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(menu);
      return acc;
    }, {});
  }, [paginated, categoryFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImage(null);
    setRemoveImage(false);
    setImageError('');
    setNewVariante('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditMenu(null);
    resetForm();
  };

  const handleEdit = (menu) => {
    setEditMenu(menu);
    setImage(null);
    setRemoveImage(false);
    setImageError('');
    setForm({
      nom_plat: menu.nom_plat,
      prix: menu.prix,
      type: menu.type,
      categorie: menu.categorie || '',
      variantes: menu.variantes || [],
      description: (menu.description || '').replace(RUPTURE_TAG, '').trim(),
      disponible: menu.disponible,
      ordre: menu.ordre || 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (image) {
      const { valid, error } = validateMenuImageFile(image);
      if (!valid) {
        setImageError(error);
        return;
      }
    }

    const fd = buildFormData(form, image, { removeImage });
    if (editMenu) {
      updateMutation.mutate({ id: editMenu.id, data: fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  const addVariante = () => {
    if (!newVariante.trim()) return;
    setForm((p) => ({ ...p, variantes: [...p.variantes, newVariante.trim()] }));
    setNewVariante('');
  };

  const removeVariante = (index) => {
    setForm((p) => ({ ...p, variantes: p.variantes.filter((_, i) => i !== index) }));
  };

  const handleToggleDisponible = (menu) => {
    const next = !menu.disponible;
    let description = (menu.description || '').replace(RUPTURE_TAG, '').trim();
    toggleDisponible.mutate({ id: menu.id, disponible: next, description });
  };

  const handleMarkRupture = (menu) => {
    const desc = menu.description?.includes(RUPTURE_TAG)
      ? menu.description
      : `${RUPTURE_TAG} ${(menu.description || '').trim()}`.trim();
    toggleDisponible.mutate({ id: menu.id, disponible: false, description: desc });
    toast.success('Marqué en rupture de stock');
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('Tous');
    setMealFilter('all');
    setAvailabilityFilter('all');
    setPriceMin('');
    setPriceMax('');
    setPage(1);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminShell onRefresh={() => refetch()}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestion des menus</h1>
          <p className="mt-1 text-sm text-slate-500">
            {menus.length} plat{menus.length !== 1 ? 's' : ''} au total
            {filtered.length !== menus.length && ` · ${filtered.length} affiché(s)`}
          </p>
        </div>
        <Button
          icon={showForm ? X : Plus}
          onClick={() => {
            if (showForm) closeForm();
            else {
              resetForm();
              setEditMenu(null);
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Fermer' : 'Ajouter un plat'}
        </Button>
      </div>

      {showForm && (
        <MenuForm
          form={form}
          setForm={setForm}
          editMenu={editMenu}
          image={image}
          setImage={setImage}
          removeImage={removeImage}
          setRemoveImage={setRemoveImage}
          imageError={imageError}
          setImageError={setImageError}
          newVariante={newVariante}
          setNewVariante={setNewVariante}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          addVariante={addVariante}
          removeVariante={removeVariante}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Search & toolbar */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher un plat, une catégorie..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-shadow focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              aria-label="Tri"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowFilters((f) => !f)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
                showFilters ? 'border-accent bg-accent/10 text-accent' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 animate-slide-up">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Type de repas</label>
              <select
                value={mealFilter}
                onChange={(e) => { setMealFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="all">Tous</option>
                {MEAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Disponibilité</label>
              <select
                value={availabilityFilter}
                onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="all">Toutes</option>
                <option value="available">Disponible</option>
                <option value="unavailable">Indisponible</option>
                <option value="out_of_stock">Rupture de stock</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Prix min (MAD)</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Prix max (MAD)</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="500"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-accent hover:underline">
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}

        {/* Category pills */}
        {!isLoading && menus.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategoryFilter(cat); setPage(1); }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-accent'
                }`}
              >
                {cat}
                <span className="ml-1.5 opacity-75">({categoryCounts[cat] ?? 0})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MenuCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
          Impossible de charger les menus. Vérifiez votre connexion.
        </div>
      ) : menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-card">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Votre menu est vide</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Commencez par ajouter vos premiers plats pour les proposer à vos clients via QR code.
          </p>
          <Button className="mt-6" icon={Plus} onClick={() => { resetForm(); setShowForm(true); }}>
            Créer mon premier plat
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="font-semibold text-slate-800">Aucun plat trouvé</h3>
          <p className="mt-1 text-sm text-slate-500">Modifiez vos filtres ou votre recherche.</p>
          <button type="button" onClick={clearFilters} className="mt-4 text-sm font-medium text-accent hover:underline">
            Effacer les filtres
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-10">
            {Object.entries(groupedForDisplay).map(([categorie, plats]) => (
              <section key={categorie}>
                {categoryFilter === 'Tous' && (
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900">{categorie}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {categoryCounts[categorie] ?? plats.length} plat{(categoryCounts[categorie] ?? plats.length) > 1 ? 's' : ''}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {plats.map((menu) => (
                    <MenuCard
                      key={menu.id}
                      menu={menu}
                      onEdit={handleEdit}
                      onDelete={(m) => setDeleteTarget(m)}
                      onDuplicate={(m) => duplicateMutation.mutate(m)}
                      onView={setDetailMenu}
                      onToggleDisponible={handleToggleDisponible}
                      onMarkRupture={handleMarkRupture}
                      onRegenerateImage={(m) => regenerateImageMutation.mutate(m.id)}
                      isRegenerating={regenerateImageMutation.isPending}
                      isDeleting={deleteMutation.isPending && deleteTarget?.id === menu.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-9 min-w-[2.25rem] rounded-lg text-sm font-medium transition-colors ${
                      p === page ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}

      <MenuDetailModal
        menu={detailMenu}
        onClose={() => setDetailMenu(null)}
        onEdit={handleEdit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce plat ?"
        itemName={deleteTarget?.nom_plat}
        message="Cette action est définitive et ne peut pas être annulée. Le plat sera retiré de votre menu et de la base de données."
        confirmLabel="Supprimer définitivement"
        loading={deleteMutation.isPending}
        closeOnBackdrop={false}
        onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget
          && deleteMutation.mutate({ id: deleteTarget.id, nom_plat: deleteTarget.nom_plat })
        }
      />
    </AdminShell>
  );
}
