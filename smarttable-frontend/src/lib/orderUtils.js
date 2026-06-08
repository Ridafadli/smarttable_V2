export const ORDER_STATUTS = {
  pending: {
    label: 'En attente',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmée',
    badge: 'bg-blue-100 text-blue-800 ring-blue-200',
    dot: 'bg-blue-500',
  },
  preparing: {
    label: 'En préparation',
    badge: 'bg-orange-100 text-orange-800 ring-orange-200',
    dot: 'bg-orange-500',
  },
  ready: {
    label: 'Prête',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  delivered: {
    label: 'Servie',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-500',
  },
  cancelled: {
    label: 'Annulée',
    badge: 'bg-red-100 text-red-800 ring-red-200',
    dot: 'bg-red-500',
  },
};

export const STATUT_FILTERS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'ready', label: 'Prêtes' },
  { value: 'delivered', label: 'Servies' },
  { value: 'cancelled', label: 'Annulées' },
];

export const SORT_OPTIONS = [
  { value: 'latest', label: 'Plus récentes' },
  { value: 'oldest', label: 'Plus anciennes' },
  { value: 'amount', label: 'Montant décroissant' },
  { value: 'statut', label: 'Par statut' },
];

const STATUT_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

export const NEXT_STATUT = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
};

export function getStatutConfig(statut) {
  return ORDER_STATUTS[statut] || ORDER_STATUTS.pending;
}

export function mergeStatut(a, b) {
  if (a === 'cancelled' || b === 'cancelled') return 'cancelled';
  const ia = STATUT_ORDER.indexOf(a);
  const ib = STATUT_ORDER.indexOf(b);
  return STATUT_ORDER[Math.min(ia >= 0 ? ia : 0, ib >= 0 ? ib : 0)];
}

export function groupOrderLines(lines) {
  const map = new Map();

  (lines || []).forEach((line) => {
    const key = line.session_id || `solo-${line.id}`;
    if (!map.has(key)) {
      map.set(key, {
        groupKey: key,
        session_id: line.session_id,
        table: line.table,
        table_id: line.table_id,
        lines: [],
        statut: line.statut,
        created_at: line.created_at,
        total: 0,
        lineIds: [],
      });
    }
    const group = map.get(key);
    group.lines.push(line);
    group.lineIds.push(line.id);
    group.total += Number(line.total) || 0;
    group.statut = mergeStatut(group.statut, line.statut);
    if (new Date(line.created_at) < new Date(group.created_at)) {
      group.created_at = line.created_at;
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

export function getOrderNumber(group) {
  if (group.session_id) {
    return `#${group.session_id.slice(0, 8).toUpperCase()}`;
  }
  return `#${group.lines[0]?.id ?? '—'}`;
}

export function getClientLabel(group) {
  if (group.session_id) {
    return `Session ${group.session_id.slice(0, 8)}…`;
  }
  const tableNum = group.table?.numero_table;
  return tableNum ? `Client table ${tableNum}` : 'Client invité';
}

export function formatMoney(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function filterOrderGroups(groups, { clientSearch = '' }) {
  const q = clientSearch.trim().toLowerCase();
  if (!q) return groups;
  return groups.filter((g) => {
    const client = getClientLabel(g).toLowerCase();
    const num = getOrderNumber(g).toLowerCase();
    const table = String(g.table?.numero_table ?? '');
    return client.includes(q) || num.includes(q) || table.includes(q);
  });
}

export function openOrderPrintWindow(group, restaurantName = 'SmartTable') {
  const rows = group.lines
    .map(
      (l) => `
      <tr>
        <td>${l.menu?.nom_plat || 'Plat'}</td>
        <td style="text-align:center">${l.quantite}</td>
        <td style="text-align:right">${formatMoney(l.total)}</td>
      </tr>`
    )
    .join('');

  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Commande ${getOrderNumber(group)}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 32px; color: #1e293b; }
      h1 { font-size: 22px; margin: 0 0 4px; color: #1E3A5F; }
      .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; }
      th { font-size: 12px; text-transform: uppercase; color: #64748b; }
      .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 16px; }
      @media print { body { padding: 16px; } }
    </style></head><body>
      <h1>${restaurantName}</h1>
      <div class="meta">
        Commande ${getOrderNumber(group)} · Table #${group.table?.numero_table ?? '—'}<br>
        ${formatDateTime(group.created_at)} · ${getStatutConfig(group.statut).label}
      </div>
      <table>
        <thead><tr><th>Article</th><th>Qté</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="total">Total : ${formatMoney(group.total)}</p>
      <script>window.onload=function(){window.print();}</script>
    </body></html>
  `);
  win.document.close();
}

export function openOrderInvoicePdf(group, restaurantName = 'SmartTable') {
  openOrderPrintWindow(group, restaurantName);
}
