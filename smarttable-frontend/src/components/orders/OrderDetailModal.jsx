import { useEffect, useState } from 'react';
import {
  FileText,
  Pencil,
  Printer,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  formatDateTime,
  formatMoney,
  getClientLabel,
  getOrderNumber,
  getStatutConfig,
  NEXT_STATUT,
} from '../../lib/orderUtils';
import {
  generateAndDownloadInvoice,
  generateAndPrintInvoice,
} from '../../lib/invoiceUtils';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderDetailModal({
  group,
  onClose,
  onStatusChange,
  onUpdateLine,
  onDelete,
  isSaving,
  isDeleting,
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(null);

  useEffect(() => {
    if (group) {
      setDrafts(
        group.lines.map((l) => ({
          id: l.id,
          quantite: l.quantite,
          notes: l.notes || '',
        }))
      );
      setEditing(false);
    }
  }, [group]);

  if (!group) return null;

  const next = NEXT_STATUT[group.statut];

  const handleInvoicePdf = async () => {
    setInvoiceLoading('pdf');
    try {
      const invoice = await generateAndDownloadInvoice(group);
      toast.success(`Facture ${invoice.numero_facture} téléchargée`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de générer la facture PDF');
    } finally {
      setInvoiceLoading(null);
    }
  };

  const handleInvoicePrint = async () => {
    setInvoiceLoading('print');
    try {
      await generateAndPrintInvoice(group);
      toast.success('Facture ouverte pour impression');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible d\'imprimer la facture');
    } finally {
      setInvoiceLoading(null);
    }
  };

  const handleSave = async () => {
    for (const d of drafts) {
      const original = group.lines.find((l) => l.id === d.id);
      if (
        original
        && (original.quantite !== Number(d.quantite) || (original.notes || '') !== d.notes)
      ) {
        await onUpdateLine(d.id, {
          quantite: Number(d.quantite),
          notes: d.notes || null,
        });
      }
    }
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-label="Fermer" />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl animate-slide-up sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{getOrderNumber(group)}</h3>
            <p className="text-sm text-slate-500">{getClientLabel(group)} · Table #{group.table?.numero_table}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <OrderStatusBadge statut={group.statut} />
            <span className="text-xs text-slate-500">{formatDateTime(group.created_at)}</span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {next && (
              <Button
                size="sm"
                onClick={() => onStatusChange(group, next)}
              >
                → {getStatutConfig(next).label}
              </Button>
            )}
            {group.statut !== 'cancelled' && group.statut !== 'delivered' && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => onStatusChange(group, 'cancelled')}
              >
                Annuler
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              icon={Printer}
              loading={invoiceLoading === 'print'}
              onClick={handleInvoicePrint}
            >
              Imprimer
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={FileText}
              loading={invoiceLoading === 'pdf'}
              onClick={handleInvoicePdf}
            >
              Facture PDF
            </Button>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Articles commandés</h4>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Plat</th>
                  <th className="px-3 py-2 text-center">Qté</th>
                  <th className="px-3 py-2 text-right">Prix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {group.lines.map((line) => {
                  const draft = drafts.find((d) => d.id === line.id);
                  const unitPrice = line.menu?.prix
                    ? Number(line.menu.prix)
                    : (Number(line.total) / (line.quantite || 1));

                  return (
                    <tr key={line.id}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-800">{line.menu?.nom_plat || 'Article'}</p>
                        {line.sauce && <p className="text-xs text-slate-500">Sauce : {line.sauce}</p>}
                        {editing ? (
                          <input
                            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            value={draft?.notes ?? ''}
                            onChange={(e) =>
                              setDrafts((prev) =>
                                prev.map((d) =>
                                  d.id === line.id ? { ...d, notes: e.target.value } : d
                                )
                              )
                            }
                            placeholder="Notes"
                          />
                        ) : (
                          line.notes && <p className="text-xs text-slate-500">{line.notes}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {editing ? (
                          <input
                            type="number"
                            min={1}
                            max={20}
                            className="w-14 rounded border border-slate-200 px-1 py-1 text-center text-sm"
                            value={draft?.quantite ?? 1}
                            onChange={(e) =>
                              setDrafts((prev) =>
                                prev.map((d) =>
                                  d.id === line.id ? { ...d, quantite: e.target.value } : d
                                )
                              )
                            }
                          />
                        ) : (
                          <span className="font-medium">{line.quantite}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-slate-800">
                        {editing
                          ? formatMoney(unitPrice * (Number(draft?.quantite) || 1))
                          : formatMoney(line.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-primary/5">
                  <td colSpan={2} className="px-3 py-3 text-right text-sm font-semibold text-slate-700">
                    Total
                  </td>
                  <td className="px-3 py-3 text-right text-base font-bold text-primary">
                    {formatMoney(group.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            icon={Trash2}
            loading={isDeleting}
            onClick={() => onDelete(group)}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}
