import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, History, Package, Plus, Search } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import IngredientForm from '../../components/stock/IngredientForm';
import IngredientList from '../../components/stock/IngredientList';
import MovementHistory from '../../components/stock/MovementHistory';
import StockAlertsBanner from '../../components/stock/StockAlertsBanner';
import StockMovementForm from '../../components/stock/StockMovementForm';
import StockStatsBar from '../../components/stock/StockStatsBar';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  EMPTY_FORM,
  filterIngredients,
  ingredientToForm,
  SORT_OPTIONS,
} from '../../lib/stockUtils';

export default function Stock() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [tab, setTab] = useState('ingredients');
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [sort, setSort] = useState('low_first');
  const [showFilters, setShowFilters] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editIngredient, setEditIngredient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [movementTarget, setMovementTarget] = useState(null);
  const [movementType, setMovementType] = useState('entree');

  const ingredientParams = useMemo(() => {
    const p = { sort };
    if (lowOnly) p.low_stock = 1;
    if (search.trim()) p.search = search.trim();
    return p;
  }, [sort, lowOnly, search]);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['stock', 'stats'],
    queryFn: () => api.get('/stock/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['stock', 'alerts'],
    queryFn: () => api.get('/stock/alerts').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: ingredients = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['ingredients', ingredientParams],
    queryFn: () => api.get('/ingredients', { params: ingredientParams }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: movementsPage, isLoading: movementsLoading, refetch: refetchMovements } = useQuery({
    queryKey: ['stock', 'movements'],
    queryFn: () => api.get('/stock/movements', { params: { per_page: 50 } }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const movements = movementsPage?.data ?? movementsPage ?? [];
  const filtered = useMemo(() => filterIngredients(ingredients, { search: '', lowOnly: false }), [ingredients]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    queryClient.invalidateQueries({ queryKey: ['stock'] });
  };

  const openCreate = () => {
    setEditIngredient(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (ingredient) => {
    setEditIngredient(ingredient);
    setForm(ingredientToForm(ingredient));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditIngredient(null);
    setForm(EMPTY_FORM);
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/ingredients', data),
    onSuccess: () => { invalidateAll(); toast.success('Ingrédient ajouté'); closeForm(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/ingredients/${id}`, data),
    onSuccess: () => { invalidateAll(); toast.success('Ingrédient mis à jour'); closeForm(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/ingredients/${id}`),
    onSuccess: () => { invalidateAll(); toast.success('Ingrédient supprimé'); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.error || 'Suppression impossible'),
  });

  const movementMutation = useMutation({
    mutationFn: (data) => api.post('/stock/movements', data),
    onSuccess: () => {
      invalidateAll();
      toast.success('Mouvement enregistré');
      setMovementTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const handleSubmit = () => {
    const payload = {
      ...form,
      quantite_disponible: Number(form.quantite_disponible),
      quantite_minimale: Number(form.quantite_minimale),
    };
    if (editIngredient) {
      updateMutation.mutate({ id: editIngredient.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleMovement = (ingredient, type) => {
    setMovementTarget(ingredient);
    setMovementType(type);
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
    refetchMovements();
  };

  return (
    <AdminShell title="Stock" onRefresh={handleRefresh}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Gestion du stock</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Suivez vos ingrédients, alertes et mouvements en temps réel.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Nouvel ingrédient</Button>
      </div>

      <StockStatsBar stats={stats} />
      <StockAlertsBanner alerts={alerts} />

      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200/80 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setTab('ingredients')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'ingredients'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-500'
          }`}
        >
          <Package className="h-4 w-4" />
          Ingrédients
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'history'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-500'
          }`}
        >
          <History className="h-4 w-4" />
          Historique
        </button>
      </div>

      {tab === 'ingredients' && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="search" placeholder="Rechercher un ingrédient…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
            </div>
            <Button variant="secondary" icon={Filter} onClick={() => setShowFilters((v) => !v)}>Filtres</Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="rounded border-slate-300" />
              Stock faible uniquement
            </label>
          </div>

          {showFilters && (
            <div className="mb-6 max-w-xs rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <label htmlFor="stock-sort" className="mb-1.5 block text-xs font-medium text-slate-500">Trier par</label>
              <select id="stock-sort" className="input-field" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}

          {isError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10">
              Impossible de charger les ingrédients.
            </div>
          )}

          <IngredientList
            ingredients={filtered}
            loading={isLoading}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onMovement={handleMovement}
          />
        </>
      )}

      {tab === 'history' && (
        <MovementHistory movements={movements} loading={movementsLoading} />
      )}

      <IngredientForm open={showForm} form={form} onChange={setForm} onSubmit={handleSubmit} onClose={closeForm} loading={createMutation.isPending || updateMutation.isPending} editId={editIngredient?.id} />

      <StockMovementForm
        open={!!movementTarget}
        ingredient={movementTarget}
        type={movementType}
        loading={movementMutation.isPending}
        onClose={() => setMovementTarget(null)}
        onSubmit={({ quantite, motif }) =>
          movementMutation.mutate({
            ingredient_id: movementTarget.id,
            type: movementType,
            quantite,
            motif,
          })
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'ingrédient"
        itemName={deleteTarget?.nom}
        message="L'historique des mouvements associé sera également supprimé."
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
