import { CAPACITY_OPTIONS } from '../../lib/tableUtils';
import Button from '../ui/Button';

const STATUT_OPTIONS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'occupee', label: 'Occupée' },
  { value: 'reservee', label: 'Réservée' },
  { value: 'nettoyage', label: 'En nettoyage' },
];

export default function TableForm({
  form,
  setForm,
  editTable,
  onSubmit,
  onCancel,
  isSubmitting,
  atTableLimit = false,
}) {
  const fieldsDisabled = isSubmitting || (!editTable && atTableLimit);

  return (
    <div className="relative z-30 mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card animate-slide-up dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-white">
          {editTable ? 'Modifier la table' : 'Nouvelle table'}
        </h3>
      </div>
      <form onSubmit={onSubmit} className="p-6">
        {!editTable && atTableLimit && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Limite du plan Free atteinte (3 tables). Passez au plan Pro pour en ajouter davantage.
          </p>
        )}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Numéro de table <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.numero_table}
              onChange={(e) => setForm((p) => ({ ...p, numero_table: e.target.value }))}
              className="input-field"
              required
              disabled={fieldsDisabled}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">Nom (optionnel)</label>
            <input
              value={form.nom}
              onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
              className="input-field"
              placeholder="Terrasse 1"
              disabled={fieldsDisabled}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">Capacité</label>
            <select
              value={form.capacite}
              onChange={(e) => setForm((p) => ({ ...p, capacite: Number(e.target.value) }))}
              className="input-field"
              disabled={fieldsDisabled}
            >
              {CAPACITY_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} personnes</option>
              ))}
            </select>
          </div>
          {editTable && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm((p) => ({ ...p, statut: e.target.value }))}
                className="input-field"
                disabled={fieldsDisabled}
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 sm:col-span-2 dark:bg-zinc-800/50">
            <button
              type="button"
              disabled={fieldsDisabled}
              onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                form.is_active ? 'bg-success' : 'bg-slate-300 dark:bg-zinc-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.is_active ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">Table active</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500">Désactiver pour retirer temporairement du service</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6 dark:border-zinc-800">
          <Button type="submit" loading={isSubmitting} disabled={!editTable && atTableLimit}>
            {editTable ? 'Enregistrer' : 'Ajouter la table'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
