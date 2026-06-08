export const SORT_OPTIONS = [
  { value: 'name', label: 'Nom (A-Z)' },
  { value: 'recent', label: 'Plus récents' },
  { value: 'spent', label: 'Plus dépensé' },
];

export const FILTER_OPTIONS = [
  { value: 'all', label: 'Tous les clients' },
  { value: 'has_email', label: 'Avec email' },
  { value: 'has_orders', label: 'Avec commandes' },
  { value: 'has_reservations', label: 'Avec réservations' },
];

export const EMPTY_FORM = {
  nom_complet: '',
  telephone: '',
  email: '',
  adresse: '',
  notes: '',
};

export function clientToForm(client) {
  if (!client) return { ...EMPTY_FORM };
  return {
    nom_complet: client.nom_complet || '',
    telephone: client.telephone || '',
    email: client.email || '',
    adresse: client.adresse || '',
    notes: client.notes || '',
  };
}

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MAD`;
}

export function filterClients(clients, { search, filter }) {
  let list = [...(clients || [])];

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.nom_complet?.toLowerCase().includes(q)
        || c.telephone?.includes(q)
        || c.email?.toLowerCase().includes(q)
        || c.adresse?.toLowerCase().includes(q)
    );
  }

  if (filter === 'has_email') {
    list = list.filter((c) => c.email?.trim());
  } else if (filter === 'has_orders') {
    list = list.filter((c) => (c.commandes_count ?? 0) > 0);
  } else if (filter === 'has_reservations') {
    list = list.filter((c) => (c.reservations_count ?? 0) > 0);
  }

  return list;
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export const ORDER_STATUT_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Servie',
  cancelled: 'Annulée',
};

export const RESERVATION_STATUT_LABELS = {
  confirmee: 'Confirmée',
  en_attente: 'En attente',
  annulee: 'Annulée',
};
