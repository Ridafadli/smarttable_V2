import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Button from '../ui/Button';
import Input from '../ui/Input';

const STATUT_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'annulee', label: 'Annulée' },
];

export default function ReservationForm({
  open,
  form,
  onChange,
  onSubmit,
  onClose,
  loading,
  tables = [],
  editId,
  conflict,
}) {
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [localConflict, setLocalConflict] = useState(null);

  useEffect(() => {
    setLocalConflict(conflict || null);
  }, [conflict]);

  useEffect(() => {
    if (!open) setLocalConflict(null);
  }, [open]);

  useEffect(() => {
    const { table_restaurant_id, date_reservation, heure_reservation } = form;
    if (!open || !table_restaurant_id || !date_reservation || !heure_reservation) {
      setLocalConflict(null);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setCheckingConflict(true);
      try {
        const { data } = await api.post('/reservations/check-conflicts', {
          table_restaurant_id: Number(table_restaurant_id),
          date_reservation,
          heure_reservation,
          exclude_id: editId || undefined,
        });
        setLocalConflict(data.has_conflict ? data.conflict : null);
      } catch {
        setLocalConflict(null);
      } finally {
        setCheckingConflict(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [open, form.table_restaurant_id, form.date_reservation, form.heure_reservation, editId]);

  if (!open) return null;

  const selectedTable = tables.find((t) => String(t.id) === String(form.table_restaurant_id));
  const capacityWarning = selectedTable && form.nombre_personnes > selectedTable.capacite;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl glass-strong p-5 shadow-card-hover sm:rounded-2xl sm:p-6 dark:shadow-dark-card">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editId ? 'Modifier la réservation' : 'Nouvelle réservation'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              {editId ? 'Mettez à jour les informations du client.' : 'Planifiez une table pour vos clients.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon !p-2" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {(localConflict || capacityWarning) && (
          <div className="mb-4 space-y-2">
            {localConflict && (
              <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Conflit détecté sur cette table</p>
                  <p className="mt-1 text-xs opacity-90">
                    {localConflict.client_nom} — {localConflict.heure_reservation?.slice(0, 5)} ({localConflict.statut})
                  </p>
                </div>
              </div>
            )}
            {capacityWarning && (
              <div className="flex gap-3 rounded-xl border border-red-200/80 bg-red-50/80 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  Capacité max. {selectedTable.capacite} personnes pour cette table.
                </p>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nom du client *"
              value={form.client_nom}
              onChange={(e) => onChange({ ...form, client_nom: e.target.value })}
              required
              placeholder="Ex. Ahmed Benali"
            />
            <Input
              label="Téléphone *"
              type="tel"
              value={form.client_telephone}
              onChange={(e) => onChange({ ...form, client_telephone: e.target.value })}
              required
              placeholder="+212 6XX XXX XXX"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date *"
              type="date"
              value={form.date_reservation}
              onChange={(e) => onChange({ ...form, date_reservation: e.target.value })}
              required
            />
            <Input
              label="Heure *"
              type="time"
              value={form.heure_reservation}
              onChange={(e) => onChange({ ...form, heure_reservation: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre de personnes *"
              type="number"
              min={1}
              max={50}
              value={form.nombre_personnes}
              onChange={(e) => onChange({ ...form, nombre_personnes: Number(e.target.value) })}
              required
            />
            <div>
              <label htmlFor="table-select" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Table *
              </label>
              <select
                id="table-select"
                className="input-field"
                value={form.table_restaurant_id}
                onChange={(e) => onChange({ ...form, table_restaurant_id: e.target.value })}
                required
              >
                <option value="">Choisir une table</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.numero_table}{t.nom ? ` — ${t.nom}` : ''} ({t.capacite} pers.)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="statut-select" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Statut *
            </label>
            <select
              id="statut-select"
              className="input-field"
              value={form.statut}
              onChange={(e) => onChange({ ...form, statut: e.target.value })}
            >
              {STATUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              rows={3}
              className="input-field resize-none"
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              placeholder="Allergies, occasion spéciale…"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-4 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!!localConflict || capacityWarning || checkingConflict}
            >
              {editId ? 'Enregistrer' : 'Créer la réservation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
