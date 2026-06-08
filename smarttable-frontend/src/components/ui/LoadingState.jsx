import Spinner from './Spinner';

export default function LoadingState({ message = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500" role="status" aria-live="polite">
      <Spinner className="h-8 w-8 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
