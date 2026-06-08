import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function ClientForm({ open, form, onChange, onSubmit, onClose, loading, editId }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl glass-strong p-5 shadow-card-hover sm:rounded-2xl sm:p-6 dark:shadow-dark-card">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editId ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              {editId ? 'Mettez à jour les informations du client.' : 'Ajoutez un client à votre base de données.'}
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
          <Input
            label="Nom complet *"
            value={form.nom_complet}
            onChange={(e) => onChange({ ...form, nom_complet: e.target.value })}
            required
            placeholder="Ex. Ahmed Benali"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Téléphone *"
              type="tel"
              value={form.telephone}
              onChange={(e) => onChange({ ...form, telephone: e.target.value })}
              required
              placeholder="+212 6XX XXX XXX"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              placeholder="client@email.com"
            />
          </div>

          <Input
            label="Adresse"
            value={form.adresse}
            onChange={(e) => onChange({ ...form, adresse: e.target.value })}
            placeholder="Ville, quartier, rue…"
          />

          <div>
            <label htmlFor="client-notes" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Notes (optionnel)
            </label>
            <textarea
              id="client-notes"
              rows={3}
              className="input-field resize-none"
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              placeholder="Préférences, allergies…"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              {editId ? 'Enregistrer' : 'Ajouter le client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
