import { Edit2, Eye, Mail, MapPin, Phone, Trash2, Users } from 'lucide-react';
import { formatMoney, getInitials } from '../../lib/clientUtils';

export default function ClientList({ clients, loading, onView, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="surface-card animate-pulse p-5">
            <div className="flex gap-3">
              <div className="skeleton-shine h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-shine h-4 w-32 rounded-lg" />
                <div className="skeleton-shine h-3 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!clients.length) {
    return (
      <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
        <Users className="mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" />
        <p className="font-medium text-slate-700 dark:text-zinc-300">Aucun client trouvé</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
          Ajustez les filtres ou ajoutez un nouveau client.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {clients.map((client) => (
        <article
          key={client.id}
          className="surface-card surface-card-hover group relative overflow-hidden p-5"
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/5 blur-2xl" />

          <div className="relative flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-glow-sm">
              {getInitials(client.nom_complet)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                {client.nom_complet}
              </h3>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {client.telephone}
              </p>
            </div>
          </div>

          <div className="relative mt-4 space-y-1.5 text-sm text-slate-600 dark:text-zinc-400">
            {client.email && (
              <p className="inline-flex items-center gap-2 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {client.email}
              </p>
            )}
            {client.adresse && (
              <p className="inline-flex items-center gap-2 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {client.adresse}
              </p>
            )}
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-2 dark:bg-zinc-800/50">
            <div className="text-center">
              <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{client.nombre_visites ?? 0}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500">Visites</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{formatMoney(client.montant_total)}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500">Dépensé</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{client.reservations_count ?? 0}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500">Réserv.</p>
            </div>
          </div>

          <div className="relative mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onView(client)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
            >
              <Eye className="h-3.5 w-3.5" />
              Détails
            </button>
            <button type="button" onClick={() => onEdit(client)} className="btn-icon" aria-label="Modifier">
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(client)}
              className="btn-icon text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
