<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->ingredients();

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', $search)
                    ->orWhere('categorie', 'like', $search);
            });
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('quantite_disponible', '<=', 'quantite_minimale');
        }

        if ($request->filled('categorie')) {
            $query->where('categorie', $request->categorie);
        }

        $sort = $request->get('sort', 'name');
        match ($sort) {
            'quantity_asc'  => $query->orderBy('quantite_disponible'),
            'quantity_desc' => $query->orderByDesc('quantite_disponible'),
            'low_first'     => $query->orderByRaw('CASE WHEN quantite_disponible <= quantite_minimale THEN 0 ELSE 1 END')
                ->orderBy('quantite_disponible'),
            default         => $query->orderBy('nom'),
        };

        $ingredients = $query->get()->map(fn (Ingredient $i) => $this->formatIngredient($i));

        return response()->json($ingredients);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $exists = Ingredient::where('restaurant_id', $request->user()->id)
            ->where('nom', $validated['nom'])
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Un ingrédient avec ce nom existe déjà'], 422);
        }

        $ingredient = Ingredient::create([
            ...$validated,
            'restaurant_id' => $request->user()->id,
        ]);

        return response()->json($this->formatIngredient($ingredient), 201);
    }

    public function show(Request $request, Ingredient $ingredient)
    {
        $this->authorizeIngredient($request, $ingredient);

        return response()->json($this->formatIngredient($ingredient));
    }

    public function update(Request $request, Ingredient $ingredient)
    {
        $this->authorizeIngredient($request, $ingredient);

        $validated = $this->validatePayload($request, false);

        $duplicate = Ingredient::where('restaurant_id', $request->user()->id)
            ->where('nom', $validated['nom'])
            ->where('id', '!=', $ingredient->id)
            ->exists();

        if ($duplicate) {
            return response()->json(['error' => 'Un ingrédient avec ce nom existe déjà'], 422);
        }

        $ingredient->update($validated);

        return response()->json($this->formatIngredient($ingredient->fresh()));
    }

    public function destroy(Request $request, Ingredient $ingredient)
    {
        $this->authorizeIngredient($request, $ingredient);
        $ingredient->delete();

        return response()->json(['message' => 'Ingrédient supprimé']);
    }

    private function validatePayload(Request $request, bool $requireQty = true): array
    {
        $rules = [
            'nom'               => 'required|string|max:120',
            'unite'             => 'required|string|max:20',
            'quantite_minimale' => 'required|numeric|min:0',
            'categorie'         => 'nullable|string|max:80',
            'notes'             => 'nullable|string|max:500',
        ];

        if ($requireQty) {
            $rules['quantite_disponible'] = 'required|numeric|min:0';
        } else {
            $rules['quantite_disponible'] = 'sometimes|numeric|min:0';
        }

        return $request->validate($rules);
    }

    private function authorizeIngredient(Request $request, Ingredient $ingredient): void
    {
        if ((int) $ingredient->restaurant_id !== (int) $request->user()->id) {
            abort(403, 'Non autorisé');
        }
    }

    private function formatIngredient(Ingredient $ingredient): array
    {
        return [
            'id'                   => $ingredient->id,
            'nom'                  => $ingredient->nom,
            'unite'                => $ingredient->unite,
            'quantite_disponible'  => (float) $ingredient->quantite_disponible,
            'quantite_minimale'    => (float) $ingredient->quantite_minimale,
            'categorie'            => $ingredient->categorie,
            'notes'                => $ingredient->notes,
            'is_low_stock'         => $ingredient->isLowStock(),
            'stock_percent'        => $ingredient->stockPercent(),
            'created_at'           => $ingredient->created_at?->toIso8601String(),
            'updated_at'           => $ingredient->updated_at?->toIso8601String(),
        ];
    }
}
