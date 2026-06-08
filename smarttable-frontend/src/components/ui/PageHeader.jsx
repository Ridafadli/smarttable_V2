import { ChevronRight } from 'lucide-react';
import Badge from './Badge';

export default function PageHeader({ title, description, actions, badge, breadcrumb }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {(breadcrumb || badge) && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {breadcrumb && (
              <nav className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500">
                <span>SmartTable</span>
                <ChevronRight className="h-3 w-3 opacity-50" />
                <span className="font-medium text-slate-700 dark:text-zinc-300">{breadcrumb}</span>
              </nav>
            )}
            {badge && (typeof badge === 'string' ? <Badge variant="info">{badge}</Badge> : badge)}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[1.75rem]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
