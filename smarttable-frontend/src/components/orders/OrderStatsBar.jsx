import {
  Ban,
  CheckCircle2,
  ChefHat,
  Clock,
  Receipt,
  ShoppingBag,
} from 'lucide-react';
import { formatMoney } from '../../lib/orderUtils';

const cards = [
  { key: 'total', label: 'Total commandes', icon: ShoppingBag, color: 'text-primary bg-primary/10' },
  { key: 'pending', label: 'En attente', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  { key: 'preparing', label: 'En préparation', icon: ChefHat, color: 'text-orange-600 bg-orange-50' },
  { key: 'ready', label: 'Prêtes', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  { key: 'served', label: 'Servies', icon: Receipt, color: 'text-slate-600 bg-slate-100' },
  { key: 'cancelled', label: 'Annulées', icon: Ban, color: 'text-red-600 bg-red-50' },
];

export default function OrderStatsBar({ stats }) {
  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-card transition-shadow hover:shadow-card-hover sm:p-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${color}`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                  {key === 'today_revenue' ? formatMoney(stats?.[key]) : (stats?.[key] ?? 0)}
                </p>
                <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-accent/20 bg-gradient-to-r from-primary/5 to-accent/5 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">Chiffre d&apos;affaires du jour</p>
          <p className="text-xl font-bold text-primary sm:text-2xl">
            {formatMoney(stats?.today_revenue)}
          </p>
        </div>
      </div>
    </div>
  );
}
