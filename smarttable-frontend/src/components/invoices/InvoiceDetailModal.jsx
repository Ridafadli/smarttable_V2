import { Download, Printer, X } from 'lucide-react';
import { formatDate, formatMoney, getStatutConfig } from '../../lib/invoiceUtils';
import Button from '../ui/Button';

export default function InvoiceDetailModal({ invoice, loading, onClose, onDownload, onPrint }) {
  if (!invoice && !loading) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl glass-strong p-5 shadow-card-hover sm:rounded-2xl sm:p-6 dark:shadow-dark-card">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="skeleton-shine h-8 w-48 rounded-lg" />
            <div className="skeleton-shine h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Facture</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{invoice.numero_facture}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  {formatDate(invoice.date_facture)} · {invoice.client_nom}
                </p>
              </div>
              <button type="button" onClick={onClose} className="btn-icon !p-2" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatutConfig(invoice.statut).className}`}>
                {getStatutConfig(invoice.statut).label}
              </span>
              {invoice.table_numero && (
                <span className="text-xs text-slate-500 dark:text-zinc-500">Table {invoice.table_numero}</span>
              )}
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Client</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{invoice.client_nom}</p>
                {invoice.client_telephone && <p className="text-sm text-slate-600 dark:text-zinc-400">{invoice.client_telephone}</p>}
                {invoice.client_email && <p className="text-sm text-slate-600 dark:text-zinc-400">{invoice.client_email}</p>}
              </div>
              <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Total</p>
                <p className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">{formatMoney(invoice.total)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-3 py-2.5">Produit</th>
                    <th className="px-3 py-2.5 text-center">Qté</th>
                    <th className="px-3 py-2.5 text-right">P.U.</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {invoice.lignes?.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="px-3 py-3 font-medium text-slate-800 dark:text-zinc-200">{ligne.description}</td>
                      <td className="px-3 py-3 text-center">{ligne.quantite}</td>
                      <td className="px-3 py-3 text-right text-slate-600 dark:text-zinc-400">{formatMoney(ligne.prix_unitaire)}</td>
                      <td className="px-3 py-3 text-right font-semibold">{formatMoney(ligne.total_ligne)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50/50 dark:bg-indigo-500/10">
                    <td colSpan={3} className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-zinc-300">Total TTC</td>
                    <td className="px-3 py-3 text-right text-base font-bold text-indigo-600 dark:text-indigo-400">{formatMoney(invoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
              <Button variant="secondary" onClick={onClose}>Fermer</Button>
              <Button variant="secondary" icon={Printer} onClick={() => onPrint(invoice)}>Imprimer</Button>
              <Button icon={Download} onClick={() => onDownload(invoice)}>Télécharger PDF</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
