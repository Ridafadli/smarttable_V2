<?php

namespace App\Services;

class EmployeePermissionService
{
    public const ROLES = ['admin', 'manager', 'serveur', 'cuisinier'];

    public const PERMISSION_LABELS = [
        'dashboard.view'       => 'Tableau de bord',
        'menus.view'           => 'Consulter les menus',
        'menus.manage'         => 'Gérer les menus',
        'tables.view'          => 'Consulter les tables',
        'tables.manage'        => 'Gérer les tables',
        'reservations.view'    => 'Consulter les réservations',
        'reservations.manage'  => 'Gérer les réservations',
        'clients.view'         => 'Consulter les clients',
        'clients.manage'       => 'Gérer les clients',
        'invoices.view'        => 'Consulter la facturation',
        'invoices.manage'      => 'Gérer la facturation',
        'stock.view'           => 'Consulter le stock',
        'stock.manage'         => 'Gérer le stock',
        'orders.view'          => 'Consulter les commandes',
        'orders.manage'        => 'Gérer les commandes',
        'statistics.view'      => 'Consulter les statistiques',
        'employees.view'       => 'Consulter le personnel',
        'employees.manage'     => 'Gérer le personnel',
    ];

    public const ROLE_LABELS = [
        'admin'     => 'Admin',
        'manager'   => 'Manager',
        'serveur'   => 'Serveur',
        'cuisinier' => 'Cuisinier',
    ];

    private const ALL_PERMISSIONS = [
        'dashboard.view',
        'menus.view', 'menus.manage',
        'tables.view', 'tables.manage',
        'reservations.view', 'reservations.manage',
        'clients.view', 'clients.manage',
        'invoices.view', 'invoices.manage',
        'stock.view', 'stock.manage',
        'orders.view', 'orders.manage',
        'statistics.view',
        'employees.view', 'employees.manage',
    ];

    private const ROLE_DEFAULTS = [
        'admin' => self::ALL_PERMISSIONS,
        'manager' => [
            'dashboard.view',
            'menus.view', 'menus.manage',
            'tables.view', 'tables.manage',
            'reservations.view', 'reservations.manage',
            'clients.view', 'clients.manage',
            'invoices.view', 'invoices.manage',
            'stock.view', 'stock.manage',
            'orders.view', 'orders.manage',
            'statistics.view',
            'employees.view',
        ],
        'serveur' => [
            'dashboard.view',
            'orders.view', 'orders.manage',
            'tables.view',
            'reservations.view',
            'clients.view',
        ],
        'cuisinier' => [
            'dashboard.view',
            'orders.view', 'orders.manage',
            'stock.view',
        ],
    ];

    public function allPermissionKeys(): array
    {
        return self::ALL_PERMISSIONS;
    }

    public function roleDefaults(string $role): array
    {
        return self::ROLE_DEFAULTS[$role] ?? self::ROLE_DEFAULTS['serveur'];
    }

    public function effectivePermissions(string $role, ?array $customPermissions): array
    {
        if (is_array($customPermissions) && count($customPermissions) > 0) {
            return array_values(array_intersect($customPermissions, self::ALL_PERMISSIONS));
        }

        return $this->roleDefaults($role);
    }

    public function hasPermission(string $role, ?array $customPermissions, string $permission): bool
    {
        return in_array($permission, $this->effectivePermissions($role, $customPermissions), true);
    }

    public function configForFrontend(): array
    {
        $groups = [
            'Général'       => ['dashboard.view'],
            'Menus'         => ['menus.view', 'menus.manage'],
            'Tables'        => ['tables.view', 'tables.manage'],
            'Réservations'  => ['reservations.view', 'reservations.manage'],
            'Clients'       => ['clients.view', 'clients.manage'],
            'Facturation'   => ['invoices.view', 'invoices.manage'],
            'Stock'         => ['stock.view', 'stock.manage'],
            'Commandes'     => ['orders.view', 'orders.manage'],
            'Statistiques'  => ['statistics.view'],
            'Personnel'     => ['employees.view', 'employees.manage'],
        ];

        $permissionGroups = [];
        foreach ($groups as $group => $keys) {
            $permissionGroups[] = [
                'group'       => $group,
                'permissions' => array_map(fn ($key) => [
                    'key'   => $key,
                    'label' => self::PERMISSION_LABELS[$key] ?? $key,
                ], $keys),
            ];
        }

        $roles = [];
        foreach (self::ROLES as $role) {
            $roles[] = [
                'value'       => $role,
                'label'       => self::ROLE_LABELS[$role],
                'permissions' => $this->roleDefaults($role),
            ];
        }

        return [
            'roles'             => $roles,
            'permission_groups' => $permissionGroups,
        ];
    }
}
