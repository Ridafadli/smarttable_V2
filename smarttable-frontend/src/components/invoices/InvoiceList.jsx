import { Download, Eye, Printer, Trash2 } from 'lucide-react';
import { formatDate, formatMoney, getStatutConfig } from '../../lib/invoiceUtils';

export default function InvoiceList({ invoices, loading, onView, onDownload, onPrint, onDelete }) {
  if (loading) {
    return (
      <div className="surface-card overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse border-b border-slate-100 px-4 py-4 dark:border-zinc-800">
            <div className="skeleton-shine h-4 w-40 rounded-lg" />
            <div className="skeleton-shine mt-2 h-3 w-64 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!invoices.length) {
    return (
      <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
        <FileTextIcon />
        <p className="font-medium text-slate-700 dark:text-zinc-300">Aucune facture</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
          Générez une facture depuis une commande ou créez-en une manuellement.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <th className="px-4 py-3">N° Facture</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {invoices.map((invoice) => {
              const cfg = getStatutConfig(invoice.statut);
              return (
                <tr key={invoice.id} className="transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">{invoice.numero_facture}</p>
                    {invoice.table_numero && (
                      <p className="text-xs text-slate-500 dark:text-zinc-500">Table {invoice.table_numero}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-900 dark:text-white">{invoice.client_nom || '—'}</p>
                    {invoice.client_telephone && (
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{invoice.client_telephone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-zinc-400">{formatDate(invoice.date_facture)}</td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatMoney(invoice.total)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => onView(invoice)} className="btn-icon !p-2" aria-label="Détails">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => onDownload(invoice)} className="btn-icon !p-2" aria-label="Télécharger PDF">
                        <Download className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => onPrint(invoice)} className="btn-icon !p-2" aria-label="Imprimer">
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(invoice)}
                        className="btn-icon !p-2 text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg className="mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
