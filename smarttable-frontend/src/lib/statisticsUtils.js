import api from '../api/axios';

export const PERIOD_OPTIONS = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année' },
];

export function formatMoney(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MAD`;
}

export function formatMoneyShort(amount) {
  const n = Number(amount) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function getPeriodLabel(period) {
  return PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;
}

export async function downloadStatisticsPdf(period) {
  const response = await api.get('/statistics/export/pdf', {
    params: { period },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `statistiques-${period}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadStatisticsExcel(period) {
  const response = await api.get('/statistics/export/excel', {
    params: { period },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `statistiques-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const CHART_COLORS = {
  revenue: '#6366f1',
  orders: '#8b5cf6',
  grid: '#e2e8f0',
  tooltipBg: '#ffffff',
};

export const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  fontSize: 12,
};
