import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, Plus, Search } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import ClientDetailModal from '../../components/clients/ClientDetailModal';
import ClientForm from '../../components/clients/ClientForm';
import ClientList from '../../components/clients/ClientList';
import ClientStatsBar from '../../components/clients/ClientStatsBar';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  clientToForm,
  EMPTY_FORM,
  FILTER_OPTIONS,
  filterClients,
  SORT_OPTIONS,
} from '../../lib/clientUtils';

export default function Clients() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewClientId, setViewClientId] = useState(null);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['clients', 'stats'],
    queryFn: () => api.get('/clients/stats').then((r) => r.data),
  });

  const filterParams = useMemo(() => {
    const params = { sort, per_page: 100 };
    if (filter === 'has_email') params.has_email = 1;
    if (filter === 'has_orders') params.has_orders = 1;
    if (filter === 'has_reservations') params.has_reservations = 1;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [filter, sort, search]);

  const { data: clientsPage, isLoading, isError, refetch } = useQuery({
    queryKey: ['clients', filterParams],
    queryFn: () => api.get('/clients', { params: filterParams }).then((r) => r.data),
  });

  const clients = clientsPage?.data ?? clientsPage ?? [];

  const filtered = useMemo(
    () => filterClients(clients, { search: '', filter: 'all' }),
    [clients]
  );

  const { data: clientDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['clients', viewClientId],
    queryFn: () => api.get(`/clients/${viewClientId}`).then((r) => r.data),
    enabled: !!viewClientId,
  });

  const openCreate = () => {
    setEditClient(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (client) => {
    setEditClient(client);
    setForm(clientToForm(client));
    setShowForm(true);
    setViewClientId(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditClient(null);
    setForm(EMPTY_FORM);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/clients', data),
    onSuccess: () => {
      invalidateAll();
      toast.success('Client ajouté avec succès');
      closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Impossible d\'ajouter le client');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/clients/${id}`, data),
    onSuccess: (_data, { id }) => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
      toast.success('Client mis à jour');
      closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: (_data, id) => {
      invalidateAll();
      toast.success('Client supprimé');
      setDeleteTarget(null);
      if (viewClientId === id) setViewClientId(null);
      if (editClient?.id === id) closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Impossible de supprimer ce client');
    },
  });

  const handleSubmit = () => {
    const payload = {
      ...form,
      email: form.email?.trim() || null,
      adresse: form.adresse?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    if (editClient) {
      updateMutation.mutate({ id: editClient.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  return (
    <AdminShell title="Clients" onRefresh={handleRefresh}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Clients
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Gérez votre base clients, suivez leurs visites et leur historique.
          </p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Nouveau client
        </Button>
      </div>

      <ClientStatsBar stats={stats} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher par nom, téléphone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <Button variant="secondary" icon={Filter} onClick={() => setShowFilters((v) => !v)}>
          Filtres
        </Button>
      </div>

      {showFilters && (
        <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <label htmlFor="client-filter" className="mb-1.5 block text-xs font-medium text-slate-500">Filtrer</label>
            <select id="client-filter" className="input-field" value={filter} onChange={(e) => setFilter(e.target.value)}>
              {FILTER_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="client-sort" className="mb-1.5 block text-xs font-medium text-slate-500">Trier par</label>
            <select id="client-sort" className="input-field" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          Impossible de charger les clients. Vérifiez la connexion au serveur.
        </div>
      )}

      <ClientList
        clients={filtered}
        loading={isLoading}
        onView={(client) => setViewClientId(client.id)}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <ClientForm
        open={showForm}
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={closeForm}
        loading={createMutation.isPending || updateMutation.isPending}
        editId={editClient?.id}
      />

      <ClientDetailModal
        client={clientDetail}
        loading={!!viewClientId && detailLoading}
        onClose={() => setViewClientId(null)}
        onEdit={(client) => {
          setViewClientId(null);
          openEdit(client);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le client"
        itemName={deleteTarget?.nom_complet}
        message="Cette action est définitive. L'historique restera lié aux commandes et réservations existantes."
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
