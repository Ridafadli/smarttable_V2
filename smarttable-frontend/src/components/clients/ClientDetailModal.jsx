import { Calendar, ClipboardList, Edit2, Mail, MapPin, Phone, X } from 'lucide-react';
import {
  formatMoney,
  getInitials,
  ORDER_STATUT_LABELS,
  RESERVATION_STATUT_LABELS,
} from '../../lib/clientUtils';
import Button from '../ui/Button';

function HistorySection({ title, icon: Icon, empty, children }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Icon className="h-4 w-4 text-indigo-500" />
        {title}
      </h3>
      {empty ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-zinc-700 dark:text-zinc-500">
          Aucun historique disponible
        </p>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">{children}</div>
      )}
    </section>
  );
}

export default function ClientDetailModal({ client, loading, onClose, onEdit }) {
  if (!client && !loading) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl glass-strong p-5 shadow-card-hover sm:rounded-2xl sm:p-6 dark:shadow-dark-card">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="skeleton-shine h-8 w-48 rounded-lg" />
            <div className="skeleton-shine h-24 w-full rounded-xl" />
            <div className="skeleton-shine h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-glow-sm">
                  {getInitials(client.nom_complet)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{client.nom_complet}</h2>
                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-zinc-400">
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{client.telephone}</p>
                    {client.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{client.email}</p>}
                    {client.adresse && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{client.adresse}</p>}
                  </div>
                </div>
              </div>
              <button type="button" onClick={onClose} className="btn-icon !p-2" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Visites', value: client.nombre_visites ?? 0 },
                { label: 'Total dépensé', value: formatMoney(client.montant_total), highlight: true },
                { label: 'Commandes', value: client.commandes_count ?? 0 },
                { label: 'Réservations', value: client.reservations_count ?? 0 },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
                  <p className={`text-lg font-bold tabular-nums ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {value}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">{label}</p>
                </div>
              ))}
            </div>

            {client.notes && (
              <div className="mb-6 rounded-xl bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="font-medium">Notes</p>
                <p className="mt-1 opacity-90">{client.notes}</p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <HistorySection
                title="Historique commandes"
                icon={ClipboardList}
                empty={!client.historique_commandes?.length}
              >
                {client.historique_commandes?.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{order.menu || 'Commande'}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">
                        {order.table} · {ORDER_STATUT_LABELS[order.statut] || order.statut}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{formatMoney(order.total)}</p>
                      <p className="text-[10px] text-slate-400">{order.created_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </HistorySection>

              <HistorySection
                title="Historique réservations"
                icon={Calendar}
                empty={!client.historique_reservations?.length}
              >
                {client.historique_reservations?.map((res) => (
                  <div key={res.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {res.date_reservation} · {res.heure_reservation}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">
                        {res.table} · {res.nombre_personnes} pers.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {RESERVATION_STATUT_LABELS[res.statut] || res.statut}
                    </span>
                  </div>
                ))}
              </HistorySection>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
              <Button variant="secondary" onClick={onClose}>Fermer</Button>
              <Button icon={Edit2} onClick={() => onEdit(client)}>Modifier</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
