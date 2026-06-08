<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Reservation;
use App\Models\TableRestaurant;
use Illuminate\Http\Request;

class TableController extends Controller
{
    private const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

    private const MANUAL_STATUTS = ['reservee', 'nettoyage'];

    public function index(Request $request)
    {
        $restaurantId = $request->user()->id;
        $tables = $request->user()->tables()
            ->orderBy('numero_table')
            ->get();

        $busyByTable = Commande::query()
            ->where('restaurant_id', $restaurantId)
            ->whereIn('statut', self::ACTIVE_ORDER_STATUSES)
            ->selectRaw('table_id, MIN(created_at) as occupied_since, COUNT(*) as active_orders')
            ->groupBy('table_id')
            ->get()
            ->keyBy('table_id');

        $reservationsByTable = Reservation::query()
            ->where('restaurant_id', $restaurantId)
            ->whereDate('date_reservation', today())
            ->whereIn('statut', ['confirmee', 'en_attente'])
            ->whereNotNull('table_restaurant_id')
            ->with('client:id,nom_complet')
            ->orderBy('heure_reservation')
            ->get()
            ->groupBy('table_restaurant_id');

        $enriched = $tables->values()->map(function (TableRestaurant $table, int $index) use ($busyByTable, $reservationsByTable) {
            $busy = $busyByTable->get($table->id);
            $reservations = $reservationsByTable->get($table->id, collect());

            return $this->formatTablePayload($table, $busy, $reservations, $index);
        });

        return response()->json($enriched);
    }

    public function show(Request $request, TableRestaurant $table)
    {
        if ($table->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $busy = Commande::query()
            ->where('restaurant_id', $request->user()->id)
            ->where('table_id', $table->id)
            ->whereIn('statut', self::ACTIVE_ORDER_STATUSES)
            ->selectRaw('MIN(created_at) as occupied_since, COUNT(*) as active_orders')
            ->first();

        $reservations = Reservation::query()
            ->where('restaurant_id', $request->user()->id)
            ->where('table_restaurant_id', $table->id)
            ->whereDate('date_reservation', '>=', today())
            ->whereIn('statut', ['confirmee', 'en_attente'])
            ->with('client:id,nom_complet')
            ->orderBy('date_reservation')
            ->orderBy('heure_reservation')
            ->limit(10)
            ->get();

        $activeOrders = Commande::query()
            ->where('restaurant_id', $request->user()->id)
            ->where('table_id', $table->id)
            ->whereIn('statut', self::ACTIVE_ORDER_STATUSES)
            ->with('menu:id,nom_plat')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (Commande $c) => [
                'id'         => $c->id,
                'menu'       => $c->menu?->nom_plat,
                'quantite'   => $c->quantite,
                'statut'     => $c->statut,
                'total'      => (float) $c->total,
                'created_at' => $c->created_at?->toIso8601String(),
            ]);

        $payload = $this->formatTablePayload($table, $busy, $reservations);
        $payload['reservations'] = $reservations->map(fn (Reservation $r) => $this->formatReservation($r));
        $payload['active_orders'] = $activeOrders;

        return response()->json($payload);
    }

    public function store(Request $request)
    {
        if (! $request->user()->canAddTable()) {
            return response()->json([
                'error' => 'Limite de 3 tables atteinte pour le plan gratuit.',
            ], 403);
        }

        $validated = $request->validate([
            'numero_table' => 'required|integer|min:1',
            'nom'          => 'nullable|string|max:100',
            'capacite'     => 'nullable|integer|min:1|max:20',
            'statut'       => 'nullable|in:disponible,occupee,reservee,nettoyage',
        ]);

        $exists = $request->user()->tables()
            ->where('numero_table', $validated['numero_table'])
            ->exists();

        if ($exists) {
            return response()->json([
                'error' => 'Ce numéro de table existe déjà.',
            ], 422);
        }

        $count = $request->user()->tables()->count();
        $col = $count % 5;
        $row = intdiv($count, 5);

        $table = $request->user()->tables()->create([
            ...$validated,
            'capacite' => $validated['capacite'] ?? 4,
            'statut'   => $validated['statut'] ?? 'disponible',
            'pos_x'    => 12 + $col * 18,
            'pos_y'    => 12 + $row * 18,
        ]);

        return response()->json($this->enrichSingle($table->fresh(), $request), 201);
    }

    public function update(Request $request, TableRestaurant $table)
    {
        if ($table->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'numero_table'   => 'sometimes|integer|min:1',
            'nom'            => 'nullable|string|max:100',
            'is_active'      => 'sometimes|boolean',
            'capacite'       => 'sometimes|integer|min:1|max:20',
            'statut'         => 'sometimes|in:disponible,occupee,reservee,nettoyage',
            'occupied_at'    => 'nullable|date',
            'reserved_until' => 'nullable|date',
            'pos_x'          => 'nullable|integer|min:0|max:100',
            'pos_y'          => 'nullable|integer|min:0|max:100',
        ]);

        if (isset($validated['numero_table']) && $validated['numero_table'] !== $table->numero_table) {
            $duplicate = $request->user()->tables()
                ->where('numero_table', $validated['numero_table'])
                ->where('id', '!=', $table->id)
                ->exists();

            if ($duplicate) {
                return response()->json(['error' => 'Ce numéro de table existe déjà.'], 422);
            }
        }

        if (isset($validated['statut']) && $validated['statut'] === 'disponible') {
            $validated['occupied_at'] = null;
            $validated['reserved_until'] = null;
        }

        $table->update($validated);

        $busy = Commande::query()
            ->where('restaurant_id', $request->user()->id)
            ->where('table_id', $table->id)
            ->whereIn('statut', self::ACTIVE_ORDER_STATUSES)
            ->selectRaw('MIN(created_at) as occupied_since, COUNT(*) as active_orders')
            ->first();

        return response()->json($this->formatTablePayload($table->fresh(), $busy, collect()));
    }

    public function reserve(Request $request, TableRestaurant $table)
    {
        if ($table->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'hours' => 'nullable|integer|min:1|max:24',
        ]);

        $hours = $validated['hours'] ?? 2;

        $table->update([
            'statut'         => 'reservee',
            'reserved_until' => now()->addHours($hours),
            'occupied_at'    => null,
        ]);

        return response()->json($this->enrichSingle($table->fresh(), $request));
    }

    public function destroy(Request $request, TableRestaurant $table)
    {
        if ($table->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $table->delete();

        return response()->json(['message' => 'Table supprimée']);
    }

    private function resolveEffectiveStatut(TableRestaurant $table, $busy = null): string
    {
        if ($table->statut === 'nettoyage') {
            return 'nettoyage';
        }

        if ($table->statut === 'reservee' && $table->reserved_until && $table->reserved_until->isFuture()) {
            return 'reservee';
        }

        if ($busy && $busy->active_orders > 0) {
            return 'occupee';
        }

        if ($table->statut === 'occupee' && $table->occupied_at) {
            return 'occupee';
        }

        if (! $table->is_active) {
            return 'disponible';
        }

        return 'disponible';
    }

    private function formatTablePayload(
        TableRestaurant $table,
        $busy = null,
        $reservations = null,
        ?int $index = null,
        ?Request $request = null
    ): array {
        if ($busy === null && $request) {
            $busy = Commande::query()
                ->where('restaurant_id', $request->user()->id)
                ->where('table_id', $table->id)
                ->whereIn('statut', self::ACTIVE_ORDER_STATUSES)
                ->selectRaw('MIN(created_at) as occupied_since, COUNT(*) as active_orders')
                ->first();
        }

        $payload = $table->toArray();
        $payload['effective_statut'] = $this->resolveEffectiveStatut($table, $busy);
        $payload['occupied_since'] = $busy?->occupied_since ?? $table->occupied_at?->toIso8601String();
        $payload['active_orders_count'] = (int) ($busy?->active_orders ?? 0);

        if ($table->pos_x === null || $table->pos_y === null) {
            $idx = $index ?? 0;
            $col = $idx % 5;
            $row = intdiv($idx, 5);
            $payload['pos_x'] = 12 + $col * 18;
            $payload['pos_y'] = 12 + $row * 18;
        }

        $reservationList = $reservations ?? collect();
        $nextReservation = $reservationList->first();
        $payload['upcoming_reservation'] = $nextReservation
            ? $this->formatReservation($nextReservation)
            : null;

        return $payload;
    }

    private function formatReservation(Reservation $reservation): array
    {
        return [
            'id'                 => $reservation->id,
            'client_nom'         => $reservation->client?->nom_complet ?? $reservation->client_nom,
            'date_reservation'   => $reservation->date_reservation->format('Y-m-d'),
            'heure_reservation'  => substr($reservation->heure_reservation, 0, 5),
            'nombre_personnes'   => $reservation->nombre_personnes,
            'statut'             => $reservation->statut,
        ];
    }

    private function enrichSingle(TableRestaurant $table, Request $request): array
    {
        $busy = Commande::query()
            ->where('restaurant_id', $request->user()->id)
            ->where('table_id', $table->id)
            ->whereIn('statut', self::ACTIVE_ORDER_STATUSES)
            ->selectRaw('MIN(created_at) as occupied_since, COUNT(*) as active_orders')
            ->first();

        return $this->formatTablePayload($table, $busy, collect());
    }
}
