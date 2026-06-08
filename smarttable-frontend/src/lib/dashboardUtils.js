/** Calcule la variation % entre aujourd'hui et hier à partir des stats journalières */
export function percentChange(daily, field = 'total_commandes') {
  if (!daily?.length) return null;

  const sorted = [...daily].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const today = sorted[sorted.length - 1];
  const yesterday = sorted[sorted.length - 2];

  if (!today || !yesterday) return null;

  const cur = Number(today[field]) || 0;
  const prev = Number(yesterday[field]) || 0;

  if (prev === 0) return cur > 0 ? 100 : 0;

  return Math.round(((cur - prev) / prev) * 100);
}

export function formatDateTimeFr(date = new Date()) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function greetingFr() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export function chartDateLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

export const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

export const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
};

export const STATUS_ACTION_LABELS = {
  confirmed: 'Confirmer',
  preparing: 'Préparer',
  ready: 'Marquer prête',
  delivered: 'Livrer',
};
