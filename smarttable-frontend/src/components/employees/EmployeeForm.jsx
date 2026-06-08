import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PermissionEditor from './PermissionEditor';
import { ROLES } from '../../lib/employeeUtils';

export default function EmployeeForm({
  open,
  form,
  onChange,
  onSubmit,
  onClose,
  loading,
  editId,
  permissionsConfig,
}) {
  if (!open) return null;

  const handleRoleChange = (role) => {
    onChange({
      ...form,
      role,
      permissions: [],
      use_custom_permissions: false,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl glass-strong p-5 shadow-card-hover sm:rounded-2xl sm:p-6 dark:shadow-dark-card">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editId ? 'Modifier l\'employé' : 'Nouvel employé'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              {editId ? 'Mettez à jour les informations et permissions.' : 'Ajoutez un membre à votre équipe.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon !p-2" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nom *"
              value={form.nom}
              onChange={(e) => onChange({ ...form, nom: e.target.value })}
              required
              placeholder="Ex. Benali"
            />
            <Input
              label="Prénom"
              value={form.prenom}
              onChange={(e) => onChange({ ...form, prenom: e.target.value })}
              placeholder="Ex. Ahmed"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Téléphone"
              type="tel"
              value={form.telephone}
              onChange={(e) => onChange({ ...form, telephone: e.target.value })}
              placeholder="+212 6XX XXX XXX"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              placeholder="employe@email.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emp-role" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Rôle *
              </label>
              <select
                id="emp-role"
                className="input-field"
                value={form.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                required
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Date d'embauche"
              type="date"
              value={form.date_embauche}
              onChange={(e) => onChange({ ...form, date_embauche: e.target.value })}
            />
          </div>

          <PermissionEditor form={form} onChange={onChange} config={permissionsConfig} />

          <div>
            <label htmlFor="emp-notes" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Notes (optionnel)
            </label>
            <textarea
              id="emp-notes"
              rows={2}
              className="input-field resize-none"
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              placeholder="Horaires, remarques…"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange({ ...form, is_active: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Employé actif
          </label>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              {editId ? 'Enregistrer' : 'Ajouter l\'employé'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
