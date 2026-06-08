export const STATUT_CONFIG = {
  confirmee: {
    label: 'Confirmée',
    className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  en_attente: {
    label: 'En attente',
    className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  annulee: {
    label: 'Annulée',
    className: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-400',
    dot: 'bg-red-400',
  },
};

export const STATUT_FILTERS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'confirmee', label: 'Confirmées' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'annulee', label: 'Annulées' },
];

export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '—';
  return timeStr.slice(0, 5);
}

export function formatTableLabel(table) {
  if (!table) return '—';
  const num = table.numero_table ?? table.id;
  return table.nom ? `Table ${num} — ${table.nom}` : `Table ${num}`;
}

export function getStatutConfig(statut) {
  return STATUT_CONFIG[statut] ?? STATUT_CONFIG.en_attente;
}

export function filterReservations(reservations, { search, statut, date, tableId }) {
  let list = [...(reservations || [])];

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.client_nom?.toLowerCase().includes(q)
        || r.client_telephone?.includes(q)
        || r.notes?.toLowerCase().includes(q)
        || formatTableLabel(r.table).toLowerCase().includes(q)
    );
  }

  if (statut && statut !== 'all') {
    list = list.filter((r) => r.statut === statut);
  }

  if (date) {
    list = list.filter((r) => r.date_reservation === date);
  }

  if (tableId && tableId !== 'all') {
    list = list.filter((r) => String(r.table_restaurant_id) === String(tableId));
  }

  return list;
}

export function groupReservationsByDate(reservations) {
  return (reservations || []).reduce((acc, r) => {
    const key = r.date_reservation;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
}

export function buildCalendarDays(year, month) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const daysInMonth = last.getDate();

  let startOffset = first.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ day: null, date: null });
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, date: `${year}-${mm}-${dd}` });
  }

  return cells;
}

export function isToday(dateStr) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return dateStr === `${y}-${m}-${d}`;
}

export function isPastDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  return d < today;
}

export const EMPTY_FORM = {
  client_nom: '',
  client_telephone: '',
  date_reservation: '',
  heure_reservation: '19:00',
  nombre_personnes: 2,
  table_restaurant_id: '',
  statut: 'en_attente',
  notes: '',
};

export function reservationToForm(reservation) {
  if (!reservation) return { ...EMPTY_FORM };
  return {
    client_nom: reservation.client_nom || '',
    client_telephone: reservation.client_telephone || '',
    date_reservation: reservation.date_reservation || '',
    heure_reservation: formatTime(reservation.heure_reservation),
    nombre_personnes: reservation.nombre_personnes || 2,
    table_restaurant_id: String(reservation.table_restaurant_id || ''),
    statut: reservation.statut || 'en_attente',
    notes: reservation.notes || '',
  };
}
