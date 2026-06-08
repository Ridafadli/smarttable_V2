export default function OrdersTableSkeleton({ rows = 8 }) {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="hidden border-b border-slate-100 bg-slate-50 px-4 py-3 md:grid md:grid-cols-6 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-slate-200" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 border-b border-slate-50 p-4 last:border-0 md:grid md:grid-cols-6 md:items-center md:gap-4">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-100" />
          <div className="h-4 w-28 rounded bg-slate-100" />
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-100" />
          <div className="h-8 w-full rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
