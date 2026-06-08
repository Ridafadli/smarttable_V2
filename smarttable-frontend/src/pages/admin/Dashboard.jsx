import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  ChefHat,
  ClipboardList,
  Clock,
  LayoutGrid,
  Package,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import DashboardKpiCard, { KpiCardSkeleton } from '../../components/dashboard/DashboardKpiCard';
import DashboardSection, { SectionSkeleton } from '../../components/dashboard/DashboardSection';
import OrderStatusBadge from '../../components/dashboard/OrderStatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import useAuthStore from '../../store/authStore';
import {
  ACTIVE_STATUSES,
  chartDateLabel,
  formatDateTimeFr,
  greetingFr,
  NEXT_STATUS,
  percentChange,
  STATUS_ACTION_LABELS,
} from '../../lib/dashboardUtils';

function fillLast7Days(daily) {
  const rows = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = daily?.find((x) => String(x.date).slice(0, 10) === key);
    rows.push({
      date: key,
      label: chartDateLabel(key),
      total_commandes: found ? Number(found.total_commandes) : 0,
      chiffre: found ? Number(found.chiffre) : 0,
    });
  }
  return rows;
}

function EmptyOrders({ icon: Icon, title, description }) {
  return (
    <EmptyState icon={Icon} title={title} description={description} className="!py-12 !shadow-none" />
  );
}

export default function Dashboard() {
  const { restaurant } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.get('/statistics').then((r) => r.data),
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: dailyRaw, isLoading: dailyLoading } = useQuery({
    queryKey: ['statistics', 'daily'],
    queryFn: () => api.get('/statistics/daily').then((r) => r.data),
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: pendingOrders, isLoading: pendingLoading } = useQuery({
    queryKey: ['orders', 'pending'],
    queryFn: () => api.get('/orders', { params: { statut: 'pending' } }).then((r) => r.data),
    refetchInterval: 15_000,
  });

  const { data: recentOrders, isLoading: recentLoading } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => api.get('/orders').then((r) => r.data),
    refetchInterval: 15_000,
  });

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => api.get('/tables').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, statut }) => api.patch(`/orders/${id}/status`, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });

  const chartData = useMemo(() => fillLast7Days(dailyRaw), [dailyRaw]);

  const ordersTrend = percentChange(dailyRaw, 'total_commandes');
  const revenueTrend = percentChange(dailyRaw, 'chiffre');

  const busyTableIds = useMemo(() => {
    const set = new Set();
    recentOrders?.data?.forEach((o) => {
      if (ACTIVE_STATUSES.includes(o.statut) && o.table_id) set.add(o.table_id);
    });
    return set;
  }, [recentOrders]);

  const tableStats = useMemo(() => {
    const list = tables || [];
    const occupied = list.filter((t) => busyTableIds.has(t.id)).length;
    return {
      total: list.length,
      occupied,
      available: list.length - occupied,
      active: list.filter((t) => t.is_active).length,
    };
  }, [tables, busyTableIds]);

  const popularDishes = stats?.popular_dishes || [];
  const maxPopular = Math.max(...popularDishes.map((d) => Number(d.total) || 0), 1);

  const activityFeed = useMemo(() => {
    return (recentOrders?.data || []).slice(0, 8).map((o) => ({
      id: o.id,
      text: `Table #${o.table?.numero_table} — ${o.menu?.nom_plat}`,
      time: o.created_at,
      status: o.statut,
      total: o.total,
    }));
  }, [recentOrders]);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
  };

  return (
    <AdminShell onRefresh={refreshAll} title="Dashboard">
        <div className="mb-8 hero-banner animate-slide-up">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
            <div className="relative flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-100">Vue exécutive</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {greetingFr()}, {restaurant?.nom || 'Restaurant'}
                </h2>
                <p className="mt-2 max-w-lg text-sm text-indigo-100/90">
                  Performance du jour, commandes en cours et revenus — mis à jour en temps réel.
                </p>
              </div>
            </div>
            <div className="relative flex flex-wrap gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200">Objectif commandes</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{stats?.today_orders ?? 0}</p>
                <p className="text-xs text-indigo-200">aujourd&apos;hui</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200">Revenus</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {Number(stats?.today_revenue ?? 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-indigo-200">MAD</p>
              </div>
              <div className="flex items-center gap-2 self-center rounded-xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/20 backdrop-blur">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <time dateTime={now.toISOString()} className="capitalize">
                  {formatDateTimeFr(now)}
                </time>
              </div>
            </div>
          </div>
        </div>

        {statsError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Les statistiques avancées nécessitent un plan Pro. Certaines données peuvent être limitées.
          </div>
        )}

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : (
            <>
              <DashboardKpiCard
                title="Commandes aujourd'hui"
                value={stats?.today_orders ?? 0}
                icon={Package}
                iconClass="bg-accent/15 text-accent"
                trend={ordersTrend}
                subtitle="vs hier"
              />
              <DashboardKpiCard
                title="En attente"
                value={stats?.pending_orders ?? pendingOrders?.data?.length ?? 0}
                icon={Clock}
                iconClass="bg-amber-50 text-amber-600"
                highlight={(stats?.pending_orders ?? 0) > 0}
                subtitle="à traiter"
              />
              <DashboardKpiCard
                title="Chiffre du jour"
                value={`${Number(stats?.today_revenue ?? 0).toLocaleString('fr-FR')} MAD`}
                icon={Banknote}
                iconClass="bg-emerald-50 text-emerald-600"
                trend={revenueTrend}
                subtitle="vs hier"
              />
              <DashboardKpiCard
                title="Tables actives"
                value={stats?.active_tables ?? tableStats.active}
                icon={LayoutGrid}
                iconClass="bg-primary/10 text-primary"
                subtitle={`${tableStats.occupied} occupée(s)`}
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardSection
            title="Commandes — 7 derniers jours"
            description="Volume quotidien"
            icon={TrendingUp}
          >
            {dailyLoading ? (
              <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                    formatter={(v) => [v, 'Commandes']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_commandes"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#ordersGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </DashboardSection>

          <DashboardSection title="Revenus — 7 derniers jours" description="Chiffre d'affaires (MAD)" icon={Banknote}>
            {dailyLoading ? (
              <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                    formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} MAD`, 'Revenus']}
                  />
                  <Bar dataKey="chiffre" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </DashboardSection>
        </div>

        {/* 3 columns */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Tables */}
          <DashboardSection
            title="Tables"
            description={`${tableStats.occupied} occupées · ${tableStats.available} disponibles`}
            icon={LayoutGrid}
            action={
              <button
                type="button"
                onClick={() => navigate('/tables')}
                className="text-xs font-medium text-accent hover:underline"
              >
                Gérer
              </button>
            }
          >
            {tablesLoading ? (
              <SectionSkeleton rows={3} />
            ) : !tables?.length ? (
              <EmptyOrders
                icon={LayoutGrid}
                title="Aucune table"
                description="Ajoutez des tables pour générer vos QR codes."
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {tables.map((table) => {
                  const busy = busyTableIds.has(table.id);
                  return (
                    <div
                      key={table.id}
                      className={`flex flex-col items-center rounded-xl border p-3 text-center transition-all duration-200 hover:scale-[1.02] ${
                        busy
                          ? 'border-amber-200 bg-amber-50/80'
                          : 'border-slate-200 bg-slate-50 hover:border-accent/30'
                      }`}
                    >
                      <span className="text-lg font-bold text-primary">#{table.numero_table}</span>
                      <span
                        className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${
                          busy ? 'text-amber-700' : 'text-emerald-600'
                        }`}
                      >
                        {busy ? 'Occupée' : 'Libre'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardSection>

          {/* Popular dishes */}
          <DashboardSection title="Plats populaires" description="Aujourd'hui" icon={ChefHat}>
            {statsLoading ? (
              <SectionSkeleton rows={5} />
            ) : popularDishes.length === 0 ? (
              <EmptyOrders
                icon={ChefHat}
                title="Pas encore de données"
                description="Les plats les plus commandés apparaîtront ici."
              />
            ) : (
              <ul className="space-y-4">
                {popularDishes.map((dish, i) => {
                  const pct = Math.round((Number(dish.total) / maxPopular) * 100);
                  return (
                    <li key={dish.nom_plat}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-800 truncate pr-2">
                          <span className="mr-2 text-slate-400">{i + 1}.</span>
                          {dish.nom_plat}
                        </span>
                        <span className="shrink-0 font-semibold text-primary">{dish.total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardSection>

          {/* Activity */}
          <DashboardSection title="Activité récente" description="Dernières actions" icon={ClipboardList}>
            {recentLoading ? (
              <SectionSkeleton rows={5} />
            ) : activityFeed.length === 0 ? (
              <EmptyOrders
                icon={ClipboardList}
                title="Aucune activité"
                description="Les commandes récentes s'afficheront ici."
              />
            ) : (
              <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activityFeed.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-accent">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{item.text}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <OrderStatusBadge status={item.status} />
                        <span className="text-xs text-slate-400">
                          {new Date(item.time).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>
        </div>

        {/* Latest orders */}
        <DashboardSection
          className="mb-8"
          title="Dernières commandes"
          description="Tous statuts confondus"
          icon={ClipboardList}
          action={
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          {recentLoading ? (
            <SectionSkeleton rows={4} />
          ) : !recentOrders?.data?.length ? (
            <EmptyOrders
              icon={Package}
              title="Aucune commande"
              description="Vos commandes apparaîtront dès qu'un client passe commande."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-zinc-800">
              <table className="data-table min-w-[520px]">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Plat</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.data.slice(0, 6).map((order) => (
                    <tr key={order.id}>
                      <td className="font-semibold text-indigo-600 dark:text-indigo-400">
                        #{order.table?.numero_table}
                      </td>
                      <td className="text-slate-700 dark:text-zinc-300">{order.menu?.nom_plat}</td>
                      <td className="font-semibold tabular-nums text-slate-900 dark:text-white">{order.total} MAD</td>
                      <td>
                        <OrderStatusBadge status={order.statut} />
                      </td>
                      <td className="text-slate-500 dark:text-zinc-500">
                        {new Date(order.created_at).toLocaleTimeString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardSection>

        {/* Pending orders */}
        <DashboardSection
          title="Commandes en attente"
          description="Traitement prioritaire · actualisation 15 s"
          icon={Clock}
          action={
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              Gérer <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          {pendingLoading ? (
            <SectionSkeleton rows={3} />
          ) : !pendingOrders?.data?.length ? (
            <EmptyOrders
              icon={Clock}
              title="Aucune commande en attente"
              description="Tout est à jour — bravo ! Les nouvelles commandes apparaîtront ici."
            />
          ) : (
            <div className="grid gap-3">
              {pendingOrders.data.map((order) => {
                const next = NEXT_STATUS[order.statut];
                return (
                  <article
                    key={order.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50/50 p-4 transition-all duration-200 hover:border-accent/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        Table #{order.table?.numero_table} — {order.menu?.nom_plat}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Qté {order.quantite}
                        {order.sauce ? ` · ${order.sauce}` : ''}
                        {order.notes ? ` · ${order.notes}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(order.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={order.statut} />
                      {next && (
                        <button
                          type="button"
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ id: order.id, statut: next })}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-accent disabled:opacity-50"
                        >
                          {STATUS_ACTION_LABELS[next] || 'Suivant'}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: order.id, statut: 'cancelled' })}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </DashboardSection>
    </AdminShell>
  );
}
