import { ChefHat, Shield, UserCheck, UserCog, Users } from 'lucide-react';

const cards = [
  { key: 'total', label: 'Total employés', icon: Users, color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400' },
  { key: 'active', label: 'Actifs', icon: UserCheck, color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
  { key: 'by_role.admin', label: 'Admins', icon: Shield, color: 'text-red-600 bg-red-500/10 dark:text-red-400' },
  { key: 'by_role.manager', label: 'Managers', icon: UserCog, color: 'text-violet-600 bg-violet-500/10 dark:text-violet-400' },
  { key: 'by_role.serveur', label: 'Serveurs', icon: Users, color: 'text-sky-600 bg-sky-500/10 dark:text-sky-400' },
  { key: 'by_role.cuisinier', label: 'Cuisiniers', icon: ChefHat, color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export default function EmployeeStatsBar({ stats }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="surface-card p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${color}`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tabular-nums text-slate-900 dark:text-white sm:text-xl">
                {getNestedValue(stats, key) ?? 0}
              </p>
              <p className="truncate text-[10px] font-medium text-slate-500 dark:text-zinc-400 sm:text-xs">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
