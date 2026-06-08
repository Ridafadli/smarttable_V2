import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

function TrendBadge({ trend }) {
  if (trend == null || Number.isNaN(trend)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500">
        <Minus className="h-3 w-3" />
        —
      </span>
    );
  }

  const up = trend >= 0;
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up
          ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400'
          : 'bg-red-500/10 text-red-700 ring-1 ring-red-500/20 dark:text-red-400'
      }`}
    >
      <Icon className="h-3 w-3" />
      {up ? '+' : ''}
      {trend}%
    </span>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="surface-card animate-pulse p-5 sm:p-6">
      <div className="flex justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="skeleton-shine h-3 w-28 rounded-lg" />
          <div className="skeleton-shine h-9 w-20 rounded-lg" />
          <div className="skeleton-shine h-4 w-16 rounded-lg" />
        </div>
        <div className="skeleton-shine h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  trend,
  highlight = false,
  delay = 0,
}) {
  return (
    <article
      className={`group surface-card surface-card-hover relative overflow-hidden p-5 sm:p-6 ${
        highlight ? 'ring-2 ring-amber-400/30 dark:ring-amber-500/20' : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/5 blur-2xl transition-opacity group-hover:opacity-100 dark:from-indigo-500/20" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{title}</p>
          <p className="mt-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold tabular-nums tracking-tight text-transparent dark:from-white dark:to-zinc-300 sm:text-3xl">
            {value}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TrendBadge trend={trend} />
            {subtitle && <span className="text-xs text-slate-400 dark:text-zinc-500">{subtitle}</span>}
          </div>
        </div>
        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 transition-transform duration-300 group-hover:scale-105 dark:ring-white/10 ${iconClass}`}
          >
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
        )}
      </div>
    </article>
  );
}
