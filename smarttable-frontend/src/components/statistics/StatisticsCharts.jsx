import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, formatMoney, tooltipStyle } from '../../lib/statisticsUtils';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.dataKey === 'revenue' ? formatMoney(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function RevenueOrdersChart({ data, loading, periodLabel }) {
  if (loading) {
    return <div className="surface-card h-80 animate-pulse rounded-2xl" />;
  }

  if (!data?.length) {
    return (
      <div className="surface-card flex h-80 items-center justify-center rounded-2xl text-sm text-slate-500 dark:text-zinc-500">
        Aucune donnée pour cette période
      </div>
    );
  }

  return (
    <div className="surface-card p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Chiffre d&apos;affaires & commandes</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-500">Vue {periodLabel.toLowerCase()}</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area yAxisId="left" type="monotone" dataKey="revenue" name="CA (MAD)" stroke={CHART_COLORS.revenue} fill="url(#revenueGrad)" strokeWidth={2} />
          <Bar yAxisId="right" dataKey="orders" name="Commandes" fill={CHART_COLORS.orders} radius={[4, 4, 0, 0]} maxBarSize={28} opacity={0.85} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RankingBarChart({ title, subtitle, data, dataKey, valueKey, loading, formatValue }) {
  if (loading) {
    return <div className="surface-card h-72 animate-pulse rounded-2xl" />;
  }

  const chartData = (data || []).slice(0, 8).map((row) => ({
    name: row[dataKey]?.length > 22 ? `${row[dataKey].slice(0, 20)}…` : row[dataKey],
    value: row[valueKey],
  }));

  if (!chartData.length) {
    return (
      <div className="surface-card flex h-72 flex-col items-center justify-center rounded-2xl p-6 text-center">
        <p className="font-medium text-slate-700 dark:text-zinc-300">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="surface-card p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-zinc-500">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart layout="vertical" data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => [formatValue ? formatValue(v) : v, '']}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="value" fill={CHART_COLORS.revenue} radius={[0, 6, 6, 0]} maxBarSize={18} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
