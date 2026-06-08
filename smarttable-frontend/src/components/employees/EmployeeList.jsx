import { Edit2, Eye, Mail, Phone, Trash2, UserCog } from 'lucide-react';
import { getInitials, getRoleLabel, ROLE_COLORS } from '../../lib/employeeUtils';

export default function EmployeeList({ employees, loading, onView, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="surface-card animate-pulse p-5">
            <div className="flex gap-3">
              <div className="skeleton-shine h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-shine h-4 w-32 rounded-lg" />
                <div className="skeleton-shine h-3 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!employees.length) {
    return (
      <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
        <UserCog className="mb-3 h-10 w-10 text-slate-300 dark:text-zinc-600" />
        <p className="font-medium text-slate-700 dark:text-zinc-300">Aucun employé trouvé</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
          Ajustez les filtres ou ajoutez un nouvel employé.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee) => (
        <article
          key={employee.id}
          className={`surface-card surface-card-hover group relative overflow-hidden p-5 ${!employee.is_active ? 'opacity-70' : ''}`}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/5 blur-2xl" />

          <div className="relative flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white shadow-glow-sm dark:from-zinc-600 dark:to-zinc-800">
              {getInitials(employee)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                  {employee.nom_complet}
                </h3>
                {!employee.is_active && (
                  <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-zinc-700 dark:text-zinc-300">
                    Inactif
                  </span>
                )}
              </div>
              <span className={`mt-1 inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[employee.role] || ROLE_COLORS.serveur}`}>
                {getRoleLabel(employee.role)}
              </span>
            </div>
          </div>

          <div className="relative mt-4 space-y-1.5 text-sm text-slate-600 dark:text-zinc-400">
            {employee.telephone && (
              <p className="inline-flex items-center gap-2 truncate">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {employee.telephone}
              </p>
            )}
            {employee.email && (
              <p className="inline-flex items-center gap-2 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {employee.email}
              </p>
            )}
          </div>

          <div className="relative mt-4 rounded-xl bg-slate-50/80 p-2 text-center dark:bg-zinc-800/50">
            <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
              {employee.permissions_count ?? 0}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500">
              {employee.use_custom_permissions ? 'Permissions personnalisées' : 'Permissions du rôle'}
            </p>
          </div>

          <div className="relative mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onView(employee)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
            >
              <Eye className="h-3.5 w-3.5" />
              Détails
            </button>
            <button type="button" onClick={() => onEdit(employee)} className="btn-icon" aria-label="Modifier">
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(employee)}
              className="btn-icon text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
