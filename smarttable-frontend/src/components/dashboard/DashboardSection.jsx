export function SectionSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shine h-16 rounded-xl" />
      ))}
    </div>
  );
}

export default function DashboardSection({ title, description, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`surface-card overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
          )}
          <div>
            <h3 className="font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
