<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Services\MealTimeService;
use App\Services\MenuImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MenuController extends Controller
{
    private const IMAGE_RULES = 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048';

    public function __construct(private MenuImageService $menuImages) {}

    public function index(Request $request)
    {
        $menus = $request->user()->menus()
            ->orderBy('type')->orderBy('ordre')
            ->get();

        return response()->json($menus);
    }

    public function publicIndex($restaurantId)
    {
        $mealType = MealTimeService::currentMealType();

        $menus = Menu::where('restaurant_id', $restaurantId)
            ->where('disponible', true)
            ->whereIn('type', MealTimeService::activeMenuTypes())
            ->orderBy('ordre')
            ->orderBy('nom_plat')
            ->get()
            ->map(fn (Menu $menu) => $this->menuWithImageUrl($menu));

        return response()->json([
            'menus'       => $menus,
            'meal_period' => [
                'type'  => $mealType,
                'label' => MealTimeService::label($mealType),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_plat'    => 'required|string|max:255',
            'prix'        => 'required|numeric|min:0',
            'type'        => 'required|in:petit_dejeuner,dejeuner,diner,tout',
            'categorie'   => 'nullable|string|max:100',
            'variantes'   => 'nullable|string',
            'description' => 'nullable|string',
            'image'       => self::IMAGE_RULES,
            'disponible'  => 'nullable',
            'ordre'       => 'nullable|integer',
        ]);

        if (isset($validated['variantes'])) {
            $validated['variantes'] = json_decode($validated['variantes'], true);
        }

        if (isset($validated['disponible'])) {
            $validated['disponible'] = filter_var($validated['disponible'], FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('menus', 'public');
        }

        $menu = $request->user()->menus()->create($validated);

        if (! $request->hasFile('image') && empty($menu->image)) {
            $this->menuImages->assignAutoImage($menu);
            $menu->refresh();
        }

        return response()->json($this->menuWithImageUrl($menu), 201);
    }

    public function update(Request $request, Menu $menu)
    {
        if ($menu->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'nom_plat'    => 'sometimes|string|max:255',
            'prix'        => 'sometimes|numeric|min:0',
            'type'        => 'sometimes|in:petit_dejeuner,dejeuner,diner,tout',
            'categorie'   => 'nullable|string|max:100',
            'variantes'   => 'nullable|string',
            'description' => 'nullable|string',
            'disponible'  => 'nullable',
            'ordre'       => 'nullable|integer',
            'image'        => self::IMAGE_RULES,
            'remove_image' => 'nullable|boolean',
        ]);

        if (isset($validated['variantes'])) {
            $validated['variantes'] = json_decode($validated['variantes'], true);
        }

        if (isset($validated['disponible'])) {
            $validated['disponible'] = filter_var($validated['disponible'], FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->boolean('remove_image')) {
            $this->deleteStoredImage($menu->image);
            $validated['image'] = null;
        }

        if ($request->hasFile('image')) {
            $this->deleteStoredImage($menu->image);
            $validated['image'] = $request->file('image')->store('menus', 'public');
        }

        unset($validated['remove_image']);

        $menu->update($validated);
        $menu->refresh();

        return response()->json($this->menuWithImageUrl($menu));
    }

    public function regenerateImage(Request $request, Menu $menu)
    {
        if ($menu->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        if ($request->hasFile('image')) {
            return response()->json(['error' => 'Supprimez l\'image manuelle avant de régénérer'], 422);
        }

        $this->deleteStoredImage($menu->image);
        $url = $this->menuImages->assignAutoImage($menu);
        $menu->refresh();

        return response()->json([
            'menu'    => $menu,
            'image'   => $menu->image,
            'message' => $url ? 'Image générée automatiquement' : 'Aucune image trouvée',
        ]);
    }

    public function destroy(Request $request, Menu $menu)
    {
        if ($menu->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $this->deleteStoredImage($menu->image);
        $menu->delete();

        return response()->json(['message' => 'Menu supprimé']);
    }

    private function deleteStoredImage(?string $image): void
    {
        if ($image && ! $this->menuImages->isExternalUrl($image)) {
            Storage::disk('public')->delete($image);
        }
    }

    private function menuWithImageUrl(Menu $menu): Menu
    {
        $menu->setAttribute('image_url', $this->resolveImageUrl($menu));

        return $menu;
    }

    private function resolveImageUrl(Menu $menu): ?string
    {
        if (! $menu->image) {
            return null;
        }

        if ($this->menuImages->isExternalUrl($menu->image)) {
            return $menu->image;
        }

        return asset('storage/'.$menu->image);
    }
}
