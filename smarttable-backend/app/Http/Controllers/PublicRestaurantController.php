<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\TableRestaurant;
use App\Services\MealTimeService;
use Illuminate\Http\Request;

class PublicRestaurantController extends Controller
{
    public function show(Request $request, int $restaurantId)
    {
        $restaurant = Restaurant::where('id', $restaurantId)
            ->where('is_active', true)
            ->firstOrFail();

        $table = null;
        if ($request->filled('table_id')) {
            $table = TableRestaurant::where('id', $request->integer('table_id'))
                ->where('restaurant_id', $restaurantId)
                ->where('is_active', true)
                ->first();

            if (! $table) {
                return response()->json(['error' => 'Table invalide'], 422);
            }
        }

        $mealType = MealTimeService::currentMealType();

        return response()->json([
            'restaurant' => [
                'id'    => $restaurant->id,
                'nom'   => $restaurant->nom,
                'logo'  => $restaurant->logo ? asset('storage/'.$restaurant->logo) : null,
            ],
            'table' => $table ? [
                'id'           => $table->id,
                'numero_table' => $table->numero_table,
                'nom'          => $table->nom,
            ] : null,
            'meal_period' => [
                'type'  => $mealType,
                'label' => MealTimeService::label($mealType),
            ],
            'can_order' => $restaurant->canAcceptOrder(),
        ]);
    }
}
