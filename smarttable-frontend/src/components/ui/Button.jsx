import Spinner from './Spinner';

const variants = {
  primary:
    'bg-slate-900 text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-100',
  secondary:
    'border border-slate-200/80 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:border-zinc-600',
  danger: 'bg-red-600 text-white shadow-xs hover:bg-red-700 active:scale-[0.98]',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
  success: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98]',
  accent:
    'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow-sm hover:opacity-95 active:scale-[0.98]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
};

export default function Button({
  children,
  variant = 'accent',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-zinc-950
        disabled:pointer-events-none disabled:opacity-50
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {children}
    </button>
  );
}
