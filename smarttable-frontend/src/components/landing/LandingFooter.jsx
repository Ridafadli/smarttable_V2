import { Link } from 'react-router-dom';
import { Mail, MapPin, UtensilsCrossed } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">SmartTable</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
              La plateforme SaaS tout-en-un pour moderniser votre restaurant : menus QR, plan de salle,
              commandes en temps réel et analytics professionnels.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Produit</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-zinc-400">
              <li><a href="#fonctionnalites" className="hover:text-indigo-600 dark:hover:text-indigo-400">Fonctionnalités</a></li>
              <li><Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400">Connexion</Link></li>
              <li><Link to="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400">Inscription</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-indigo-500" />
                contact@smarttable.app
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-indigo-500" />
                Casablanca, Maroc
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 sm:flex-row dark:border-zinc-800">
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            © {new Date().getFullYear()} SmartTable. Tous droits réservés.
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-600">
            Conçu pour les restaurants modernes
          </p>
        </div>
      </div>
    </footer>
  );
}
