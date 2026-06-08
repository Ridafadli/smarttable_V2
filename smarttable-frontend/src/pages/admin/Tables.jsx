import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  LayoutGrid,
  Map,
  Plus,
  QrCode,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import RestaurantFloorPlan from '../../components/tables/RestaurantFloorPlan';
import TableCard from '../../components/tables/TableCard';
import TableCardSkeleton from '../../components/tables/TableCardSkeleton';
import TableDetailModal from '../../components/tables/TableDetailModal';
import TableForm from '../../components/tables/TableForm';
import TableStatsBar from '../../components/tables/TableStatsBar';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import useAuthStore from '../../store/authStore';
import {
  computeTableStats,
  filterTables,
  downloadQrCode,
  openQrPrintWindow,
  STATUT_FILTERS,
} from '../../lib/tableUtils';

const EMPTY_FORM = {
  numero_table: '',
  nom: '',
  capacite: 4,
  statut: 'disponible',
  is_active: true,
};

export default function Tables() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { restaurant, fetchMe } = useAuthStore();

  const [viewMode, setViewMode] = useState('grid');
  const [editMode, setEditMode] = useState(false);
  const [floorFullScreen, setFloorFullScreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTable, setEditTable] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [detailTableId, setDetailTableId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [generatingQrId, setGeneratingQrId] = useState(null);
  const [reservingId, setReservingId] = useState(null);

  const { data: tables = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/tables').then((r) => {
      setLastUpdated(new Date());
      return r.data;
    }),
    refetchInterval: viewMode === 'floor' ? 5_000 : 30_000,
  });

  const stats = useMemo(() => computeTableStats(tables), [tables]);

  const atTableLimit =
    restaurant?.limits?.can_add_table === false
    || (restaurant?.plan === 'free' && tables.length >= 3);

  useEffect(() => {
    if (restaurant) fetchMe().catch(() => {});
  }, [fetchMe, restaurant?.id]);

  const filtered = useMemo(
    () => filterTables(tables, { search, statut: statutFilter }),
    [tables, search, statutFilter]
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditTable(null);
  };

  const openCreateForm = () => {
    setDetailTableId(null);
    setDeleteTarget(null);
    resetForm();
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const positionMutation = useMutation({
    mutationFn: ({ id, pos_x, pos_y }) => api.put(`/tables/${id}`, { pos_x, pos_y }),
    onMutate: async ({ id, pos_x, pos_y }) => {
      await queryClient.cancelQueries({ queryKey: ['tables'] });
      const previous = queryClient.getQueryData(['tables']);
      queryClient.setQueryData(['tables'], (old = []) =>
        old.map((t) => (t.id === id ? { ...t, pos_x, pos_y } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['tables'], context?.previous);
      toast.error('Impossible de sauvegarder la position');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/tables', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table ajoutée avec succès');
      closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Impossible d\'ajouter la table');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/tables/${id}`, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables', id] });
      toast.success('Table mise à jour');
      closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, statut }) => api.put(`/tables/${id}`, { statut }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables', id] });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour du statut'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }) => api.delete(`/tables/${id}`),
    onSuccess: (_data, { id, label }) => {
      queryClient.setQueryData(['tables'], (old = []) => old.filter((t) => t.id !== id));
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success(label ? `Table ${label} supprimée` : 'Table supprimée');
      setDeleteTarget(null);
      if (detailTableId === id) setDetailTableId(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error
        || err.response?.data?.message
        || 'Impossible de supprimer cette table'
      );
    },
  });

  const reserveMutation = useMutation({
    mutationFn: (id) => {
      setReservingId(id);
      return api.post(`/tables/${id}/reserve`, { hours: 2 });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables', res.data.id] });
      toast.success(`Table #${res.data.numero_table} réservée pour 2 h`);
      setReservingId(null);
    },
    onError: (err) => {
      setReservingId(null);
      toast.error(err.response?.data?.error || 'Impossible de réserver cette table');
    },
  });

  const handlePositionChange = useCallback(
    (id, x, y) => {
      positionMutation.mutate({ id, pos_x: x, pos_y: y });
    },
    [positionMutation]
  );

  const handleGenerateQr = async (tableId, { silent = false } = {}) => {
    setGeneratingQrId(tableId);
    try {
      const { data } = await api.get(`/tables/${tableId}/qrcode`);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables', tableId] });
      if (!silent) {
        toast.success(
          data.has_logo
            ? 'QR code généré avec le logo du restaurant'
            : 'QR code généré (ajoutez un logo dans Paramètres pour l\'afficher au centre)'
        );
      }
    } catch (err) {
      if (!silent) {
        const msg = err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la génération du QR code';
        toast.error(msg);
      }
    } finally {
      setGeneratingQrId(null);
    }
  };

  const handleDownloadQr = async (table) => {
    try {
      await downloadQrCode(table);
    } catch {
      toast.error('Téléchargement impossible');
    }
  };

  const handleGenerateAllQr = async () => {
    if (!tables.length) return;
    for (const table of tables) {
      await handleGenerateQr(table.id, { silent: true });
    }
    toast.success(`QR codes générés pour ${tables.length} table(s)`);
  };

  const handleEdit = (table) => {
    setDetailTableId(null);
    setDeleteTarget(null);
    setEditTable(table);
    setForm({
      numero_table: table.numero_table,
      nom: table.nom || '',
      capacite: table.capacite ?? 4,
      statut: table.statut || 'disponible',
      is_active: table.is_active !== false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      numero_table: Number(form.numero_table),
      nom: form.nom || null,
      capacite: form.capacite,
      is_active: form.is_active,
    };

    if (editTable) {
      updateMutation.mutate({
        id: editTable.id,
        data: { ...payload, statut: form.statut },
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const floorPlanBlock = (
    <RestaurantFloorPlan
      tables={filtered}
      onSelectTable={(t) => {
        setShowForm(false);
        setDetailTableId(t.id);
      }}
      editMode={editMode}
      onEditModeChange={setEditMode}
      onPositionChange={handlePositionChange}
      fullScreen={floorFullScreen}
      onToggleFullScreen={() => setFloorFullScreen((v) => !v)}
      lastUpdated={lastUpdated}
    />
  );

  if (floorFullScreen && viewMode === 'floor') {
    return (
      <div className="min-h-screen bg-slate-950">
        {floorPlanBlock}
        {!showForm && (
          <TableDetailModal
            tableId={detailTableId}
            onClose={() => setDetailTableId(null)}
            onEdit={handleEdit}
            onStatusChange={(id, statut) => statusMutation.mutate({ id, statut })}
            onReserve={(id) => reserveMutation.mutate(id)}
            onGenerateQr={handleGenerateQr}
            onDownloadQr={handleDownloadQr}
            isGeneratingQr={generatingQrId === detailTableId}
            isReserving={reservingId === detailTableId}
          />
        )}
      </div>
    );
  }

  return (
    <AdminShell onRefresh={() => refetch()}>
      <PageHeader
        title="Gestion des tables"
        description={`${tables.length} table${tables.length !== 1 ? 's' : ''} · Plan interactif & QR codes`}
        actions={
          <>
            <div className="segment-control">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`segment-item ${viewMode === 'grid' ? 'segment-item-active' : ''}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cartes
              </button>
              <button
                type="button"
                onClick={() => setViewMode('floor')}
                className={`segment-item ${viewMode === 'floor' ? 'segment-item-active' : ''}`}
              >
                <Map className="h-3.5 w-3.5" />
                Plan salle
              </button>
            </div>
            {viewMode === 'floor' && (
              <Link
                to="/floor-plan"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs transition-all hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Plein écran
              </Link>
            )}
            {tables.length > 0 && (
              <Button
                variant="secondary"
                icon={QrCode}
                onClick={handleGenerateAllQr}
                disabled={!!generatingQrId}
              >
                Générer tous les QR
              </Button>
            )}
            <Button
              icon={showForm ? X : Plus}
              onClick={() => {
                if (showForm) closeForm();
                else openCreateForm();
              }}
            >
              {showForm ? 'Fermer' : 'Ajouter une table'}
            </Button>
          </>
        }
      />

      <TableStatsBar stats={stats} />

      {showForm && (
        <TableForm
          form={form}
          setForm={setForm}
          editTable={editTable}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
          atTableLimit={atTableLimit}
        />
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numéro ou nom..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="input-field sm:max-w-[200px]"
          aria-label="Filtrer par statut"
        >
          {STATUT_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TableCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          Impossible de charger les tables. Vérifiez votre connexion.
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-card dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aucune table configurée</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-zinc-400">
            Créez vos premières tables pour générer des QR codes et permettre les commandes à table.
          </p>
          <Button className="mt-6" icon={Plus} onClick={openCreateForm}>
            Créer ma première table
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Aucune table trouvée</h3>
          <p className="mt-1 text-sm text-slate-500">Modifiez la recherche ou le filtre de statut.</p>
        </div>
      ) : viewMode === 'floor' ? (
        floorPlanBlock
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onView={(t) => {
                setShowForm(false);
                setDetailTableId(t.id);
              }}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onReserve={(t) => reserveMutation.mutate(t.id)}
              onGenerateQr={handleGenerateQr}
              onPrintQr={openQrPrintWindow}
              onDownloadQr={handleDownloadQr}
              isGeneratingQr={generatingQrId === table.id}
              isDeleting={deleteMutation.isPending && deleteTarget?.id === table.id}
              isReserving={reservingId === table.id}
            />
          ))}
        </div>
      )}

      {!showForm && (
        <TableDetailModal
          tableId={detailTableId}
          onClose={() => setDetailTableId(null)}
          onEdit={handleEdit}
          onStatusChange={(id, statut) => statusMutation.mutate({ id, statut })}
          onReserve={(id) => reserveMutation.mutate(id)}
          onGenerateQr={handleGenerateQr}
          onDownloadQr={handleDownloadQr}
          isGeneratingQr={generatingQrId === detailTableId}
          isReserving={reservingId === detailTableId}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer cette table ?"
        itemName={deleteTarget ? `Table #${deleteTarget.numero_table}${deleteTarget.nom ? ` — ${deleteTarget.nom}` : ''}` : ''}
        message="Le QR code associé sera également supprimé. Cette action est définitive."
        confirmLabel="Supprimer définitivement"
        loading={deleteMutation.isPending}
        closeOnBackdrop={false}
        onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget
          && deleteMutation.mutate({
            id: deleteTarget.id,
            label: `#${deleteTarget.numero_table}`,
          })
        }
      />
    </AdminShell>
  );
}
