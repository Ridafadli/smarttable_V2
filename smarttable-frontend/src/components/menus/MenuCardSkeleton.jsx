export default function MenuCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="aspect-[16/10] bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="flex justify-between">
          <div className="h-6 w-20 rounded bg-slate-200" />
          <div className="h-8 w-8 rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
