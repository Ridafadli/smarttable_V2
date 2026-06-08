import { CheckCircle2, XCircle, PackageX } from 'lucide-react';

const config = {
  available: {
    label: 'Disponible',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
    Icon: CheckCircle2,
  },
  unavailable: {
    label: 'Indisponible',
    className: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    Icon: XCircle,
  },
  out_of_stock: {
    label: 'Rupture de stock',
    className: 'bg-red-50 text-red-800 ring-red-600/20',
    Icon: PackageX,
  },
};

export default function MenuStockBadge({ status }) {
  const { label, className, Icon } = config[status] || config.unavailable;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
