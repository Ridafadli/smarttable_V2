import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminShell from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import useAuthStore from '../../store/authStore';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0 MAD',
    period: '/ mois',
    features: ['3 tables maximum', '10 commandes / jour', 'Menus & commandes', 'QR codes avec logo'],
    missing: ['WhatsApp admin', 'Statistiques avancées', 'Multi-admin'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '200 MAD',
    period: '/ mois',
    highlight: true,
    features: [
      'Tables & commandes illimitées',
      'Notifications WhatsApp',
      'Statistiques & exports',
      'QR codes avec logo',
      'Assistant IA (n8n)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '300 MAD',
    period: '/ mois',
    features: [
      'Tout le plan Pro',
      'Multi-admin & personnel',
      'Journal d\'activité équipe',
      'Support prioritaire',
    ],
  },
];

export default function Subscription() {
  const { restaurant } = useAuthStore();
  const current = restaurant?.plan || 'free';

  return (
    <AdminShell title="Abonnement">
      <PageHeader
        title="Abonnement SmartTable"
        subtitle="Choisissez le plan adapté à votre restaurant. Paiement en ligne bientôt disponible."
      />

      <p className="mb-6 text-sm text-slate-600 dark:text-zinc-400">
        Plan actuel :{' '}
        <Badge variant="violet" className="uppercase">
          {current}
        </Badge>
        {restaurant?.limits && (
          <span className="ml-2 text-slate-500">
            · {restaurant.orders_today ?? 0} commandes aujourd&apos;hui
            · {restaurant.tables_count ?? 0} tables
          </span>
        )}
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === current;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-primary bg-gradient-to-b from-primary/5 to-white shadow-glow ring-2 ring-primary/20 dark:from-primary/10 dark:to-zinc-900'
                  : 'border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                  Plan actuel
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-600 dark:text-zinc-400">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
                {plan.missing?.map((f) => (
                  <li key={f} className="flex items-start gap-2 opacity-50 line-through">
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && (
                <a
                  href="mailto:support@smarttable.ma?subject=Upgrade%20SmartTable"
                  className="mt-6 block rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary dark:border-zinc-700 dark:text-zinc-300"
                >
                  Contacter pour upgrader
                </a>
              )}
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Intégration Stripe / Paymob prévue pour paiement automatique.{' '}
        <Link to="/settings" className="text-primary hover:underline">
          Paramètres restaurant
        </Link>
      </p>
    </AdminShell>
  );
}
