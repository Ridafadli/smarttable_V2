import api from '../api/axios';
import { assetUrl } from './config';

export const TABLE_STATUTS = {
  disponible: {
    label: 'Disponible',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200/80',
    glow: 'shadow-emerald-100',
    header: 'from-emerald-500/10 to-emerald-50',
    floor: {
      bg: 'bg-emerald-500',
      ring: 'ring-emerald-400/80',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.45)]',
      fill: 'from-emerald-400 to-emerald-600',
      text: 'text-white',
    },
  },
  occupee: {
    label: 'Occupée',
    badge: 'bg-red-100 text-red-800 ring-red-200',
    dot: 'bg-red-500',
    border: 'border-red-200/80',
    glow: 'shadow-red-100',
    header: 'from-red-500/10 to-red-50',
    floor: {
      bg: 'bg-red-500',
      ring: 'ring-red-400/80',
      glow: 'shadow-[0_0_24px_rgba(239,68,68,0.5)]',
      fill: 'from-red-400 to-red-600',
      text: 'text-white',
      pulse: true,
    },
  },
  reservee: {
    label: 'Réservée',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
    border: 'border-amber-200/80',
    glow: 'shadow-amber-100',
    header: 'from-amber-500/10 to-amber-50',
    floor: {
      bg: 'bg-amber-500',
      ring: 'ring-amber-400/80',
      glow: 'shadow-[0_0_18px_rgba(245,158,11,0.4)]',
      fill: 'from-amber-400 to-amber-600',
      text: 'text-white',
    },
  },
  nettoyage: {
    label: 'En nettoyage',
    badge: 'bg-sky-100 text-sky-800 ring-sky-200',
    dot: 'bg-sky-500',
    border: 'border-sky-200/80',
    glow: 'shadow-sky-100',
    header: 'from-sky-500/10 to-sky-50',
    floor: {
      bg: 'bg-sky-500',
      ring: 'ring-sky-400/80',
      glow: 'shadow-[0_0_18px_rgba(14,165,233,0.4)]',
      fill: 'from-sky-400 to-sky-600',
      text: 'text-white',
    },
  },
};

export const FLOOR_LEGEND = [
  { key: 'disponible', label: 'Disponible' },
  { key: 'occupee', label: 'Occupée' },
  { key: 'reservee', label: 'Réservée' },
  { key: 'nettoyage', label: 'En nettoyage' },
];

export function clampPosition(value) {
  return Math.round(Math.max(4, Math.min(96, value)));
}

export function getTableDimensions(capacite = 4) {
  const cap = capacite || 4;
  if (cap <= 2) return { width: 52, height: 52, shape: 'round' };
  if (cap <= 4) return { width: 64, height: 64, shape: 'round' };
  if (cap <= 6) return { width: 80, height: 56, shape: 'rect' };
  return { width: 96, height: 64, shape: 'rect' };
}

export const CAPACITY_OPTIONS = [2, 4, 6, 8, 10, 12];

export const STATUT_FILTERS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'disponible', label: 'Disponibles' },
  { value: 'occupee', label: 'Occupées' },
  { value: 'reservee', label: 'Réservées' },
  { value: 'nettoyage', label: 'En nettoyage' },
];

export function getEffectiveStatut(table) {
  return table?.effective_statut || table?.statut || 'disponible';
}

export function getStatutConfig(table) {
  const key = getEffectiveStatut(table);
  return TABLE_STATUTS[key] || TABLE_STATUTS.disponible;
}

export function qrImageUrl(table) {
  if (!table?.qr_code_url) return null;
  return assetUrl(table.qr_code_url);
}

export async function downloadQrCode(table) {
  const { data } = await api.get(`/tables/${table.id}/qrcode/download`, {
    responseType: 'blob',
  });
  const ext = table.qr_code_url?.endsWith('.svg') ? 'svg' : 'png';
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `table_${table.numero_table}_qrcode.${ext}`;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatOccupationDuration(isoDate) {
  if (!isoDate) return null;
  const start = new Date(isoDate);
  if (Number.isNaN(start.getTime())) return null;

  const diffMs = Date.now() - start.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `${days} j ${hours % 24} h`;
}

export function filterTables(tables, { search = '', statut = 'all' }) {
  let list = tables || [];
  const q = search.trim().toLowerCase();

  if (q) {
    list = list.filter(
      (t) =>
        String(t.numero_table).includes(q)
        || (t.nom || '').toLowerCase().includes(q)
    );
  }

  if (statut !== 'all') {
    list = list.filter((t) => getEffectiveStatut(t) === statut);
  }

  return list;
}

export function computeTableStats(tables) {
  const list = tables || [];
  const counts = { total: list.length, disponible: 0, occupee: 0, reservee: 0, nettoyage: 0 };

  list.forEach((t) => {
    const s = getEffectiveStatut(t);
    if (counts[s] !== undefined) counts[s] += 1;
  });

  return counts;
}

export function openQrPrintWindow(table) {
  const src = qrImageUrl(table);
  if (!src) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>QR Code – Table ${table.numero_table}</title>
        <style>
          body { display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui,sans-serif; }
          .container { text-align:center;padding:40px;border:2px solid #1E3A5F;border-radius:16px;max-width:400px; }
          h1 { color:#1E3A5F;font-size:28px;margin-bottom:8px; }
          p { color:#666;font-size:16px;margin-bottom:24px; }
          img { width:300px;height:300px; }
          .footer { margin-top:16px;font-size:13px;color:#999; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>SmartTable</h1>
          <p>Table N° ${table.numero_table}${table.nom ? ' – ' + table.nom : ''}</p>
          <img src="${src}" alt="QR Code" />
          <div class="footer">Scannez pour commander</div>
        </div>
        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
