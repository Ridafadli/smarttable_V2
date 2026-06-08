import {
  CalendarPlus,
  Download,
  Eye,
  Pencil,
  Printer,
  QrCode,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import {
  formatOccupationDuration,
  getEffectiveStatut,
  getStatutConfig,
  qrImageUrl,
} from '../../lib/tableUtils';
import Badge from '../ui/Badge';

export default function TableCard({
  table,
  onView,
  onEdit,
  onDelete,
  onReserve,
  onGenerateQr,
  onPrintQr,
  onDownloadQr,
  isGeneratingQr = false,
  isDeleting = false,
  isReserving = false,
}) {
  const statut = getEffectiveStatut(table);
  const config = getStatutConfig(table);
  const occupation = statut === 'occupee' ? formatOccupationDuration(table.occupied_since) : null;
  const qrSrc = qrImageUrl(table);

  return (
    <article className={`group relative flex flex-col overflow-hidden surface-card surface-card-hover p-0 ${config.border}`}>
      <div className={`h-1 bg-gradient-to-r ${config.header}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">#{table.numero_table}</p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">{table.nom || 'Sans nom'}</p>
          </div>
          <Badge
            variant={statut === 'disponible' ? 'success' : statut === 'occupee' ? 'danger' : statut === 'reservee' ? 'warning' : 'sky'}
            dot
            pulse={statut === 'occupee'}
          >
            {config.label}
          </Badge>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 ring-1 ring-slate-100">
            <Users className="h-4 w-4 text-accent" />
            <span className="font-medium">{table.capacite ?? 4}</span>
            <span className="text-slate-400">pers.</span>
          </span>
          {occupation && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-red-700 ring-1 ring-red-100">
              <span className="font-medium">Occupée depuis</span>
              <span className="font-bold">{occupation}</span>
            </span>
          )}
          {statut === 'reservee' && table.reserved_until && (
            <span className="text-xs text-amber-700">
              Jusqu&apos;à {new Date(table.reserved_until).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {qrSrc ? (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <img
              src={qrSrc}
              alt={`QR table ${table.numero_table}`}
              className="h-16 w-16 rounded-lg border border-white bg-white p-1 shadow-sm object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex flex-1 flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onDownloadQr?.(table)}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-50"
              >
                <Download className="h-3 w-3" />
                Télécharger
              </button>
              <button
                type="button"
                onClick={() => onPrintQr(table)}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-medium text-sky-700 ring-1 ring-sky-100 hover:bg-sky-50"
              >
                <Printer className="h-3 w-3" />
                Imprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-center rounded-xl border border-dashed border-slate-200 py-6 text-slate-400">
            <QrCode className="h-8 w-8 opacity-40" />
          </div>
        )}

        <div className="mt-auto space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onView(table)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <Eye className="h-3.5 w-3.5" />
              Détails
            </button>
            <button
              type="button"
              onClick={() => onEdit(table)}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-medium text-white transition-all hover:bg-accent active:scale-[0.98] disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onReserve(table)}
              disabled={isReserving || statut === 'occupee' || isDeleting}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-semibold text-amber-800 transition-all hover:bg-amber-100 active:scale-[0.98] disabled:opacity-50"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              {isReserving ? '...' : 'Réserver'}
            </button>
            <button
              type="button"
              onClick={() => onGenerateQr(table.id)}
              disabled={isGeneratingQr || isDeleting}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                table.qr_code_url
                  ? 'border border-accent/30 bg-accent/5 text-accent hover:bg-accent/10'
                  : 'border border-primary/30 bg-primary text-white shadow-sm hover:bg-primary-emphasis'
              }`}
            >
              {table.qr_code_url ? (
                <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingQr ? 'animate-spin' : ''}`} />
              ) : (
                <QrCode className={`h-3.5 w-3.5 ${isGeneratingQr ? 'animate-pulse' : ''}`} />
              )}
              {table.qr_code_url ? 'Régénérer QR' : 'Générer QR'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => onDelete(table)}
            disabled={isDeleting}
            aria-label={`Supprimer table ${table.numero_table}`}
            className="group/del inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50/60 py-2.5 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 transition-transform group-hover/del:scale-110" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </article>
  );
}
