<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\StockMouvement;
use App\Services\StockService;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function __construct(private StockService $stockService) {}

    public function stats(Request $request)
    {
        $restaurantId = $request->user()->id;
        $ingredients = Ingredient::where('restaurant_id', $restaurantId);

        $lowStock = (clone $ingredients)
            ->whereColumn('quantite_disponible', '<=', 'quantite_minimale')
            ->count();

        $movementsToday = StockMouvement::where('restaurant_id', $restaurantId)
            ->whereDate('created_at', today())
            ->count();

        $entriesToday = StockMouvement::where('restaurant_id', $restaurantId)
            ->whereDate('created_at', today())
            ->whereIn('type', ['entree', 'annulation'])
            ->sum('quantite');

        $exitsToday = StockMouvement::where('restaurant_id', $restaurantId)
            ->whereDate('created_at', today())
            ->whereIn('type', ['sortie', 'commande'])
            ->sum('quantite');

        return response()->json([
            'total_ingredients' => (clone $ingredients)->count(),
            'low_stock_count'   => $lowStock,
            'movements_today'   => $movementsToday,
            'entries_today'     => (float) $entriesToday,
            'exits_today'       => (float) $exitsToday,
            'healthy_count'     => (clone $ingredients)->count() - $lowStock,
        ]);
    }

    public function alerts(Request $request)
    {
        $items = $request->user()->ingredients()
            ->whereColumn('quantite_disponible', '<=', 'quantite_minimale')
            ->orderBy('quantite_disponible')
            ->get()
            ->map(fn (Ingredient $i) => [
                'id'                  => $i->id,
                'nom'                 => $i->nom,
                'unite'               => $i->unite,
                'quantite_disponible' => (float) $i->quantite_disponible,
                'quantite_minimale'   => (float) $i->quantite_minimale,
                'deficit'             => max(0, round($i->quantite_minimale - $i->quantite_disponible, 3)),
            ]);

        return response()->json($items);
    }

    public function movements(Request $request)
    {
        $query = StockMouvement::where('restaurant_id', $request->user()->id)
            ->with(['ingredient:id,nom,unite']);

        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', $request->ingredient_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min((int) $request->get('per_page', 50), 100);

        $paginated = $query->latest()->paginate($perPage);
        $paginated->getCollection()->transform(fn (StockMouvement $m) => $this->formatMovement($m));

        return response()->json($paginated);
    }

    public function storeMovement(Request $request)
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'type'          => 'required|in:entree,sortie',
            'quantite'      => 'required|numeric|min:0.001',
            'motif'         => 'nullable|string|max:255',
        ]);

        $ingredient = Ingredient::findOrFail($validated['ingredient_id']);
        if ((int) $ingredient->restaurant_id !== (int) $request->user()->id) {
            abort(403);
        }

        $movement = $validated['type'] === 'entree'
            ? $this->stockService->manualEntry($ingredient, (float) $validated['quantite'], $validated['motif'] ?? null)
            : $this->stockService->manualExit($ingredient, (float) $validated['quantite'], $validated['motif'] ?? null);

        return response()->json($this->formatMovement($movement->load('ingredient')), 201);
    }

    private function formatMovement(StockMouvement $m): array
    {
        return [
            'id'               => $m->id,
            'ingredient_id'    => $m->ingredient_id,
            'ingredient_nom'   => $m->ingredient?->nom,
            'unite'            => $m->ingredient?->unite,
            'type'             => $m->type,
            'quantite'         => (float) $m->quantite,
            'quantite_avant'   => (float) $m->quantite_avant,
            'quantite_apres'   => (float) $m->quantite_apres,
            'commande_id'      => $m->commande_id,
            'motif'            => $m->motif,
            'created_at'       => $m->created_at?->toIso8601String(),
        ];
    }
}
