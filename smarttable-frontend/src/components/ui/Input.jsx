export default function Input({ label, error, hint, className = '', id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-200/50 dark:border-red-500/50' : ''}`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
