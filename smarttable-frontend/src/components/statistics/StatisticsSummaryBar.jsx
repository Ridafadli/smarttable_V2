import { Banknote, Calendar, CalendarDays, CalendarRange, TrendingUp } from 'lucide-react';
import { formatMoney } from '../../lib/statisticsUtils';

const cards = [
  { key: 'daily', ordersKey: 'orders_daily', label: 'CA Journalier', icon: Banknote, color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400' },
  { key: 'weekly', ordersKey: 'orders_weekly', label: 'CA Hebdomadaire', icon: CalendarDays, color: 'text-violet-600 bg-violet-500/10 dark:text-violet-400' },
  { key: 'monthly', ordersKey: 'orders_monthly', label: 'CA Mensuel', icon: CalendarRange, color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
  { key: 'yearly', ordersKey: 'orders_yearly', label: 'CA Annuel', icon: Calendar, color: 'text-sky-600 bg-sky-500/10 dark:text-sky-400' },
];

export default function StatisticsSummaryBar({ summary, loading }) {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="surface-card animate-pulse p-4">
            <div className="skeleton-shine h-4 w-24 rounded-lg" />
            <div className="skeleton-shine mt-3 h-8 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ key, ordersKey, label, icon: Icon, color }) => (
        <div key={key} className="surface-card relative overflow-hidden p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/5 blur-xl" />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{label}</p>
              <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {formatMoney(summary?.[key])}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500">
                <TrendingUp className="h-3 w-3" />
                {summary?.[ordersKey] ?? 0} commande{(summary?.[ordersKey] ?? 0) > 1 ? 's' : ''}
              </p>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
