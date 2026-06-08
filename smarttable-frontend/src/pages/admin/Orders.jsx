import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Search, SlidersHorizontal } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import OrderDetailModal from '../../components/orders/OrderDetailModal';
import OrdersDataTable from '../../components/orders/OrdersDataTable';
import OrderStatsBar from '../../components/orders/OrderStatsBar';
import OrdersTableSkeleton from '../../components/orders/OrdersTableSkeleton';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import {
  filterOrderGroups,
  getOrderNumber,
  getStatutConfig,
  groupOrderLines,
  SORT_OPTIONS,
  STATUT_FILTERS,
} from '../../lib/orderUtils';

export default function Orders() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [tableSort, setTableSort] = useState('date');
  const [datePreset, setDatePreset] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);
  const [detailGroup, setDetailGroup] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updatingKey, setUpdatingKey] = useState(null);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => api.get('/orders/stats').then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/tables').then((r) => r.data),
  });

  const {
    data: ordersPage,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['orders', statutFilter, dateFilter, tableFilter, sortBy, search],
    queryFn: () =>
      api
        .get('/orders', {
          params: {
            statut: statutFilter || undefined,
            date: dateFilter || undefined,
            table_id: tableFilter || undefined,
            search: search || undefined,
            sort: sortBy,
            per_page: 100,
          },
        })
        .then((r) => r.data),
    refetchInterval: 10_000,
  });

  const groups = useMemo(() => {
    const lines = ordersPage?.data || [];
    const grouped = groupOrderLines(lines);
    return filterOrderGroups(grouped, { clientSearch: clientFilter });
  }, [ordersPage, clientFilter]);

  const detailGroupLive = useMemo(() => {
    if (!detailGroup) return null;
    return groups.find((g) => g.groupKey === detailGroup.groupKey) || detailGroup;
  }, [detailGroup, groups]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ lineIds, statut }) => {
      await Promise.all(
        lineIds.map((id) => api.patch(`/orders/${id}/status`, { statut }))
      );
    },
    onMutate: ({ groupKey }) => setUpdatingKey(groupKey),
    onSuccess: (_d, { statut }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Statut mis à jour : ${getStatutConfig(statut).label}`);
      setDetailGroup(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Impossible de mettre à jour le statut');
    },
    onSettled: () => setUpdatingKey(null),
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande modifiée');
    },
    onError: () => toast.error('Erreur lors de la modification'),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ lineIds }) => {
      await Promise.all(lineIds.map((id) => api.delete(`/orders/${id}`)));
    },
    onSuccess: (_d, { label }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(label ? `Commande ${label} supprimée` : 'Commande supprimée');
      setDeleteTarget(null);
      setDetailGroup(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Impossible de supprimer la commande');
    },
  });

  const handleStatusChange = (group, statut) => {
    updateStatusMutation.mutate({
      lineIds: group.lineIds,
      statut,
      groupKey: group.groupKey,
    });
  };

  const handleUpdateLine = (id, data) => updateLineMutation.mutateAsync({ id, data });

  const refreshAll = () => {
    refetch();
    refetchStats();
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const applyDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      setDateFilter(now.toISOString().slice(0, 10));
    } else if (preset === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      setDateFilter(d.toISOString().slice(0, 10));
    } else if (preset === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFilter(d.toISOString().slice(0, 10));
    } else {
      setDateFilter('');
    }
  };

  const handleBulkStatusChange = (selectedGroups, statut) => {
    selectedGroups.forEach((group) => handleStatusChange(group, statut));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        if (e.key.toLowerCase() !== 'f') return;
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        refreshAll();
      }
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFilters(true);
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AdminShell onRefresh={refreshAll}>
      <PageHeader
        title="Gestion des commandes"
        description="Suivi en temps réel · actualisation automatique toutes les 10 s"
        badge={isFetching && !isLoading ? (
          <Badge variant="success" dot pulse>Live</Badge>
        ) : null}
      />

      <OrderStatsBar stats={stats} />

      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher commande, plat, notes... (F)"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-slide-up sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Statut</label>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {STATUT_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Période</label>
              <div className="mb-2 flex flex-wrap gap-1">
                {[
                  { v: '', l: 'Tout' },
                  { v: 'today', l: "Aujourd'hui" },
                  { v: 'week', l: 'Semaine' },
                  { v: 'month', l: 'Mois' },
                ].map((p) => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() => applyDatePreset(p.v)}
                    className={`rounded-lg px-2 py-1 text-2xs font-medium ${
                      datePreset === p.v ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.l}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setDatePreset('');
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Table</label>
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Toutes les tables</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table #{t.numero_table}{t.nom ? ` — ${t.nom}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Client / session</label>
              <input
                type="search"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                placeholder="Filtrer client..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setStatutFilter('');
                  setDateFilter('');
                  setTableFilter('');
                  setClientFilter('');
                  setSearch('');
                }}
                className="text-sm font-medium text-accent hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <OrdersTableSkeleton />
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
          Impossible de charger les commandes.
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune commande"
          description="Les commandes de vos clients apparaîtront ici dès qu'elles seront passées via QR code ou chatbot."
        />
      ) : (
        <OrdersDataTable
          groups={groups}
          onView={setDetailGroup}
          onDelete={setDeleteTarget}
          onStatusChange={handleStatusChange}
          onBulkStatusChange={handleBulkStatusChange}
          updatingKey={updatingKey}
          sortBy={tableSort}
          onSortChange={setTableSort}
        />
      )}

      <OrderDetailModal
        group={detailGroupLive}
        onClose={() => setDetailGroup(null)}
        onStatusChange={handleStatusChange}
        onUpdateLine={handleUpdateLine}
        onDelete={setDeleteTarget}
        isSaving={updateLineMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer cette commande ?"
        itemName={deleteTarget ? getOrderNumber(deleteTarget) : ''}
        message="Tous les articles de cette commande seront définitivement supprimés."
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        closeOnBackdrop={false}
        onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget
          && deleteMutation.mutate({
            lineIds: deleteTarget.lineIds,
            label: getOrderNumber(deleteTarget),
          })
        }
      />
    </AdminShell>
  );
}
