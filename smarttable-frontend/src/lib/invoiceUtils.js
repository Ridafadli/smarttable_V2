import api from '../api/axios';

export const STATUT_CONFIG = {
  emise: { label: 'Émise', className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400' },
  annulee: { label: 'Annulée', className: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-400' },
};

export const STATUT_FILTERS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'emise', label: 'Émises' },
  { value: 'annulee', label: 'Annulées' },
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'oldest', label: 'Plus anciennes' },
  { value: 'amount', label: 'Montant décroissant' },
  { value: 'number', label: 'N° de facture' },
];

export function formatMoney(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getStatutConfig(statut) {
  return STATUT_CONFIG[statut] ?? STATUT_CONFIG.emise;
}

export async function downloadInvoicePdf(invoiceId, numeroFacture) {
  const response = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${numeroFacture || 'facture'}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function openInvoicePrint(invoiceId) {
  const { data: html } = await api.get(`/invoices/${invoiceId}/print`, { responseType: 'text' });
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export async function generateInvoiceFromOrder(group) {
  const payload = group.session_id
    ? { session_id: group.session_id }
    : { commande_ids: group.lineIds || group.lines?.map((l) => l.id) };

  const { data } = await api.post('/invoices/generate', payload);
  return data;
}

export async function generateAndDownloadInvoice(group) {
  const invoice = await generateInvoiceFromOrder(group);
  await downloadInvoicePdf(invoice.id, invoice.numero_facture);
  return invoice;
}

export async function generateAndPrintInvoice(group) {
  const invoice = await generateInvoiceFromOrder(group);
  await openInvoicePrint(invoice.id);
  return invoice;
}
