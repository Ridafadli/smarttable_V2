import { Calendar, Clock, Edit2, Phone, Trash2, Users } from 'lucide-react';
import {
  formatDate,
  formatTableLabel,
  formatTime,
  getStatutConfig,
} from '../../lib/reservationUtils';

export default function ReservationList({
  reservations,
  onEdit,
  onDelete,
  loading,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface-card animate-pulse p-4">
            <div className="skeleton-shine mb-3 h-4 w-40 rounded-lg" />
            <div className="skeleton-shine h-3 w-64 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!reservations.length) {
    return (
      <div className="surface-card flex flex-col items-center justify-center px-6 py-12 text-center">
        <Calendar className="mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" />
        <p className="font-medium text-slate-700 dark:text-zinc-300">Aucune réservation</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
          Ajustez les filtres ou créez une nouvelle réservation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => {
        const cfg = getStatutConfig(reservation.statut);

        return (
          <article
            key={reservation.id}
            className="surface-card surface-card-hover group p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                    {reservation.client_nom}
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-zinc-400 sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                    {formatDate(reservation.date_reservation)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    {formatTime(reservation.heure_reservation)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    {reservation.client_telephone}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-slate-400" />
                    {reservation.nombre_personnes} pers. — {formatTableLabel(reservation.table)}
                  </span>
                </div>

                {reservation.notes && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-zinc-800/60 dark:text-zinc-400">
                    {reservation.notes}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-2 opacity-100 sm:opacity-70 sm:group-hover:opacity-100">
                <button type="button" onClick={() => onEdit(reservation)} className="btn-icon" aria-label="Modifier">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => onDelete(reservation)} className="btn-icon text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10" aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
