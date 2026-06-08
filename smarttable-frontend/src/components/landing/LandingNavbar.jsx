import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, UtensilsCrossed, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../ui/Button';

const LINKS = [
  { href: '#accueil', label: 'Accueil' },
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#contact', label: 'Contact' },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const scrollTo = (href) => {
    setOpen(false);
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow-sm">
            <UtensilsCrossed className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <span className="text-base font-bold tracking-tight text-white">SmartTable</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map(({ href, label }) => (
            <button
              key={href}
              type="button"
              onClick={() => scrollTo(href)}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button variant="accent" size="sm" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                Connexion
              </Link>
              <Button variant="accent" size="sm" onClick={() => navigate('/register')}>
                Essai gratuit
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0a0a0f]/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map(({ href, label }) => (
              <button
                key={href}
                type="button"
                onClick={() => scrollTo(href)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-300 hover:bg-white/5"
              >
                {label}
              </button>
            ))}
            <hr className="my-2 border-white/10" />
            {isAuthenticated ? (
              <Button className="w-full" onClick={() => { setOpen(false); navigate('/dashboard'); }}>
                Dashboard
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  Connexion
                </Link>
                <Button className="mt-2 w-full" onClick={() => { setOpen(false); navigate('/register'); }}>
                  Essai gratuit
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
