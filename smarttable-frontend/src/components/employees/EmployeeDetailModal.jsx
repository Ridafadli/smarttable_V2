import { Calendar, Clock, Mail, Phone, Shield, X } from 'lucide-react';
import Button from '../ui/Button';
import LoadingState from '../ui/LoadingState';
import {
  ACTION_LABELS,
  formatActivityTime,
  getRoleLabel,
  ROLE_COLORS,
} from '../../lib/employeeUtils';

export default function EmployeeDetailModal({ employee, loading, onClose, onEdit }) {
  if (!employee && !loading) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl glass-strong p-5 shadow-card-hover sm:rounded-2xl sm:p-6 dark:shadow-dark-card">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {employee?.nom_complet || 'Détails employé'}
            </h2>
            {employee && (
              <span className={`mt-1 inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[employee.role]}`}>
                {getRoleLabel(employee.role)}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn-icon !p-2" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <LoadingState message="Chargement…" />
        ) : employee ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {employee.telephone && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  {employee.telephone}
                </div>
              )}
              {employee.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  {employee.email}
                </div>
              )}
              {employee.date_embauche && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                  <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                  Embauché le {new Date(employee.date_embauche).toLocaleDateString('fr-FR')}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                <Shield className="h-4 w-4 shrink-0 text-slate-400" />
                {employee.is_active ? 'Actif' : 'Inactif'} · {employee.permissions_count} permissions
              </div>
            </div>

            {employee.notes && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-zinc-800/50 dark:text-zinc-400">
                {employee.notes}
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Permissions effectives</h3>
              <div className="flex flex-wrap gap-1.5">
                {(employee.effective_permissions ?? []).map((perm) => (
                  <span
                    key={perm}
                    className="rounded-lg bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300"
                  >
                    {perm.replace('.', ' · ')}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Clock className="h-4 w-4" />
                Historique d'activité
              </h3>
              {!employee.historique_activite?.length ? (
                <p className="text-sm text-slate-500 dark:text-zinc-500">Aucune activité enregistrée.</p>
              ) : (
                <ul className="space-y-3">
                  {employee.historique_activite.map((log) => (
                    <li
                      key={log.id}
                      className="flex gap-3 rounded-xl border border-slate-200/80 px-3 py-2.5 dark:border-zinc-800"
                    >
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          <span className="text-xs text-slate-400">{formatActivityTime(log.created_at)}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-700 dark:text-zinc-300">{log.description}</p>
                        {log.performed_by && (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">Par {log.performed_by}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
              <Button variant="secondary" onClick={onClose}>Fermer</Button>
              <Button onClick={() => onEdit(employee)}>Modifier</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
