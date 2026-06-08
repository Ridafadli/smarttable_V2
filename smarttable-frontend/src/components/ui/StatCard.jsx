export function StatCard({ label, value, icon: Icon, color = 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400', format }) {
  const display = format ? format(value) : (value ?? 0);

  return (
    <div className="stat-card group">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${color}`}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0">
          <p className="stat-card-value">{display}</p>
          <p className="truncate text-xs font-medium text-slate-500 dark:text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function StatCardGrid({ children, cols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' }) {
  return <div className={`mb-6 grid gap-3 ${cols}`}>{children}</div>;
}
