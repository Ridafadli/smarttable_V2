import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  QrCode,
  RefreshCw,
  SprayCan,
  Users,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import {
  formatOccupationDuration,
  getEffectiveStatut,
  getStatutConfig,
  downloadQrCode,
  openQrPrintWindow,
  qrImageUrl,
} from '../../lib/tableUtils';
import Button from '../ui/Button';
import LoadingState from '../ui/LoadingState';

const ORDER_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
};

export default function TableDetailModal({
  tableId,
  onClose,
  onEdit,
  onStatusChange,
  onReserve,
  onGenerateQr,
  onDownloadQr,
  isReserving,
  isGeneratingQr = false,
}) {
  const { data: table, isLoading } = useQuery({
    queryKey: ['tables', tableId],
    queryFn: () => api.get(`/tables/${tableId}`).then((r) => r.data),
    enabled: !!tableId,
  });

  if (!tableId) return null;

  const config = table ? getStatutConfig(table) : null;
  const statut = table ? getEffectiveStatut(table) : null;
  const occupation = statut === 'occupee' ? formatOccupationDuration(table.occupied_since) : null;
  const qrSrc = table ? qrImageUrl(table) : null;

  return (
    <div className="fixed inset-0 z-[210] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl animate-slide-up">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-700/60 bg-slate-900/95 px-6 py-4 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-white">
            {table ? `Table #${table.numero_table}` : 'Détails table'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Chargement…" />
          </div>
        ) : table ? (
          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${config.badge}`}>
                <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                {config.label}
              </span>
              {!table.is_active && (
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">Inactive</span>
              )}
            </div>

            {table.nom && <p className="text-slate-300">{table.nom}</p>}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-800/80 p-3 ring-1 ring-slate-700/50">
                <dt className="text-slate-400">Capacité</dt>
                <dd className="mt-1 flex items-center gap-1 font-semibold text-white">
                  <Users className="h-4 w-4 text-indigo-400" />
                  {table.capacite ?? 4} personnes
                </dd>
              </div>
              {occupation && (
                <div className="rounded-xl bg-red-500/10 p-3 ring-1 ring-red-500/20">
                  <dt className="text-red-400">Occupation</dt>
                  <dd className="mt-1 font-semibold text-red-300">{occupation}</dd>
                </div>
              )}
              {table.active_orders_count > 0 && (
                <div className="col-span-2 rounded-xl bg-slate-800/80 p-3 ring-1 ring-slate-700/50">
                  <dt className="text-slate-400">Commandes actives</dt>
                  <dd className="mt-1 font-semibold text-white">{table.active_orders_count}</dd>
                </div>
              )}
            </dl>

            {table.upcoming_reservation && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Réservation
                </p>
                <p className="font-medium text-white">{table.upcoming_reservation.client_nom}</p>
                <p className="mt-0.5 text-sm text-amber-200/80">
                  {table.upcoming_reservation.heure_reservation} · {table.upcoming_reservation.nombre_personnes} pers.
                </p>
              </div>
            )}

            {table.reservations?.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Prochaines réservations</p>
                <ul className="space-y-1.5">
                  {table.reservations.slice(1, 4).map((r) => (
                    <li key={r.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
                      <span className="text-slate-300">{r.client_nom}</span>
                      <span className="text-slate-500">{r.heure_reservation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {table.active_orders?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Commandes en cours</p>
                <ul className="space-y-1.5">
                  {table.active_orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
                      <span className="text-slate-300">{o.menu} ×{o.quantite}</span>
                      <span className="text-indigo-400">{ORDER_LABELS[o.statut] || o.statut}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onStatusChange?.(table.id, 'disponible')}
                className="flex flex-col items-center gap-1 rounded-xl bg-emerald-500/10 px-2 py-2.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                Disponible
              </button>
              <button
                type="button"
                onClick={() => onReserve?.(table.id)}
                disabled={isReserving}
                className="flex flex-col items-center gap-1 rounded-xl bg-amber-500/10 px-2 py-2.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                Réserver
              </button>
              <button
                type="button"
                onClick={() => onStatusChange?.(table.id, 'nettoyage')}
                className="flex flex-col items-center gap-1 rounded-xl bg-sky-500/10 px-2 py-2.5 text-xs font-medium text-sky-400 ring-1 ring-sky-500/20 hover:bg-sky-500/20"
              >
                <SprayCan className="h-4 w-4" />
                Nettoyage
              </button>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <QrCode className="h-4 w-4" />
                QR code de commande
              </p>
              {qrSrc ? (
                <div className="text-center">
                  <img src={qrSrc} alt="QR Code" className="mx-auto h-36 w-36 rounded-xl border border-slate-700 bg-white p-2" />
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onGenerateQr?.(table.id)}
                      disabled={isGeneratingQr}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingQr ? 'animate-spin' : ''}`} />
                      Régénérer
                    </button>
                    <button
                      type="button"
                      onClick={() => (onDownloadQr ? onDownloadQr(table) : downloadQrCode(table))}
                      className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
                    >
                      Télécharger
                    </button>
                    <button
                      type="button"
                      onClick={() => openQrPrintWindow(table)}
                      className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
                    >
                      Imprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="mb-3 text-sm text-slate-500">
                    Aucun QR pour cette table. Générez-le pour permettre les commandes par scan.
                  </p>
                  <button
                    type="button"
                    onClick={() => onGenerateQr?.(table.id)}
                    disabled={isGeneratingQr}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95 disabled:opacity-50"
                  >
                    <QrCode className={`h-5 w-5 ${isGeneratingQr ? 'animate-pulse' : ''}`} />
                    {isGeneratingQr ? 'Génération…' : 'Générer le QR code'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={() => { onEdit(table); onClose(); }}>
                Modifier
              </Button>
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
