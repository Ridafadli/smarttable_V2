export const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'serveur', label: 'Serveur' },
  { value: 'cuisinier', label: 'Cuisinier' },
];

export const ROLE_COLORS = {
  admin: 'text-red-600 bg-red-500/10 dark:text-red-400',
  manager: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400',
  serveur: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
  cuisinier: 'text-amber-600 bg-amber-500/10 dark:text-amber-400',
};

export const SORT_OPTIONS = [
  { value: 'name', label: 'Nom (A-Z)' },
  { value: 'recent', label: 'Plus récents' },
  { value: 'role', label: 'Par rôle' },
];

export const FILTER_OPTIONS = [
  { value: 'all', label: 'Tous les employés' },
  { value: 'admin', label: 'Admins' },
  { value: 'manager', label: 'Managers' },
  { value: 'serveur', label: 'Serveurs' },
  { value: 'cuisinier', label: 'Cuisiniers' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
];

export const EMPTY_FORM = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  role: 'serveur',
  permissions: [],
  use_custom_permissions: false,
  date_embauche: '',
  notes: '',
  is_active: true,
};

export const ACTION_LABELS = {
  created: 'Ajout',
  updated: 'Modification',
  deleted: 'Suppression',
  role_changed: 'Changement de rôle',
  permissions_changed: 'Permissions modifiées',
  activated: 'Réactivation',
  deactivated: 'Désactivation',
};

export function employeeToForm(employee) {
  if (!employee) return { ...EMPTY_FORM };
  return {
    nom: employee.nom || '',
    prenom: employee.prenom || '',
    email: employee.email || '',
    telephone: employee.telephone || '',
    role: employee.role || 'serveur',
    permissions: employee.permissions || [],
    use_custom_permissions: employee.use_custom_permissions ?? false,
    date_embauche: employee.date_embauche || '',
    notes: employee.notes || '',
    is_active: employee.is_active ?? true,
  };
}

export function getRoleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function getInitials(employee) {
  const name = employee?.nom_complet || `${employee?.prenom || ''} ${employee?.nom || ''}`.trim();
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function getDefaultPermissionsForRole(role, config) {
  const roleConfig = config?.roles?.find((r) => r.value === role);
  return roleConfig?.permissions ?? [];
}

export function formatActivityTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
