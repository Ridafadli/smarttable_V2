import { Link } from 'react-router-dom';
import { Crown, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const PLAN_RANK = { free: 0, pro: 1, enterprise: 2 };

const PLAN_PRICES = {
  pro: '200 MAD/mois',
  enterprise: '300 MAD/mois',
};

const PLAN_LABELS = {
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function hasPlan(current, required) {
  return (PLAN_RANK[current] ?? 0) >= (PLAN_RANK[required] ?? 0);
}

export default function PlanGate({ requiredPlan = 'pro', children, fallback = null }) {
  const { restaurant } = useAuthStore();
  const currentPlan = restaurant?.plan || 'free';

  if (hasPlan(currentPlan, requiredPlan)) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  const label = PLAN_LABELS[requiredPlan] || requiredPlan;
  const price = PLAN_PRICES[requiredPlan] || '';

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-glow">
          <Crown className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          Fonctionnalité {label}
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Passez au plan {label}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Cette fonctionnalité nécessite le plan {label}
          {price ? ` (${price})` : ''}. Débloquez des statistiques avancées, WhatsApp et bien plus.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/subscription"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" />
            Voir les offres
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Plan actuel : <span className="font-medium capitalize text-slate-600">{currentPlan}</span>
        </p>
      </div>
    </div>
  );
}
