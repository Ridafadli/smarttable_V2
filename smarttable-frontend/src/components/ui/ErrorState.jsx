import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export default function ErrorState({ title = 'Erreur de chargement', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" role="alert">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <ExclamationTriangleIcon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
