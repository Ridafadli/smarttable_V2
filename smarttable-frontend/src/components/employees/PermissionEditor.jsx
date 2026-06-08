import { getDefaultPermissionsForRole } from '../../lib/employeeUtils';

export default function PermissionEditor({ form, onChange, config }) {
  const groups = config?.permission_groups ?? [];
  const defaultPerms = getDefaultPermissionsForRole(form.role, config);
  const selected = form.use_custom_permissions ? form.permissions : defaultPerms;

  const toggleCustom = (enabled) => {
    if (enabled) {
      onChange({
        ...form,
        use_custom_permissions: true,
        permissions: [...defaultPerms],
      });
    } else {
      onChange({
        ...form,
        use_custom_permissions: false,
        permissions: [],
      });
    }
  };

  const togglePermission = (key) => {
    if (!form.use_custom_permissions) return;
    const next = selected.includes(key)
      ? selected.filter((p) => p !== key)
      : [...selected, key];
    onChange({ ...form, permissions: next });
  };

  const selectAll = () => {
    const all = groups.flatMap((g) => g.permissions.map((p) => p.key));
    onChange({ ...form, use_custom_permissions: true, permissions: all });
  };

  const resetToRole = () => {
    onChange({
      ...form,
      use_custom_permissions: false,
      permissions: [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={form.use_custom_permissions}
            onChange={(e) => toggleCustom(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Personnaliser les permissions
        </label>
        {form.use_custom_permissions && (
          <div className="flex gap-2">
            <button type="button" onClick={selectAll} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Tout sélectionner
            </button>
            <button type="button" onClick={resetToRole} className="text-xs font-medium text-slate-500 hover:underline dark:text-zinc-400">
              Réinitialiser au rôle
            </button>
          </div>
        )}
      </div>

      {!form.use_custom_permissions && (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-zinc-800/50 dark:text-zinc-400">
          Permissions par défaut du rôle <strong>{form.role}</strong> ({defaultPerms.length} accès).
        </p>
      )}

      <div className="max-h-64 space-y-4 overflow-y-auto rounded-xl border border-slate-200/80 p-3 dark:border-zinc-800">
        {groups.map((group) => (
          <div key={group.group}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
              {group.group}
            </p>
            <div className="space-y-1.5">
              {group.permissions.map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                    form.use_custom_permissions
                      ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                      : 'cursor-default opacity-80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    disabled={!form.use_custom_permissions}
                    onChange={() => togglePermission(key)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-slate-700 dark:text-zinc-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
