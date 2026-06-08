export default function TableCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="h-2 bg-slate-200" />
      <div className="space-y-4 p-5">
        <div className="flex justify-between">
          <div className="h-10 w-16 rounded-lg bg-slate-200" />
          <div className="h-6 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-100" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 rounded-lg bg-slate-100" />
          <div className="h-9 rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
