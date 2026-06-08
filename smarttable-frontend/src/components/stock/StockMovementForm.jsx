import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatQuantity } from '../../lib/stockUtils';

export default function StockMovementForm({ open, ingredient, type, onSubmit, onClose, loading }) {
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');

  useEffect(() => {
    if (open) {
      setQuantite('');
      setMotif('');
    }
  }, [open, ingredient?.id, type]);

  if (!open || !ingredient) return null;

  const isEntry = type === 'entree';

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative w-full max-w-md rounded-t-3xl glass-strong p-5 sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isEntry ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'}`}>
              {isEntry ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">{isEntry ? 'Entrée de stock' : 'Sortie de stock'}</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {ingredient.nom} — actuel: {formatQuantity(ingredient.quantite_disponible, ingredient.unite)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon !p-2"><X className="h-4 w-4" /></button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ quantite: Number(quantite), motif: motif.trim() || null });
          }}
          className="space-y-4"
        >
          <Input label="Quantité *" type="number" min={0.001} step="0.001" value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
          <Input label="Motif (optionnel)" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder={isEntry ? 'Réapprovisionnement…' : 'Perte, usage interne…'} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" loading={loading} variant={isEntry ? 'success' : 'primary'}>
              Confirmer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
