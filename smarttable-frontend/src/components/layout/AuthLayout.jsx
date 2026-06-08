import { Link } from 'react-router-dom';
import { Sparkles, UtensilsCrossed } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-[#fafbfc] dark:bg-zinc-950">
      <div className="relative hidden w-[52%] overflow-hidden bg-[#0a0a0f] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
        <div className="absolute inset-0 bg-mesh-dark opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">SmartTable</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg px-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Plateforme SaaS premium
          </div>
          <h2 className="text-3xl font-bold leading-[1.15] tracking-tight text-white text-balance">
            Le système d&apos;exploitation de votre restaurant
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            Menus, plan de salle, commandes en temps réel, facturation et analytics — conçu pour les établissements exigeants.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {['QR & commandes', 'Plan interactif', 'Analytics Pro'].map((f) => (
              <div key={f} className="rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-xs font-medium text-zinc-300 backdrop-blur">
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 p-10 text-xs text-zinc-600">© SmartTable · Conçu pour les restaurants modernes</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[48%] lg:px-16">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <Link to="/login" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-glow-sm">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">SmartTable</span>
            </Link>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
