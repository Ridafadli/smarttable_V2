import { Armchair, CheckCircle2, Clock, LayoutGrid, Sparkles } from 'lucide-react';
import { StatCard, StatCardGrid } from '../ui/StatCard';

const items = [
  { key: 'total', label: 'Total tables', icon: LayoutGrid, color: 'text-slate-700 bg-slate-100 dark:text-zinc-300 dark:bg-zinc-800' },
  { key: 'disponible', label: 'Disponibles', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
  { key: 'occupee', label: 'Occupées', icon: Armchair, color: 'text-red-600 bg-red-500/10 dark:text-red-400' },
  { key: 'reservee', label: 'Réservées', icon: Clock, color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
  { key: 'nettoyage', label: 'Nettoyage', icon: Sparkles, color: 'text-sky-600 bg-sky-500/10 dark:text-sky-400' },
];

export default function TableStatsBar({ stats }) {
  return (
    <StatCardGrid cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ key, label, icon, color }) => (
        <StatCard key={key} label={label} value={stats?.[key]} icon={icon} color={color} />
      ))}
    </StatCardGrid>
  );
}
