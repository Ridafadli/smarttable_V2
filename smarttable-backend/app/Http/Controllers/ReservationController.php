<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\TableRestaurant;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    private const DEFAULT_DURATION = 120;

    public function __construct(private NotificationService $notifications) {}

    public function stats(Request $request)
    {
        $base = $request->user()->reservations()->where('statut', '!=', 'annulee');
        $today = today()->toDateString();

        return response()->json([
            'total'      => (clone $base)->count(),
            'confirmee'  => (clone $base)->where('statut', 'confirmee')->count(),
            'en_attente' => (clone $base)->where('statut', 'en_attente')->count(),
            'annulee'    => $request->user()->reservations()->where('statut', 'annulee')->count(),
            'today'      => (clone $base)->whereDate('date_reservation', $today)->count(),
            'upcoming'   => (clone $base)->where('date_reservation', '>=', $today)->count(),
        ]);
    }

    public function index(Request $request)
    {
        $query = $request->user()->reservations()
            ->with(['table:id,numero_table,nom,capacite']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('date')) {
            $query->whereDate('date_reservation', $request->date);
        }

        if ($request->filled('month') && $request->filled('year')) {
            $query->whereYear('date_reservation', (int) $request->year)
                ->whereMonth('date_reservation', (int) $request->month);
        }

        if ($request->filled('table_id')) {
            $query->where('table_restaurant_id', $request->table_id);
        }

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('client_nom', 'like', $search)
                    ->orWhere('client_telephone', 'like', $search)
                    ->orWhere('notes', 'like', $search);
            });
        }

        $sort = $request->get('sort', 'date_asc');
        match ($sort) {
            'date_desc' => $query->orderByDesc('date_reservation')->orderByDesc('heure_reservation'),
            'name'      => $query->orderBy('client_nom'),
            default     => $query->orderBy('date_reservation')->orderBy('heure_reservation'),
        };

        $perPage = min((int) $request->get('per_page', 100), 200);

        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $table = $this->resolveTable($request, $validated['table_restaurant_id']);

        if ($validated['nombre_personnes'] > $table->capacite) {
            return response()->json([
                'error' => "Capacité insuffisante (max {$table->capacite} personnes pour cette table)",
            ], 422);
        }

        $conflict = $this->findConflict(
            $request->user()->id,
            $validated['table_restaurant_id'],
            $validated['date_reservation'],
            $validated['heure_reservation'],
            $validated['duree_minutes'] ?? self::DEFAULT_DURATION
        );

        if ($conflict) {
            return response()->json([
                'error'     => 'Conflit de réservation détecté',
                'conflict'  => $this->formatReservation($conflict),
            ], 409);
        }

        $reservation = Reservation::create([
            ...$validated,
            'restaurant_id' => $request->user()->id,
        ]);

        $this->syncTableStatus($reservation->fresh(['table']));

        if ($reservation->statut !== 'annulee') {
            $this->notifications->notifyReservation($reservation->fresh(['table']));
        }

        return response()->json($this->formatReservation($reservation->load('table')), 201);
    }

    public function show(Request $request, Reservation $reservation)
    {
        $this->authorizeReservation($request, $reservation);

        return response()->json($this->formatReservation($reservation->load('table')));
    }

    public function update(Request $request, Reservation $reservation)
    {
        $this->authorizeReservation($request, $reservation);

        $validated = $this->validatePayload($request, $reservation->id);

        $table = $this->resolveTable($request, $validated['table_restaurant_id']);

        if ($validated['nombre_personnes'] > $table->capacite) {
            return response()->json([
                'error' => "Capacité insuffisante (max {$table->capacite} personnes pour cette table)",
            ], 422);
        }

        $conflict = $this->findConflict(
            $request->user()->id,
            $validated['table_restaurant_id'],
            $validated['date_reservation'],
            $validated['heure_reservation'],
            $validated['duree_minutes'] ?? self::DEFAULT_DURATION,
            $reservation->id
        );

        if ($conflict) {
            return response()->json([
                'error'    => 'Conflit de réservation détecté',
                'conflict' => $this->formatReservation($conflict),
            ], 409);
        }

        $previousStatut = $reservation->statut;

        $reservation->update($validated);
        $this->syncTableStatus($reservation->fresh(['table']));

        if ($validated['statut'] === 'annulee' && $previousStatut !== 'annulee') {
            $this->notifications->notifyReservationCancelled($reservation->fresh(['table']));
        }

        return response()->json($this->formatReservation($reservation->load('table')));
    }

    public function destroy(Request $request, Reservation $reservation)
    {
        $this->authorizeReservation($request, $reservation);

        if ($reservation->statut !== 'annulee') {
            $this->notifications->notifyReservationCancelled($reservation->load('table'));
        }

        $tableId = $reservation->table_restaurant_id;
        $reservation->delete();

        $this->clearTableIfNeeded($request->user()->id, $tableId);

        return response()->json(['message' => 'Réservation supprimée']);
    }

    public function checkConflicts(Request $request)
    {
        $validated = $request->validate([
            'table_restaurant_id' => 'required|exists:table_restaurants,id',
            'date_reservation'    => 'required|date',
            'heure_reservation'   => 'required|date_format:H:i',
            'duree_minutes'       => 'nullable|integer|min:30|max:480',
            'exclude_id'          => 'nullable|integer|exists:reservations,id',
        ]);

        $this->resolveTable($request, $validated['table_restaurant_id']);

        $conflict = $this->findConflict(
            $request->user()->id,
            $validated['table_restaurant_id'],
            $validated['date_reservation'],
            $validated['heure_reservation'],
            $validated['duree_minutes'] ?? self::DEFAULT_DURATION,
            $validated['exclude_id'] ?? null
        );

        return response()->json([
            'has_conflict' => (bool) $conflict,
            'conflict'     => $conflict ? $this->formatReservation($conflict) : null,
        ]);
    }

    private function validatePayload(Request $request, ?int $excludeId = null): array
    {
        return $request->validate([
            'table_restaurant_id' => 'required|exists:table_restaurants,id',
            'client_nom'          => 'required|string|max:120',
            'client_telephone'    => 'required|string|max:30',
            'date_reservation'    => 'required|date'.($excludeId ? '' : '|after_or_equal:today'),
            'heure_reservation'   => 'required|date_format:H:i',
            'nombre_personnes'    => 'required|integer|min:1|max:50',
            'statut'              => 'required|in:confirmee,en_attente,annulee',
            'duree_minutes'       => 'nullable|integer|min:30|max:480',
            'notes'               => 'nullable|string|max:500',
        ]);
    }

    private function authorizeReservation(Request $request, Reservation $reservation): void
    {
        if ((int) $reservation->restaurant_id !== (int) $request->user()->id) {
            abort(403, 'Non autorisé');
        }
    }

    private function resolveTable(Request $request, int $tableId): TableRestaurant
    {
        $table = TableRestaurant::findOrFail($tableId);

        if ((int) $table->restaurant_id !== (int) $request->user()->id) {
            abort(403, 'Non autorisé');
        }

        return $table;
    }

    private function findConflict(
        int $restaurantId,
        int $tableId,
        string $date,
        string $heure,
        int $duration,
        ?int $excludeId = null
    ): ?Reservation {
        $start = Carbon::parse("{$date} {$heure}");
        $end   = $start->copy()->addMinutes($duration);

        $query = Reservation::where('restaurant_id', $restaurantId)
            ->where('table_restaurant_id', $tableId)
            ->whereDate('date_reservation', $date)
            ->where('statut', '!=', 'annulee');

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        foreach ($query->get() as $existing) {
            $otherStart = Carbon::parse(
                $existing->date_reservation->format('Y-m-d').' '.$existing->heure_reservation
            );
            $otherEnd = $otherStart->copy()->addMinutes($existing->duree_minutes ?? self::DEFAULT_DURATION);

            if ($start->lt($otherEnd) && $end->gt($otherStart)) {
                return $existing->load('table');
            }
        }

        return null;
    }

    private function syncTableStatus(Reservation $reservation): void
    {
        $table = $reservation->table;
        if (! $table) {
            return;
        }

        if ($reservation->statut === 'annulee') {
            $this->clearTableIfNeeded($reservation->restaurant_id, $table->id);

            return;
        }

        if ($reservation->statut !== 'confirmee') {
            return;
        }

        $start = Carbon::parse(
            $reservation->date_reservation->format('Y-m-d').' '.$reservation->heure_reservation
        );
        $end = $start->copy()->addMinutes($reservation->duree_minutes ?? self::DEFAULT_DURATION);

        if ($end->isPast()) {
            return;
        }

        $table->update([
            'statut'         => 'reservee',
            'reserved_until' => $end,
            'occupied_at'    => null,
        ]);
    }

    private function clearTableIfNeeded(int $restaurantId, int $tableId): void
    {
        $table = TableRestaurant::find($tableId);
        if (! $table || $table->statut !== 'reservee') {
            return;
        }

        $hasActive = Reservation::where('restaurant_id', $restaurantId)
            ->where('table_restaurant_id', $tableId)
            ->where('statut', 'confirmee')
            ->where(function ($q) {
                $q->whereDate('date_reservation', '>', today())
                    ->orWhere(function ($q2) {
                        $q2->whereDate('date_reservation', today())
                            ->whereRaw("ADDTIME(heure_reservation, SEC_TO_TIME(duree_minutes * 60)) > ?", [now()->format('H:i:s')]);
                    });
            })
            ->exists();

        if (! $hasActive) {
            $table->update([
                'statut'         => 'disponible',
                'reserved_until' => null,
            ]);
        }
    }

    private function formatReservation(Reservation $reservation): array
    {
        $heure = $reservation->heure_reservation;
        if (strlen($heure) > 5) {
            $heure = substr($heure, 0, 5);
        }

        return [
            'id'                  => $reservation->id,
            'restaurant_id'       => $reservation->restaurant_id,
            'table_restaurant_id' => $reservation->table_restaurant_id,
            'client_nom'          => $reservation->client_nom,
            'client_telephone'    => $reservation->client_telephone,
            'date_reservation'    => $reservation->date_reservation->format('Y-m-d'),
            'heure_reservation'   => $heure,
            'nombre_personnes'    => $reservation->nombre_personnes,
            'statut'              => $reservation->statut,
            'duree_minutes'       => $reservation->duree_minutes,
            'notes'               => $reservation->notes,
            'table'               => $reservation->relationLoaded('table') && $reservation->table
                ? [
                    'id'           => $reservation->table->id,
                    'numero_table' => $reservation->table->numero_table,
                    'nom'          => $reservation->table->nom,
                    'capacite'     => $reservation->table->capacite,
                ]
                : null,
            'created_at'          => $reservation->created_at?->toIso8601String(),
            'updated_at'          => $reservation->updated_at?->toIso8601String(),
        ];
    }
}
