const VARIANTS = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  danger: 'bg-red-50 text-red-700 ring-red-200/80 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  info: 'bg-indigo-50 text-indigo-700 ring-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200/80 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
};

const DOT_COLORS = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-indigo-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
};

export default function Badge({
  children,
  variant = 'default',
  dot = false,
  pulse = false,
  className = '',
}) {
  return (
    <span className={`badge ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[variant] || DOT_COLORS.default} ${pulse ? 'animate-pulse-soft' : ''}`}
        />
      )}
      {children}
    </span>
  );
}
