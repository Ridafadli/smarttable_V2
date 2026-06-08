<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Commande;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    public function stats(Request $request)
    {
        $restaurantId = $request->user()->id;
        $clients = Client::where('restaurant_id', $restaurantId);

        $withEmail = (clone $clients)->whereNotNull('email')->where('email', '!=', '')->count();
        $activeThisMonth = (clone $clients)->where('updated_at', '>=', now()->startOfMonth())->count();

        $totalSpent = Commande::where('restaurant_id', $restaurantId)
            ->whereNotNull('client_id')
            ->where('statut', '!=', 'cancelled')
            ->sum('total');

        return response()->json([
            'total'            => (clone $clients)->count(),
            'with_email'       => $withEmail,
            'active_this_month'=> $activeThisMonth,
            'total_spent'      => (float) $totalSpent,
            'with_reservations'=> Reservation::where('restaurant_id', $restaurantId)->whereNotNull('client_id')->distinct('client_id')->count('client_id'),
        ]);
    }

    public function index(Request $request)
    {
        $query = $request->user()->clients();

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('nom_complet', 'like', $search)
                    ->orWhere('telephone', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('adresse', 'like', $search);
            });
        }

        if ($request->boolean('has_email')) {
            $query->whereNotNull('email')->where('email', '!=', '');
        }

        if ($request->boolean('has_orders')) {
            $query->whereHas('commandes');
        }

        if ($request->boolean('has_reservations')) {
            $query->whereHas('reservations');
        }

        $sort = $request->get('sort', 'name');
        match ($sort) {
            'recent'  => $query->latest(),
            'spent'   => $query->withSum(['commandes as total_spent' => fn ($q) => $q->where('statut', '!=', 'cancelled')], 'total')
                ->orderByDesc('total_spent'),
            default   => $query->orderBy('nom_complet'),
        };

        $perPage = min((int) $request->get('per_page', 50), 100);
        $paginated = $query->paginate($perPage);

        $paginated->getCollection()->transform(fn (Client $client) => $this->formatClientSummary($client));

        return response()->json($paginated);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $exists = Client::where('restaurant_id', $request->user()->id)
            ->where('telephone', $validated['telephone'])
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Un client avec ce numéro de téléphone existe déjà'], 422);
        }

        $client = Client::create([
            ...$validated,
            'restaurant_id' => $request->user()->id,
        ]);

        return response()->json($this->formatClientSummary($client), 201);
    }

    public function show(Request $request, Client $client)
    {
        $this->authorizeClient($request, $client);

        return response()->json($this->formatClientDetail($client));
    }

    public function update(Request $request, Client $client)
    {
        $this->authorizeClient($request, $client);

        $validated = $this->validatePayload($request);

        $duplicate = Client::where('restaurant_id', $request->user()->id)
            ->where('telephone', $validated['telephone'])
            ->where('id', '!=', $client->id)
            ->exists();

        if ($duplicate) {
            return response()->json(['error' => 'Un client avec ce numéro de téléphone existe déjà'], 422);
        }

        $client->update($validated);

        return response()->json($this->formatClientDetail($client->fresh()));
    }

    public function destroy(Request $request, Client $client)
    {
        $this->authorizeClient($request, $client);

        $client->delete();

        return response()->json(['message' => 'Client supprimé']);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'nom_complet' => 'required|string|max:150',
            'telephone'   => 'required|string|max:30',
            'email'       => 'nullable|email|max:150',
            'adresse'     => 'nullable|string|max:255',
            'notes'       => 'nullable|string|max:500',
        ]);
    }

    private function authorizeClient(Request $request, Client $client): void
    {
        if ((int) $client->restaurant_id !== (int) $request->user()->id) {
            abort(403, 'Non autorisé');
        }
    }

    private function computeMetrics(Client $client): array
    {
        $commandes = Commande::where('client_id', $client->id)
            ->where('statut', '!=', 'cancelled');

        $totalDepense = (float) (clone $commandes)->sum('total');

        $orderVisitDays = (clone $commandes)
            ->select(DB::raw('DATE(created_at) as visit_day'))
            ->distinct()
            ->count();

        $reservationVisits = Reservation::where('client_id', $client->id)
            ->where('statut', 'confirmee')
            ->where('date_reservation', '<=', today())
            ->count();

        $legacyReservations = Reservation::where('restaurant_id', $client->restaurant_id)
            ->whereNull('client_id')
            ->where('client_telephone', $client->telephone)
            ->where('statut', 'confirmee')
            ->where('date_reservation', '<=', today())
            ->count();

        return [
            'nombre_visites'  => $orderVisitDays + $reservationVisits + $legacyReservations,
            'montant_total'   => $totalDepense,
            'commandes_count' => (clone $commandes)->count(),
            'reservations_count' => Reservation::where('restaurant_id', $client->restaurant_id)
                ->where(function ($q) use ($client) {
                    $q->where('client_id', $client->id)
                        ->orWhere(function ($q2) use ($client) {
                            $q2->whereNull('client_id')
                                ->where('client_telephone', $client->telephone);
                        });
                })
                ->count(),
        ];
    }

    private function formatClientSummary(Client $client): array
    {
        $metrics = $this->computeMetrics($client);

        return [
            'id'                 => $client->id,
            'nom_complet'        => $client->nom_complet,
            'telephone'          => $client->telephone,
            'email'              => $client->email,
            'adresse'            => $client->adresse,
            'notes'              => $client->notes,
            'nombre_visites'     => $metrics['nombre_visites'],
            'montant_total'      => $metrics['montant_total'],
            'commandes_count'    => $metrics['commandes_count'],
            'reservations_count' => $metrics['reservations_count'],
            'created_at'         => $client->created_at?->toIso8601String(),
            'updated_at'         => $client->updated_at?->toIso8601String(),
        ];
    }

    private function formatClientDetail(Client $client): array
    {
        $summary = $this->formatClientSummary($client);

        $commandes = Commande::where('client_id', $client->id)
            ->with(['menu:id,nom_plat', 'table:id,numero_table,nom'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Commande $c) => [
                'id'         => $c->id,
                'menu'       => $c->menu?->nom_plat,
                'table'      => $c->table ? 'Table '.$c->table->numero_table : null,
                'quantite'   => $c->quantite,
                'total'      => (float) $c->total,
                'statut'     => $c->statut,
                'created_at' => $c->created_at?->toIso8601String(),
            ]);

        $reservations = Reservation::where('restaurant_id', $client->restaurant_id)
            ->where(function ($q) use ($client) {
                $q->where('client_id', $client->id)
                    ->orWhere(function ($q2) use ($client) {
                        $q2->whereNull('client_id')
                            ->where('client_telephone', $client->telephone);
                    });
            })
            ->with(['table:id,numero_table,nom'])
            ->orderByDesc('date_reservation')
            ->orderByDesc('heure_reservation')
            ->limit(50)
            ->get()
            ->map(fn (Reservation $r) => [
                'id'                => $r->id,
                'date_reservation'  => $r->date_reservation->format('Y-m-d'),
                'heure_reservation' => substr($r->heure_reservation, 0, 5),
                'nombre_personnes'  => $r->nombre_personnes,
                'statut'            => $r->statut,
                'table'             => $r->table ? 'Table '.$r->table->numero_table : null,
            ]);

        return [
            ...$summary,
            'historique_commandes'    => $commandes,
            'historique_reservations' => $reservations,
        ];
    }
}
