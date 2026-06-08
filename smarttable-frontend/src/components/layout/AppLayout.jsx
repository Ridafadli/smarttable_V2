import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Contact,
  FileText,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Map,
  Menu,
  Moon,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sun,
  UserCog,
  UtensilsCrossed,
  Settings,
  CreditCard,
  X,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationProvider';
import Badge from '../ui/Badge';

const NAV_GROUPS = [
  {
    label: 'Vue d\'ensemble',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'D' },
      { path: '/statistics', label: 'Statistiques', icon: BarChart3, shortcut: 'S' },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { path: '/orders', label: 'Commandes', icon: ClipboardList, shortcut: 'C' },
      { path: '/tables', label: 'Tables', icon: LayoutGrid, shortcut: 'T' },
      { path: '/floor-plan', label: 'Plan salle', icon: Map, shortcut: 'P' },
      { path: '/reservations', label: 'Réservations', icon: CalendarDays, shortcut: 'R' },
    ],
  },
  {
    label: 'Carte & stock',
    items: [
      { path: '/menus', label: 'Menus', icon: UtensilsCrossed, shortcut: 'M' },
      { path: '/stock', label: 'Stock', icon: Package, shortcut: 'K' },
    ],
  },
  {
    label: 'Business',
    items: [
      { path: '/clients', label: 'Clients', icon: Contact, shortcut: 'L' },
      { path: '/invoices', label: 'Facturation', icon: FileText, shortcut: 'F' },
      { path: '/employees', label: 'Personnel', icon: UserCog, shortcut: 'E' },
    ],
  },
  {
    label: 'Compte',
    items: [
      { path: '/settings', label: 'Paramètres', icon: Settings, shortcut: 'G' },
      { path: '/subscription', label: 'Abonnement', icon: CreditCard, shortcut: 'B' },
    ],
  },
];

const QUICK_ACTIONS = [
  { label: 'Nouveau plat', path: '/menus', icon: Plus },
  { label: 'Commandes', path: '/orders', icon: ClipboardList },
  { label: 'Plan salle', path: '/floor-plan', icon: Map },
];

function isActive(pathname, path) {
  if (path === '/') return pathname === '/';
  return pathname.startsWith(path);
}

export default function AppLayout({ children, onRefresh, title }) {
  const { restaurant, logout } = useAuthStore();
  const { toggleTheme, isDark } = useTheme();
  const { unreadCount, toggleCenter } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const allNavItems = NAV_GROUPS.flatMap((g) => g.items);
  const currentNav = allNavItems.find((n) => isActive(location.pathname, n.path));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      {/* Header — fixed top */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/70 px-4 dark:border-zinc-800/80">
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
          title="Retour à l'accueil"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-glow-sm">
            <UtensilsCrossed className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">SmartTable</p>
            <p className="truncate text-2xs text-slate-500 dark:text-zinc-500">Restaurant OS</p>
          </div>
        </Link>
        <button type="button" onClick={() => setSidebarOpen(false)} className="btn-icon !p-2 lg:hidden" aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Home link — fixed below header */}
      <div className="shrink-0 px-3 pb-1 pt-2">
        <Link
          to="/"
          className="nav-item text-xs !py-1.5"
          onClick={() => setSidebarOpen(false)}
        >
          <Home className="h-4 w-4 shrink-0 text-slate-400" />
          Retour à l&apos;accueil
        </Link>
      </div>

      {/* Navigation — scrollable middle */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4 last:mb-2">
            <p className="mb-1.5 px-2.5 text-2xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
              {group.label}
            </p>
            <nav className="space-y-0.5">
              {group.items.map(({ path, label, icon: Icon, shortcut }) => {
                const active = isActive(location.pathname, path);
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => {
                      navigate(path);
                      setSidebarOpen(false);
                    }}
                    className={`nav-item ${active ? 'nav-item-active' : ''}`}
                  >
                    <Icon
                      className={`h-[17px] w-[17px] shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`}
                      strokeWidth={active ? 2.25 : 2}
                    />
                    <span className="flex-1 text-left">{label}</span>
                    <kbd className="hidden rounded border border-slate-200/80 bg-slate-50 px-1 py-0.5 text-2xs font-medium text-slate-400 lg:inline dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600">
                      {shortcut}
                    </kbd>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer — always pinned to bottom */}
      <div className="shrink-0 border-t border-slate-200/70 bg-white/95 p-3 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95">
        <div className="mb-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-zinc-100">
              {restaurant?.nom || 'Mon restaurant'}
            </p>
            {restaurant?.plan && (
              <Badge variant="violet" className="!px-1.5 !py-0 !text-2xs uppercase">
                {restaurant.plan}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-2xs text-slate-500 dark:text-zinc-500">{restaurant?.email}</p>
        </div>

        <div className="mb-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-zinc-700" />

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:border-red-200/80 hover:bg-red-50 hover:shadow-sm active:scale-[0.98] dark:text-red-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 transition-colors group-hover:bg-red-500/15 dark:text-red-400">
            <LogOut className="h-4 w-4" strokeWidth={2} />
          </span>
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh app-mesh">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[260px] min-h-0 flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur-xl transition-transform duration-300 ease-out dark:border-zinc-800/80 dark:bg-zinc-950/95 lg:sticky lg:top-0 lg:h-dvh lg:shrink-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-[3.75rem] sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden min-w-0 items-center gap-1.5 text-sm text-slate-500 sm:flex dark:text-zinc-500">
                <span>SmartTable</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <span className="truncate font-medium text-slate-800 dark:text-zinc-200">
                  {title || currentNav?.label || 'Dashboard'}
                </span>
              </div>
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:hidden dark:text-white">
                {title || currentNav?.label}
              </h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="hidden items-center gap-1.5 md:flex">
                {QUICK_ACTIONS.map(({ label, path, icon: Icon }) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => navigate(path)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">{label}</span>
                  </button>
                ))}
              </div>

              {onRefresh && (
                <button type="button" onClick={onRefresh} className="btn-icon" title="Actualiser">
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}

              <button type="button" className="btn-icon hidden sm:inline-flex" title="Rechercher">
                <Search className="h-4 w-4" />
              </button>

              <button type="button" onClick={toggleCenter} className="btn-icon relative" title="Notifications">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-2xs font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <button type="button" onClick={toggleTheme} className="btn-icon" title={isDark ? 'Mode clair' : 'Mode sombre'}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <div className="relative ml-0.5">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white py-1 pl-1 pr-2 shadow-xs transition-all hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-2xs font-bold text-white">
                    {(restaurant?.nom || 'R').charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-label="Fermer" />
                    <div className="absolute right-0 z-50 mt-2 w-56 animate-scale-in rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-card-hover dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="border-b border-slate-100 px-3 py-2.5 dark:border-zinc-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{restaurant?.nom}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">{restaurant?.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Settings className="h-4 w-4" />
                        Paramètres
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 page-enter">
          <div className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
