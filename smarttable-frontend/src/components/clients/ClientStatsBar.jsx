import { Mail, Receipt, UserRound, Users, Wallet } from 'lucide-react';
import { formatMoney } from '../../lib/clientUtils';
import { StatCard, StatCardGrid } from '../ui/StatCard';

const cards = [
  { key: 'total', label: 'Total clients', icon: Users, color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400' },
  { key: 'with_email', label: 'Avec email', icon: Mail, color: 'text-violet-600 bg-violet-500/10 dark:text-violet-400' },
  { key: 'active_this_month', label: 'Actifs ce mois', icon: UserRound, color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
  { key: 'with_reservations', label: 'Avec réservations', icon: Receipt, color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
  { key: 'total_spent', label: 'CA clients', icon: Wallet, color: 'text-sky-600 bg-sky-500/10 dark:text-sky-400', format: formatMoney },
];

export default function ClientStatsBar({ stats }) {
  return (
    <StatCardGrid cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(({ key, label, icon, color, format }) => (
        <StatCard key={key} label={label} value={stats?.[key]} icon={icon} color={color} format={format} />
      ))}
    </StatCardGrid>
  );
}
