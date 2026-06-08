import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const iconVariants = {
  default: 'bg-primary/5 text-primary',
  accent: 'bg-accent/10 text-accent',
  warning: 'bg-amber-50 text-amber-600',
  success: 'bg-emerald-50 text-emerald-600',
};

export default function StatsCard({
  title,
  value,
  icon,
  variant = 'default',
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-primary mt-1 tabular-nums">{value ?? '—'}</p>
        </div>
        {icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconVariants[variant] || iconVariants.default}`}
            aria-hidden
          >
            <FontAwesomeIcon icon={icon} className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
