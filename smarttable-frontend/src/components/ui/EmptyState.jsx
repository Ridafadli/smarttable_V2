export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 px-6 py-20 text-center dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950 ${className}`}
    >
      {Icon && (
        <div className="relative mb-6">
          <div className="absolute inset-0 scale-150 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/30" aria-hidden />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-indigo-500/20 dark:from-indigo-500/20 dark:to-violet-500/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card dark:bg-zinc-900 dark:shadow-dark-card">
              <Icon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
