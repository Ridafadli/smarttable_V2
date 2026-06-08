import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileText } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import { RankingBarChart } from '../../components/statistics/StatisticsCharts';
import RevenueOrdersChart from '../../components/statistics/StatisticsCharts';
import StatisticsSummaryBar from '../../components/statistics/StatisticsSummaryBar';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  downloadStatisticsExcel,
  downloadStatisticsPdf,
  getPeriodLabel,
  PERIOD_OPTIONS,
} from '../../lib/statisticsUtils';

export default function Statistics() {
  const toast = useToast();
  const [period, setPeriod] = useState('week');
  const [exporting, setExporting] = useState(null);

  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: ['statistics', 'report', period],
    queryFn: () => api.get('/statistics/report', { params: { period } }).then((r) => r.data),
    refetchInterval: 60_000,
    retry: false,
  });

  const handleExportPdf = async () => {
    setExporting('pdf');
    try {
      await downloadStatisticsPdf(period);
      toast.success('Rapport PDF téléchargé');
    } catch {
      toast.error('Export PDF impossible');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      await downloadStatisticsExcel(period);
      toast.success('Fichier Excel (CSV) téléchargé');
    } catch {
      toast.error('Export Excel impossible');
    } finally {
      setExporting(null);
    }
  };

  const periodLabel = getPeriodLabel(period);
  const chartData = report?.revenue?.series ?? [];

  return (
    <AdminShell title="Statistiques" onRefresh={() => refetch()}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Statistiques</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Analysez votre performance : CA, commandes, plats, tables et clients fidèles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={FileText} loading={exporting === 'pdf'} onClick={handleExportPdf}>
            Export PDF
          </Button>
          <Button variant="secondary" icon={FileSpreadsheet} loading={exporting === 'excel'} onClick={handleExportExcel}>
            Export Excel
          </Button>
        </div>
      </div>

      <StatisticsSummaryBar summary={report?.summary} loading={isLoading} />

      <div className="mb-6 inline-flex rounded-xl border border-slate-200/80 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPeriod(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              period === opt.value
                ? 'bg-indigo-600 text-white shadow-glow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Statistiques avancées réservées au plan Pro. Connectez-vous avec un compte Pro ou mettez à jour votre abonnement.
        </div>
      )}

      <div className="mb-6">
        <RevenueOrdersChart data={chartData} loading={isLoading} periodLabel={periodLabel} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RankingBarChart
          title="Plats les plus vendus"
          subtitle={`Période : ${periodLabel.toLowerCase()}`}
          data={report?.top_dishes}
          dataKey="name"
          valueKey="quantity"
          loading={isLoading}
        />
        <RankingBarChart
          title="Tables les plus utilisées"
          subtitle={`Période : ${periodLabel.toLowerCase()}`}
          data={report?.top_tables}
          dataKey="label"
          valueKey="orders"
          loading={isLoading}
        />
        <RankingBarChart
          title="Clients les plus fidèles"
          subtitle={`Période : ${periodLabel.toLowerCase()}`}
          data={report?.top_clients}
          dataKey="name"
          valueKey="orders"
          loading={isLoading}
        />
      </div>
    </AdminShell>
  );
}
