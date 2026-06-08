import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, Search } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import InvoiceDetailModal from '../../components/invoices/InvoiceDetailModal';
import InvoiceList from '../../components/invoices/InvoiceList';
import InvoiceStatsBar from '../../components/invoices/InvoiceStatsBar';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  downloadInvoicePdf,
  openInvoicePrint,
  SORT_OPTIONS,
  STATUT_FILTERS,
} from '../../lib/invoiceUtils';

export default function Invoices() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = useMemo(() => {
    const p = { sort, per_page: 100 };
    if (search.trim()) p.search = search.trim();
    if (statutFilter !== 'all') p.statut = statutFilter;
    return p;
  }, [search, statutFilter, sort]);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['invoices', 'stats'],
    queryFn: () => api.get('/invoices/stats').then((r) => r.data),
  });

  const { data: page, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => api.get('/invoices', { params }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const invoices = page?.data ?? page ?? [];

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['invoices', viewId],
    queryFn: () => api.get(`/invoices/${viewId}`).then((r) => r.data),
    enabled: !!viewId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Facture supprimée');
      setDeleteTarget(null);
      if (viewId === id) setViewId(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Suppression impossible'),
  });

  const handleDownload = async (invoice) => {
    try {
      await downloadInvoicePdf(invoice.id, invoice.numero_facture);
      toast.success('PDF téléchargé');
    } catch {
      toast.error('Impossible de générer le PDF');
    }
  };

  const handlePrint = async (invoice) => {
    try {
      await openInvoicePrint(invoice.id);
    } catch {
      toast.error('Impossible d\'ouvrir l\'aperçu d\'impression');
    }
  };

  return (
    <AdminShell title="Facturation" onRefresh={() => { refetch(); refetchStats(); }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Facturation</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Générez, téléchargez et consultez l&apos;historique de vos factures.
        </p>
      </div>

      <InvoiceStatsBar stats={stats} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher par n°, client, téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button type="button" onClick={() => setShowFilters((v) => !v)} className="btn-icon gap-2 !px-3 !py-2.5 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filtres
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <label htmlFor="inv-statut" className="mb-1.5 block text-xs font-medium text-slate-500">Statut</label>
            <select id="inv-statut" className="input-field" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
              {STATUT_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="inv-sort" className="mb-1.5 block text-xs font-medium text-slate-500">Trier par</label>
            <select id="inv-sort" className="input-field" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          Impossible de charger les factures.
        </div>
      )}

      <InvoiceList
        invoices={invoices}
        loading={isLoading}
        onView={(inv) => setViewId(inv.id)}
        onDownload={handleDownload}
        onPrint={handlePrint}
        onDelete={setDeleteTarget}
      />

      <InvoiceDetailModal
        invoice={detail}
        loading={!!viewId && detailLoading}
        onClose={() => setViewId(null)}
        onDownload={handleDownload}
        onPrint={handlePrint}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer la facture"
        itemName={deleteTarget?.numero_facture}
        message="Cette action est définitive. La facture sera retirée de l'historique."
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
