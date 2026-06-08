<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Menu;
use App\Models\TableRestaurant;
use App\Services\NotificationService;
use App\Services\StockService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class CommandeController extends Controller
{
    public function __construct(
        private WhatsAppService $whatsapp,
        private StockService $stock,
        private NotificationService $notifications,
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id'      => 'required|exists:table_restaurants,id',
            'menu_id'       => 'required|exists:menus,id',
            'sauce'         => 'nullable|string',
            'quantite'      => 'required|integer|min:1|max:20',
            'session_id'    => 'nullable|string',
            'notes'         => 'nullable|string|max:500',
        ]);

        $restaurant = \App\Models\Restaurant::findOrFail($validated['restaurant_id']);
        if (! $restaurant->is_active) {
            return response()->json(['error' => 'Restaurant indisponible'], 403);
        }
        if (! $restaurant->canAcceptOrder()) {
            return response()->json([
                'error'   => 'Limite journalière atteinte (plan Free : 10 commandes/jour).',
                'upgrade' => true,
            ], 429);
        }

        TableRestaurant::where('id', $validated['table_id'])
            ->where('restaurant_id', $validated['restaurant_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $menu = Menu::where('id', $validated['menu_id'])
            ->where('restaurant_id', $validated['restaurant_id'])
            ->where('disponible', true)
            ->firstOrFail();

        $commande = Commande::create([
            ...$validated,
            'statut' => 'confirmed',
            'total'  => $menu->prix * $validated['quantite'],
        ]);

        $commande->load(['menu', 'table']);
        $this->notifications->notifyOrder($commande);
        $stockAlerts = $this->stock->deductForOrder($commande);

        $this->whatsapp->notifyAdminIfAllowed($restaurant, $commande);

        $response = [
            'commande' => $commande,
            'message'  => 'Commande enregistrée avec succès!',
        ];

        if (! empty($stockAlerts)) {
            $response['stock_alerts'] = $stockAlerts;
            $response['stock_warning'] = 'Stock faible pour : '.implode(', ', $stockAlerts);
        }

        return response()->json($response, 201);
    }

    public function stats(Request $request)
    {
        $base = $request->user()->commandes();
        $today = (clone $base)->whereDate('created_at', today());

        return response()->json([
            'total'         => (clone $base)->count(),
            'pending'       => (clone $base)->where('statut', 'pending')->count(),
            'preparing'     => (clone $base)->whereIn('statut', ['confirmed', 'preparing'])->count(),
            'ready'         => (clone $base)->where('statut', 'ready')->count(),
            'served'        => (clone $base)->where('statut', 'delivered')->count(),
            'cancelled'     => (clone $base)->where('statut', 'cancelled')->count(),
            'today_revenue' => (float) (clone $today)->where('statut', '!=', 'cancelled')->sum('total'),
        ]);
    }

    public function index(Request $request)
    {
        $query = $request->user()->commandes()
            ->with(['menu', 'table']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->table_id);
        }

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('session_id', 'like', $search)
                    ->orWhere('notes', 'like', $search)
                    ->orWhereHas('menu', fn ($m) => $m->where('nom_plat', 'like', $search));
            });
        }

        $sort = $request->get('sort', 'latest');
        match ($sort) {
            'oldest'  => $query->oldest(),
            'amount'  => $query->orderByDesc('total'),
            'statut'  => $query->orderBy('statut')->latest(),
            default   => $query->latest(),
        };

        $perPage = min((int) $request->get('per_page', 50), 100);

        return response()->json($query->paginate($perPage));
    }

    public function show(Request $request, Commande $commande)
    {
        $this->authorize('update', $commande);

        return response()->json($commande->load(['menu', 'table']));
    }

    public function update(Request $request, Commande $commande)
    {
        $this->authorize('update', $commande);

        $validated = $request->validate([
            'quantite' => 'sometimes|integer|min:1|max:20',
            'sauce'    => 'nullable|string|max:255',
            'notes'    => 'nullable|string|max:500',
            'statut'   => 'sometimes|in:pending,confirmed,preparing,ready,delivered,cancelled',
        ]);

        if (isset($validated['quantite'])) {
            $menu = $commande->menu ?? Menu::find($commande->menu_id);
            if ($menu) {
                $validated['total'] = $menu->prix * $validated['quantite'];
            }
        }

        $commande->update($validated);

        return response()->json($commande->fresh(['menu', 'table']));
    }

    public function updateStatus(Request $request, Commande $commande)
    {
        $this->authorize('update', $commande);

        $request->validate([
            'statut' => 'required|in:pending,confirmed,preparing,ready,delivered,cancelled',
        ]);

        $commande->update(['statut' => $request->statut]);

        if ($request->statut === 'cancelled') {
            $this->stock->restoreForOrder($commande->load('menu'));
        }

        return response()->json($commande->load(['menu', 'table']));
    }

    public function destroy(Request $request, Commande $commande)
    {
        $this->authorize('update', $commande);

        if ($commande->statut !== 'cancelled') {
            $this->stock->restoreForOrder($commande->load('menu'));
        }

        $commande->delete();

        return response()->json(['message' => 'Commande supprimée']);
    }
}
