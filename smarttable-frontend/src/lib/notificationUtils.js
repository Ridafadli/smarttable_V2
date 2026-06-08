import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Package,
} from 'lucide-react';

export const NOTIFICATION_CONFIG = {
  nouvelle_commande: {
    label: 'Commande',
    icon: ClipboardList,
    color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400',
    toastType: 'info',
  },
  nouvelle_reservation: {
    label: 'Réservation',
    icon: CalendarDays,
    color: 'text-violet-600 bg-violet-500/10 dark:text-violet-400',
    toastType: 'info',
  },
  stock_faible: {
    label: 'Stock',
    icon: Package,
    color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400',
    toastType: 'warning',
  },
  reservation_annulee: {
    label: 'Annulation',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-500/10 dark:text-red-400',
    toastType: 'warning',
  },
};

export function getNotificationConfig(type) {
  return NOTIFICATION_CONFIG[type] ?? NOTIFICATION_CONFIG.nouvelle_commande;
}

export function formatNotificationTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffMin < 1440) return `Il y a ${Math.floor(diffMin / 60)} h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
