import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Filter, Plus, Search, X } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import ReservationCalendar from '../../components/reservations/ReservationCalendar';
import ReservationForm from '../../components/reservations/ReservationForm';
import ReservationList from '../../components/reservations/ReservationList';
import ReservationStatsBar from '../../components/reservations/ReservationStatsBar';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  EMPTY_FORM,
  filterReservations,
  groupReservationsByDate,
  reservationToForm,
  STATUT_FILTERS,
} from '../../lib/reservationUtils';

export default function Reservations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editReservation, setEditReservation] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formConflict, setFormConflict] = useState(null);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['reservations', 'stats'],
    queryFn: () => api.get('/reservations/stats').then((r) => r.data),
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/tables').then((r) => r.data),
  });

  const {
    data: reservationsPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['reservations', calendarYear, calendarMonth],
    queryFn: () =>
      api
        .get('/reservations', {
          params: { year: calendarYear, month: calendarMonth, per_page: 200 },
        })
        .then((r) => r.data),
    refetchInterval: 30_000,
  });

  const reservations = reservationsPage?.data ?? reservationsPage ?? [];

  const reservationsByDate = useMemo(
    () => groupReservationsByDate(reservations),
    [reservations]
  );

  const filtered = useMemo(
    () =>
      filterReservations(reservations, {
        search,
        statut: statutFilter,
        date: selectedDate,
        tableId: tableFilter,
      }),
    [reservations, search, statutFilter, selectedDate, tableFilter]
  );

  const openCreate = (date = '') => {
    setEditReservation(null);
    setFormConflict(null);
    setForm({
      ...EMPTY_FORM,
      date_reservation: date || selectedDate || '',
      table_restaurant_id: tableFilter !== 'all' ? tableFilter : '',
    });
    setShowForm(true);
  };

  const openEdit = (reservation) => {
    setEditReservation(reservation);
    setFormConflict(null);
    setForm(reservationToForm(reservation));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditReservation(null);
    setForm(EMPTY_FORM);
    setFormConflict(null);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/reservations', data),
    onSuccess: () => {
      invalidateAll();
      toast.success('Réservation créée avec succès');
      closeForm();
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        setFormConflict(err.response.data.conflict);
        toast.error('Conflit de réservation — choisissez un autre créneau ou une autre table');
        return;
      }
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Impossible de créer la réservation');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/reservations/${id}`, data),
    onSuccess: () => {
      invalidateAll();
      toast.success('Réservation mise à jour');
      closeForm();
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        setFormConflict(err.response.data.conflict);
        toast.error('Conflit de réservation détecté');
        return;
      }
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reservations/${id}`),
    onSuccess: (_data, id) => {
      invalidateAll();
      toast.success('Réservation supprimée');
      setDeleteTarget(null);
      if (editReservation?.id === id) closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Impossible de supprimer cette réservation');
    },
  });

  const handleSubmit = () => {
    const payload = {
      ...form,
      table_restaurant_id: Number(form.table_restaurant_id),
      nombre_personnes: Number(form.nombre_personnes),
    };

    if (editReservation) {
      updateMutation.mutate({ id: editReservation.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  const shiftMonth = (delta) => {
    let m = calendarMonth + delta;
    let y = calendarYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
    setSelectedDate('');
  };

  const clearFilters = () => {
    setSearch('');
    setStatutFilter('all');
    setTableFilter('all');
    setSelectedDate('');
  };

  const hasActiveFilters = search || statutFilter !== 'all' || tableFilter !== 'all' || selectedDate;

  return (
    <AdminShell title="Réservations" onRefresh={handleRefresh}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Réservations
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Planifiez, suivez et gérez les réservations de votre restaurant.
          </p>
        </div>
        <Button icon={Plus} onClick={() => openCreate()}>
          Nouvelle réservation
        </Button>
      </div>

      <ReservationStatsBar stats={stats} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher par nom, téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <Button variant="secondary" icon={Filter} onClick={() => setShowFilters((v) => !v)}>
          Filtres
        </Button>
        {selectedDate && (
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            {selectedDate}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-400">
            Réinitialiser
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <label htmlFor="statut-filter" className="mb-1.5 block text-xs font-medium text-slate-500">Statut</label>
            <select id="statut-filter" className="input-field" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
              {STATUT_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="table-filter" className="mb-1.5 block text-xs font-medium text-slate-500">Table</label>
            <select id="table-filter" className="input-field" value={tableFilter} onChange={(e) => setTableFilter(e.target.value)}>
              <option value="all">Toutes les tables</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>Table {t.numero_table}{t.nom ? ` — ${t.nom}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          Impossible de charger les réservations. Vérifiez la connexion au serveur.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <ReservationCalendar
          year={calendarYear}
          month={calendarMonth}
          reservationsByDate={reservationsByDate}
          selectedDate={selectedDate}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          onSelectDate={(date) => setSelectedDate((prev) => (prev === date ? '' : date))}
          onAddForDate={(date) => openCreate(date)}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Liste {selectedDate ? `— ${selectedDate}` : `— ${filtered.length} réservation(s)`}
            </h2>
          </div>
          <ReservationList
            reservations={filtered}
            loading={isLoading}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </div>
      </div>

      <ReservationForm
        open={showForm}
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={closeForm}
        loading={createMutation.isPending || updateMutation.isPending}
        tables={tables}
        editId={editReservation?.id}
        conflict={formConflict}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer la réservation"
        itemName={deleteTarget?.client_nom}
        message="Cette action est définitive. La table associée sera libérée si nécessaire."
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
