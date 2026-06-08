import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { UNITE_OPTIONS } from '../../lib/stockUtils';

export default function IngredientForm({ open, form, onChange, onSubmit, onClose, loading, editId }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl glass-strong p-5 sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editId ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn-icon !p-2"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <Input label="Nom *" value={form.nom} onChange={(e) => onChange({ ...form, nom: e.target.value })} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="unite" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">Unité *</label>
              <select id="unite" className="input-field" value={form.unite} onChange={(e) => onChange({ ...form, unite: e.target.value })}>
                {UNITE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Input label="Catégorie" value={form.categorie} onChange={(e) => onChange({ ...form, categorie: e.target.value })} placeholder="Viandes, Légumes…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Quantité disponible *" type="number" min={0} step="0.001" value={form.quantite_disponible} onChange={(e) => onChange({ ...form, quantite_disponible: e.target.value })} required />
            <Input label="Quantité minimale *" type="number" min={0} step="0.001" value={form.quantite_minimale} onChange={(e) => onChange({ ...form, quantite_minimale: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">Notes</label>
            <textarea id="notes" rows={2} className="input-field resize-none" value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" loading={loading}>{editId ? 'Enregistrer' : 'Ajouter'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
