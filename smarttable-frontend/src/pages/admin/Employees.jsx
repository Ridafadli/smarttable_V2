import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Filter, Plus, Search } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import EmployeeDetailModal from '../../components/employees/EmployeeDetailModal';
import EmployeeForm from '../../components/employees/EmployeeForm';
import EmployeeList from '../../components/employees/EmployeeList';
import EmployeeStatsBar from '../../components/employees/EmployeeStatsBar';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  ACTION_LABELS,
  employeeToForm,
  EMPTY_FORM,
  FILTER_OPTIONS,
  formatActivityTime,
  SORT_OPTIONS,
} from '../../lib/employeeUtils';

export default function Employees() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewEmployeeId, setViewEmployeeId] = useState(null);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['employees', 'stats'],
    queryFn: () => api.get('/employees/stats').then((r) => r.data),
  });

  const { data: permissionsConfig } = useQuery({
    queryKey: ['employees', 'permissions-config'],
    queryFn: () => api.get('/employees/permissions-config').then((r) => r.data),
    staleTime: Infinity,
  });

  const filterParams = useMemo(() => {
    const params = { sort, per_page: 100 };
    if (['admin', 'manager', 'serveur', 'cuisinier'].includes(filter)) {
      params.role = filter;
    }
    if (filter === 'active') params.is_active = 1;
    if (filter === 'inactive') params.is_active = 0;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [filter, sort, search]);

  const { data: employeesPage, isLoading, isError, refetch } = useQuery({
    queryKey: ['employees', filterParams],
    queryFn: () => api.get('/employees', { params: filterParams }).then((r) => r.data),
  });

  const employees = employeesPage?.data ?? employeesPage ?? [];

  const { data: employeeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['employees', viewEmployeeId],
    queryFn: () => api.get(`/employees/${viewEmployeeId}`).then((r) => r.data),
    enabled: !!viewEmployeeId,
  });

  const { data: activityPage, isLoading: activityLoading } = useQuery({
    queryKey: ['employees', 'activity'],
    queryFn: () => api.get('/employees/activity', { params: { per_page: 20 } }).then((r) => r.data),
    enabled: showActivity,
  });

  const activityLogs = activityPage?.data ?? activityPage ?? [];

  const openCreate = () => {
    setEditEmployee(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (employee) => {
    setEditEmployee(employee);
    setForm(employeeToForm(employee));
    setShowForm(true);
    setViewEmployeeId(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditEmployee(null);
    setForm(EMPTY_FORM);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/employees', data),
    onSuccess: () => {
      invalidateAll();
      toast.success('Employé ajouté avec succès');
      closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Impossible d\'ajouter l\'employé');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/employees/${id}`, data),
    onSuccess: (_data, { id }) => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['employees', id] });
      toast.success('Employé mis à jour');
      closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: (_data, id) => {
      invalidateAll();
      toast.success('Employé supprimé');
      setDeleteTarget(null);
      if (viewEmployeeId === id) setViewEmployeeId(null);
      if (editEmployee?.id === id) closeForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Impossible de supprimer cet employé');
    },
  });

  const handleSubmit = () => {
    const payload = {
      ...form,
      prenom: form.prenom?.trim() || null,
      email: form.email?.trim() || null,
      telephone: form.telephone?.trim() || null,
      date_embauche: form.date_embauche || null,
      notes: form.notes?.trim() || null,
      permissions: form.use_custom_permissions ? form.permissions : [],
      use_custom_permissions: form.use_custom_permissions,
    };

    if (editEmployee) {
      updateMutation.mutate({ id: editEmployee.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  return (
    <AdminShell title="Personnel" onRefresh={handleRefresh}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Gestion du personnel
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Gérez votre équipe, les rôles et les permissions d'accès.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Clock} onClick={() => setShowActivity((v) => !v)}>
            {showActivity ? 'Masquer l\'activité' : 'Activité récente'}
          </Button>
          <Button icon={Plus} onClick={openCreate}>
            Nouvel employé
          </Button>
        </div>
      </div>

      <EmployeeStatsBar stats={stats} />

      {showActivity && (
        <div className="mb-6 surface-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Activité récente de l'équipe</h2>
          {activityLoading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : !activityLogs.length ? (
            <p className="text-sm text-slate-500 dark:text-zinc-500">Aucune activité enregistrée.</p>
          ) : (
            <ul className="space-y-2">
              {activityLogs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className="text-slate-700 dark:text-zinc-300">{log.description}</span>
                  {log.employee && (
                    <span className="text-slate-500 dark:text-zinc-500">
                      — {log.employee.prenom} {log.employee.nom}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{formatActivityTime(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher par nom, email, téléphone…"
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
            <label htmlFor="emp-filter" className="mb-1.5 block text-xs font-medium text-slate-500">Filtrer</label>
            <select id="emp-filter" className="input-field" value={filter} onChange={(e) => setFilter(e.target.value)}>
              {FILTER_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="emp-sort" className="mb-1.5 block text-xs font-medium text-slate-500">Trier par</label>
            <select id="emp-sort" className="input-field" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          Impossible de charger le personnel. Vérifiez la connexion au serveur.
        </div>
      )}

      <EmployeeList
        employees={employees}
        loading={isLoading}
        onView={(employee) => setViewEmployeeId(employee.id)}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <EmployeeForm
        open={showForm}
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={closeForm}
        loading={createMutation.isPending || updateMutation.isPending}
        editId={editEmployee?.id}
        permissionsConfig={permissionsConfig}
      />

      <EmployeeDetailModal
        employee={employeeDetail}
        loading={!!viewEmployeeId && detailLoading}
        onClose={() => setViewEmployeeId(null)}
        onEdit={(employee) => {
          setViewEmployeeId(null);
          openEdit(employee);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'employé"
        itemName={deleteTarget?.nom_complet}
        message="Cette action est définitive. L'historique d'activité sera conservé."
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
