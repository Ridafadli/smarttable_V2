export function Skeleton({ className = '' }) {
  return <div className={`skeleton-shine rounded-lg ${className}`} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="surface-card animate-pulse p-5 sm:p-6">
      <div className="flex justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
          {Array.from({ length: lines - 2 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full max-w-[200px]" />
          ))}
        </div>
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="border-b border-slate-100 p-4 dark:border-zinc-800">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-zinc-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 w-full max-w-[120px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}
