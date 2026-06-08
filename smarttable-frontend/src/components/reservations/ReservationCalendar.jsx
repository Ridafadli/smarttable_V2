import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  MONTH_NAMES,
  WEEKDAY_LABELS,
  getStatutConfig,
  isToday,
} from '../../lib/reservationUtils';

export default function ReservationCalendar({
  year,
  month,
  reservationsByDate = {},
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onAddForDate,
}) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const daysInMonth = last.getDate();
  let startOffset = first.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-zinc-800 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Calendrier</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500">{MONTH_NAMES[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onPrevMonth} className="btn-icon !p-2" aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={onNextMonth} className="btn-icon !p-2" aria-label="Mois suivant">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-zinc-800">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200/60 p-px dark:bg-zinc-800">
        {cells.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="min-h-[4.5rem] bg-slate-50/80 dark:bg-zinc-950/50 sm:min-h-[5.5rem]" />;
          }

          const dayReservations = reservationsByDate[date] || [];
          const active = dayReservations.filter((r) => r.statut !== 'annulee');
          const selected = selectedDate === date;
          const today = isToday(date);

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`group relative min-h-[4.5rem] bg-white p-1.5 text-left transition-colors sm:min-h-[5.5rem] sm:p-2 dark:bg-zinc-900 ${
                selected
                  ? 'ring-2 ring-inset ring-indigo-500/50'
                  : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
                    today
                      ? 'bg-indigo-600 text-white shadow-glow-sm'
                      : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {parseInt(date.slice(8, 10), 10)}
                </span>
                {active.length > 0 && (
                  <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {active.length}
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-0.5">
                {active.slice(0, 2).map((r) => {
                  const cfg = getStatutConfig(r.statut);
                  return (
                    <div key={r.id} className="flex items-center gap-1 truncate text-[10px] text-slate-600 dark:text-zinc-400">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                      <span className="truncate">{r.heure_reservation?.slice(0, 5)} {r.client_nom}</span>
                    </div>
                  );
                })}
                {active.length > 2 && (
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">+{active.length - 2} autre(s)</p>
                )}
              </div>

              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddForDate?.(date);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    onAddForDate?.(date);
                  }
                }}
                className="absolute bottom-1 right-1 hidden rounded-md bg-indigo-500/10 p-0.5 text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-indigo-400 sm:inline-flex"
                aria-label="Ajouter une réservation"
              >
                <Plus className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
