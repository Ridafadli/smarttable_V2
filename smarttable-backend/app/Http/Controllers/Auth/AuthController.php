<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'nom'          => 'required|string|max:255',
            'email'        => 'required|email|unique:restaurants',
            'mot_de_passe' => 'required|min:8|confirmed',
            'whatsapp'     => 'nullable|string|max:20',
        ]);

        $restaurant = Restaurant::create([
            ...$validated,
            'mot_de_passe' => Hash::make($validated['mot_de_passe']),
            'plan'         => 'free',
        ]);

        $token = $restaurant->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Inscription réussie',
            'restaurant' => $restaurant,
            'token'      => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'        => 'required|email',
            'mot_de_passe' => 'required',
        ]);

        $restaurant = Restaurant::where('email', $request->email)->first();

        if (!$restaurant || !Hash::check($request->mot_de_passe, $restaurant->mot_de_passe)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        $restaurant->tokens()->delete();

        $token = $restaurant->createToken('auth_token')->plainTextToken;

        return response()->json([
            'restaurant' => $restaurant,
            'token'      => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'restaurant' => $this->restaurantPayload($request->user()),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $restaurant = $request->user();

        $validated = $request->validate([
            'nom'         => 'sometimes|string|max:255',
            'whatsapp'    => 'nullable|string|max:20',
            'adresse'     => 'nullable|string|max:500',
            'logo'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'remove_logo' => 'nullable|boolean',
        ]);

        if ($request->boolean('remove_logo') && $restaurant->logo) {
            Storage::disk('public')->delete($restaurant->logo);
            $restaurant->logo = null;
        }

        if ($request->hasFile('logo')) {
            if ($restaurant->logo) {
                Storage::disk('public')->delete($restaurant->logo);
            }
            $restaurant->logo = $request->file('logo')->store('logos', 'public');
        }

        unset($validated['remove_logo'], $validated['logo']);
        $restaurant->fill($validated);
        $restaurant->save();

        return response()->json([
            'message'    => 'Profil mis à jour',
            'restaurant' => $this->restaurantPayload($restaurant->fresh()),
            'regenerate_qr' => (bool) $request->hasFile('logo'),
        ]);
    }

    private function restaurantPayload(Restaurant $restaurant): array
    {
        return [
            'id'              => $restaurant->id,
            'nom'             => $restaurant->nom,
            'email'           => $restaurant->email,
            'whatsapp'        => $restaurant->whatsapp,
            'adresse'         => $restaurant->adresse,
            'logo'            => $restaurant->logo ? asset('storage/'.$restaurant->logo) : null,
            'plan'            => $restaurant->plan,
            'plan_expires_at' => $restaurant->plan_expires_at,
            'is_active'       => $restaurant->is_active,
            'tables_count'    => $restaurant->tables()->count(),
            'menus_count'     => $restaurant->menus()->count(),
            'orders_today'    => $restaurant->commandesAujourdhui()->count(),
            'limits'          => [
                'can_add_table'    => $restaurant->canAddTable(),
                'can_order'        => $restaurant->canAcceptOrder(),
                'max_tables_free'  => 3,
                'max_orders_free'  => 10,
                'whatsapp_enabled' => in_array($restaurant->plan, ['pro', 'enterprise'], true),
                'statistics'       => in_array($restaurant->plan, ['pro', 'enterprise'], true),
                'multi_admin'      => $restaurant->plan === 'enterprise',
            ],
        ];
    }
}
