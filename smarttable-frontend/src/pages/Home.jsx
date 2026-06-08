import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  Play,
  QrCode,
  Sparkles,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import LandingFooter from '../components/landing/LandingFooter';
import LandingNavbar from '../components/landing/LandingNavbar';
import ScrollReveal from '../components/landing/ScrollReveal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: 'Gestion des Menus',
    description: 'Créez votre carte digitale, gérez les plats, prix, images et disponibilités en quelques clics.',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    icon: LayoutGrid,
    title: 'Gestion des Tables',
    description: 'Plan de salle interactif, statuts en temps réel et QR codes pour commandes à table.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: ClipboardList,
    title: 'Gestion des Commandes',
    description: 'Suivez chaque commande de la prise à la livraison avec un tableau de bord live.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: CalendarDays,
    title: 'Réservations',
    description: 'Calendrier intelligent, détection de conflits et synchronisation avec vos tables.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: BarChart3,
    title: 'Statistiques',
    description: 'KPIs, graphiques CA, plats populaires et exports PDF pour piloter votre activité.',
    color: 'from-amber-500 to-orange-600',
  },
];

const SHOWCASE = [
  {
    icon: QrCode,
    title: 'Commande par QR Code',
    description: 'Vos clients scannent et commandent directement depuis leur table, sans application.',
    stat: '−40% temps d\'attente',
  },
  {
    icon: Zap,
    title: 'Temps réel',
    description: 'Notifications instantanées pour nouvelles commandes, réservations et alertes stock.',
    stat: 'Mise à jour live',
  },
  {
    icon: Sparkles,
    title: 'Expérience premium',
    description: 'Interface SaaS moderne pensée pour les équipes en salle et en cuisine.',
    stat: '100% responsive',
  },
];

const TRUST = [
  'Setup en 5 minutes',
  'Multi-plans (Free, Pro, Enterprise)',
  'Support dédié restaurants',
  'Données sécurisées',
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handlePrimary = () => {
    if (isAuthenticated) navigate('/dashboard');
    else navigate('/login');
  };

  const scrollToFeatures = () => {
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-zinc-950">
      <LandingNavbar />

      {/* Hero */}
      <section id="accueil" className="relative overflow-hidden bg-[#0a0a0f] pt-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.35),transparent)]" />
        <div className="absolute inset-0 bg-mesh-dark opacity-50" />
        <div className="absolute left-1/2 top-32 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28">
          <ScrollReveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Plateforme SaaS pour restaurants
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <h1 className="max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              SmartTable
              <span className="mt-2 block bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
                Le système d&apos;exploitation de votre restaurant
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
              Digitalisez votre établissement avec menus QR, plan de salle interactif,
              commandes en temps réel et analytics — une seule plateforme, zéro complexité.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button size="lg" icon={ArrowRight} onClick={handlePrimary}>
                {isAuthenticated ? 'Accéder au Dashboard' : 'Se connecter'}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                icon={Play}
                onClick={scrollToFeatures}
                className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/15"
              >
                Découvrir
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={320}>
            <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2">
              {TRUST.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </ScrollReveal>

          {/* Dashboard preview mockup */}
          <ScrollReveal delay={400} className="mt-16">
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs text-zinc-500">app.smarttable.io/dashboard</span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-4 sm:p-6">
                  {['Commandes', 'Revenus', 'Tables', 'Réservations'].map((label, i) => (
                    <div key={label} className="rounded-xl border border-white/5 bg-white/5 p-4">
                      <p className="text-2xs text-zinc-500">{label}</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                        {[24, '12.4k', 8, 6][i]}
                        {i === 1 && <span className="text-sm font-normal text-zinc-500"> MAD</span>}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mx-4 mb-4 h-32 rounded-xl border border-white/5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 sm:mx-6" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Fonctionnalités
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Tout ce dont votre restaurant a besoin
            </h2>
            <p className="mt-4 text-slate-500 dark:text-zinc-400">
              Des outils professionnels réunis dans une interface unique, pensée pour la rapidité en service.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 80}>
                <article className="group surface-card surface-card-hover h-full p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg transition-transform duration-300 group-hover:scale-105`}>
                    <feature.icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase cards */}
      <section className="border-y border-slate-200/80 bg-slate-50/50 py-20 dark:border-zinc-800 dark:bg-zinc-900/30 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Pensé pour l&apos;excellence opérationnelle
            </h2>
            <p className="mt-4 text-slate-500 dark:text-zinc-400">
              Des cartes illustrées pour visualiser l&apos;impact de SmartTable au quotidien.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {SHOWCASE.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100}>
                <article className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
                  <div className="relative">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {item.stat}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="hero-banner text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Prêt à transformer votre restaurant ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-indigo-100/90">
                Rejoignez les établissements qui modernisent leur service avec SmartTable.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="!border-white/30 !bg-white !text-indigo-700 hover:!bg-indigo-50"
                  onClick={() => navigate('/register')}
                >
                  Commencer gratuitement
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="!text-white hover:!bg-white/10"
                  onClick={handlePrimary}
                >
                  {isAuthenticated ? 'Dashboard' : 'Se connecter'}
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
