import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import RestaurantFloorPlan from '../../components/tables/RestaurantFloorPlan';
import TableDetailModal from '../../components/tables/TableDetailModal';
import TableStatsBar from '../../components/tables/TableStatsBar';
import { useToast } from '../../components/ui/Toast';
import { computeTableStats } from '../../lib/tableUtils';

export default function FloorPlan() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editMode, setEditMode] = useState(false);
  const [fullScreen, setFullScreen] = useState(true);
  const [detailTableId, setDetailTableId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [reservingId, setReservingId] = useState(null);

  const { data: tables = [], refetch } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/tables').then((r) => {
      setLastUpdated(new Date());
      return r.data;
    }),
    refetchInterval: 5_000,
  });

  const stats = useMemo(() => computeTableStats(tables), [tables]);

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

  const statusMutation = useMutation({
    mutationFn: ({ id, statut }) => api.put(`/tables/${id}`, { statut }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables', id] });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour du statut'),
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
    onError: () => {
      setReservingId(null);
      toast.error('Impossible de réserver cette table');
    },
  });

  const handlePositionChange = useCallback(
    (id, x, y) => {
      positionMutation.mutate({ id, pos_x: x, pos_y: y });
    },
    [positionMutation]
  );

  const content = (
    <>
      <RestaurantFloorPlan
        tables={tables}
        onSelectTable={(t) => setDetailTableId(t.id)}
        editMode={editMode}
        onEditModeChange={setEditMode}
        onPositionChange={handlePositionChange}
        fullScreen={fullScreen}
        onToggleFullScreen={() => setFullScreen((v) => !v)}
        lastUpdated={lastUpdated}
      />
      <TableDetailModal
        tableId={detailTableId}
        onClose={() => setDetailTableId(null)}
        onEdit={() => {}}
        onStatusChange={(id, statut) => statusMutation.mutate({ id, statut })}
        onReserve={(id) => reserveMutation.mutate(id)}
        isReserving={reservingId === detailTableId}
      />
    </>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="absolute left-4 top-4 z-[220] flex items-center gap-2">
          <Link
            to="/tables"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-300 backdrop-blur-md ring-1 ring-slate-700 hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux tables
          </Link>
        </div>
        {content}
      </div>
    );
  }

  return (
    <AdminShell title="Plan de salle" onRefresh={() => refetch()}>
      <TableStatsBar stats={stats} />
      {content}
    </AdminShell>
  );
}
