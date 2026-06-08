<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeActivityLog;
use App\Services\EmployeePermissionService;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(
        private EmployeePermissionService $permissionService
    ) {}

    public function permissionsConfig()
    {
        return response()->json($this->permissionService->configForFrontend());
    }

    public function stats(Request $request)
    {
        $restaurantId = $request->user()->id;
        $employees = Employee::where('restaurant_id', $restaurantId);

        $byRole = (clone $employees)
            ->selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role');

        return response()->json([
            'total'    => (clone $employees)->count(),
            'active'   => (clone $employees)->where('is_active', true)->count(),
            'inactive' => (clone $employees)->where('is_active', false)->count(),
            'by_role'  => [
                'admin'     => (int) ($byRole['admin'] ?? 0),
                'manager'   => (int) ($byRole['manager'] ?? 0),
                'serveur'   => (int) ($byRole['serveur'] ?? 0),
                'cuisinier' => (int) ($byRole['cuisinier'] ?? 0),
            ],
        ]);
    }

    public function index(Request $request)
    {
        $query = $request->user()->employees();

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                    ->orWhere('prenom', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('telephone', 'like', $search);
            });
        }

        if ($request->filled('role') && in_array($request->role, EmployeePermissionService::ROLES, true)) {
            $query->where('role', $request->role);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $sort = $request->get('sort', 'name');
        match ($sort) {
            'recent' => $query->latest(),
            'role'   => $query->orderBy('role')->orderBy('nom'),
            default  => $query->orderBy('nom')->orderBy('prenom'),
        };

        $perPage = min((int) $request->get('per_page', 50), 100);
        $paginated = $query->paginate($perPage);

        $paginated->getCollection()->transform(fn (Employee $e) => $this->formatSummary($e));

        return response()->json($paginated);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        if (! empty($validated['email'])) {
            $exists = Employee::where('restaurant_id', $request->user()->id)
                ->where('email', $validated['email'])
                ->exists();

            if ($exists) {
                return response()->json(['error' => 'Un employé avec cet email existe déjà'], 422);
            }
        }

        $employee = Employee::create([
            ...$validated,
            'restaurant_id' => $request->user()->id,
        ]);

        $this->logActivity(
            $request,
            $employee,
            'created',
            'Employé ajouté : '.$employee->nom_complet,
            ['role' => $employee->role]
        );

        return response()->json($this->formatSummary($employee), 201);
    }

    public function show(Request $request, Employee $employee)
    {
        $this->authorizeEmployee($request, $employee);

        return response()->json($this->formatDetail($employee));
    }

    public function update(Request $request, Employee $employee)
    {
        $this->authorizeEmployee($request, $employee);

        $validated = $this->validatePayload($request, $employee);

        if (! empty($validated['email'])) {
            $duplicate = Employee::where('restaurant_id', $request->user()->id)
                ->where('email', $validated['email'])
                ->where('id', '!=', $employee->id)
                ->exists();

            if ($duplicate) {
                return response()->json(['error' => 'Un employé avec cet email existe déjà'], 422);
            }
        }

        $oldRole = $employee->role;
        $oldPermissions = $employee->permissions;
        $oldActive = $employee->is_active;

        $employee->update($validated);

        if ($oldRole !== $employee->role) {
            $this->logActivity(
                $request,
                $employee,
                'role_changed',
                'Rôle modifié : '.EmployeePermissionService::ROLE_LABELS[$oldRole].' → '.EmployeePermissionService::ROLE_LABELS[$employee->role],
                ['from' => $oldRole, 'to' => $employee->role]
            );
        }

        if ($oldPermissions !== $employee->permissions) {
            $this->logActivity(
                $request,
                $employee,
                'permissions_changed',
                'Permissions personnalisées mises à jour',
                ['permissions' => $employee->permissions]
            );
        }

        if ($oldActive !== $employee->is_active) {
            $this->logActivity(
                $request,
                $employee,
                $employee->is_active ? 'activated' : 'deactivated',
                $employee->is_active ? 'Employé réactivé' : 'Employé désactivé'
            );
        }

        $otherChanges = collect($validated)->except(['role', 'permissions', 'is_active'])->keys();
        if ($otherChanges->isNotEmpty() && $oldRole === $employee->role && $oldPermissions === $employee->permissions && $oldActive === $employee->is_active) {
            $this->logActivity(
                $request,
                $employee,
                'updated',
                'Informations mises à jour',
                ['fields' => $otherChanges->values()->all()]
            );
        }

        return response()->json($this->formatDetail($employee->fresh()));
    }

    public function destroy(Request $request, Employee $employee)
    {
        $this->authorizeEmployee($request, $employee);

        $name = $employee->nom_complet;

        $this->logActivity(
            $request,
            $employee,
            'deleted',
            'Employé supprimé : '.$name,
            ['role' => $employee->role]
        );

        $employee->delete();

        return response()->json(['message' => 'Employé supprimé']);
    }

    public function activity(Request $request)
    {
        $query = EmployeeActivityLog::where('restaurant_id', $request->user()->id)
            ->with(['employee:id,nom,prenom,role'])
            ->latest();

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $perPage = min((int) $request->get('per_page', 30), 100);

        return response()->json($query->paginate($perPage));
    }

    private function validatePayload(Request $request, ?Employee $employee = null): array
    {
        $validated = $request->validate([
            'nom'            => 'required|string|max:100',
            'prenom'         => 'nullable|string|max:100',
            'email'          => 'nullable|email|max:150',
            'telephone'      => 'nullable|string|max:30',
            'role'           => 'required|in:admin,manager,serveur,cuisinier',
            'permissions'    => 'nullable|array',
            'permissions.*'  => 'string|max:50',
            'use_custom_permissions' => 'sometimes|boolean',
            'date_embauche'  => 'nullable|date',
            'notes'          => 'nullable|string|max:500',
            'is_active'      => 'sometimes|boolean',
        ]);

        if ($request->boolean('use_custom_permissions') && ! empty($validated['permissions'])) {
            $validated['permissions'] = array_values(array_unique($validated['permissions']));
        } else {
            $validated['permissions'] = null;
        }

        unset($validated['use_custom_permissions']);

        if (! isset($validated['is_active']) && ! $employee) {
            $validated['is_active'] = true;
        }

        return $validated;
    }

    private function authorizeEmployee(Request $request, Employee $employee): void
    {
        if ((int) $employee->restaurant_id !== (int) $request->user()->id) {
            abort(403, 'Non autorisé');
        }
    }

    private function logActivity(Request $request, Employee $employee, string $action, string $description, array $metadata = []): void
    {
        EmployeeActivityLog::create([
            'restaurant_id' => $request->user()->id,
            'employee_id'   => $employee->id,
            'action'        => $action,
            'description'   => $description,
            'metadata'      => $metadata ?: null,
            'performed_by'  => $request->user()->nom ?? 'Propriétaire',
        ]);
    }

    private function formatSummary(Employee $employee): array
    {
        $effective = $this->permissionService->effectivePermissions($employee->role, $employee->permissions);

        return [
            'id'                      => $employee->id,
            'nom'                     => $employee->nom,
            'prenom'                  => $employee->prenom,
            'nom_complet'             => $employee->nom_complet,
            'email'                   => $employee->email,
            'telephone'               => $employee->telephone,
            'role'                    => $employee->role,
            'role_label'              => EmployeePermissionService::ROLE_LABELS[$employee->role] ?? $employee->role,
            'permissions'             => $employee->permissions,
            'effective_permissions'   => $effective,
            'permissions_count'       => count($effective),
            'use_custom_permissions'  => is_array($employee->permissions) && count($employee->permissions) > 0,
            'date_embauche'           => $employee->date_embauche?->format('Y-m-d'),
            'notes'                   => $employee->notes,
            'is_active'               => $employee->is_active,
            'created_at'              => $employee->created_at?->toIso8601String(),
            'updated_at'              => $employee->updated_at?->toIso8601String(),
        ];
    }

    private function formatDetail(Employee $employee): array
    {
        $summary = $this->formatSummary($employee);

        $logs = $employee->activityLogs()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (EmployeeActivityLog $log) => [
                'id'           => $log->id,
                'action'       => $log->action,
                'description'  => $log->description,
                'metadata'     => $log->metadata,
                'performed_by' => $log->performed_by,
                'created_at'   => $log->created_at?->toIso8601String(),
            ]);

        return [
            ...$summary,
            'historique_activite' => $logs,
        ];
    }
}
