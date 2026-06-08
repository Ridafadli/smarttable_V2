<?php

namespace App\Services;

use App\Models\Commande;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\Notification;
use App\Models\StockMouvement;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function __construct(private NotificationService $notifications) {}
    public function deductForOrder(Commande $commande): array
    {
        if ($this->alreadyProcessed($commande->id, 'commande')) {
            return [];
        }

        $menu = $commande->menu ?? Menu::with('ingredients')->find($commande->menu_id);
        if (! $menu || $menu->ingredients->isEmpty()) {
            return [];
        }

        $alerts = [];

        DB::transaction(function () use ($commande, $menu, &$alerts) {
            foreach ($menu->ingredients as $ingredient) {
                $qty = (float) $ingredient->pivot->quantite_utilisee * $commande->quantite;
                if ($qty <= 0) {
                    continue;
                }

                $ingredient = Ingredient::lockForUpdate()->find($ingredient->id);
                if (! $ingredient) {
                    continue;
                }

                $this->applyMovement($ingredient, 'commande', -$qty, [
                    'commande_id' => $commande->id,
                    'motif'       => 'Commande #'.$commande->id.' — '.$menu->nom_plat,
                ]);

                if ($ingredient->fresh()->isLowStock()) {
                    $alerts[] = $ingredient->nom;
                    $this->notifyLowStockIfNeeded($ingredient->fresh());
                }
            }
        });

        return $alerts;
    }

    public function restoreForOrder(Commande $commande): void
    {
        if ($this->alreadyProcessed($commande->id, 'annulation')) {
            return;
        }

        if (! $this->alreadyProcessed($commande->id, 'commande')) {
            return;
        }

        $menu = $commande->menu ?? Menu::with('ingredients')->find($commande->menu_id);
        if (! $menu || $menu->ingredients->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($commande, $menu) {
            foreach ($menu->ingredients as $ingredient) {
                $qty = (float) $ingredient->pivot->quantite_utilisee * $commande->quantite;
                if ($qty <= 0) {
                    continue;
                }

                $ingredient = Ingredient::lockForUpdate()->find($ingredient->id);
                if (! $ingredient) {
                    continue;
                }

                $this->applyMovement($ingredient, 'annulation', $qty, [
                    'commande_id' => $commande->id,
                    'motif'       => 'Annulation commande #'.$commande->id,
                ]);
            }
        });
    }

    public function manualEntry(Ingredient $ingredient, float $quantite, ?string $motif = null): StockMouvement
    {
        return DB::transaction(function () use ($ingredient, $quantite, $motif) {
            $ingredient = Ingredient::lockForUpdate()->findOrFail($ingredient->id);

            return $this->applyMovement($ingredient, 'entree', abs($quantite), [
                'motif' => $motif ?? 'Entrée manuelle',
            ]);
        });
    }

    public function manualExit(Ingredient $ingredient, float $quantite, ?string $motif = null): StockMouvement
    {
        return DB::transaction(function () use ($ingredient, $quantite, $motif) {
            $ingredient = Ingredient::lockForUpdate()->findOrFail($ingredient->id);

            $movement = $this->applyMovement($ingredient, 'sortie', -abs($quantite), [
                'motif' => $motif ?? 'Sortie manuelle',
            ]);

            if ($ingredient->fresh()->isLowStock()) {
                $this->notifyLowStockIfNeeded($ingredient->fresh());
            }

            return $movement;
        });
    }

    private function applyMovement(Ingredient $ingredient, string $type, float $delta, array $extra = []): StockMouvement
    {
        $avant = (float) $ingredient->quantite_disponible;
        $apres = max(0, round($avant + $delta, 3));

        $ingredient->update(['quantite_disponible' => $apres]);

        return StockMouvement::create([
            'restaurant_id'  => $ingredient->restaurant_id,
            'ingredient_id'  => $ingredient->id,
            'type'           => $type,
            'quantite'       => abs($delta),
            'quantite_avant' => $avant,
            'quantite_apres' => $apres,
            'commande_id'    => $extra['commande_id'] ?? null,
            'motif'          => $extra['motif'] ?? null,
        ]);
    }

    private function alreadyProcessed(int $commandeId, string $type): bool
    {
        return StockMouvement::where('commande_id', $commandeId)
            ->where('type', $type)
            ->exists();
    }

    private function notifyLowStockIfNeeded(Ingredient $ingredient): void
    {
        $recent = Notification::where('restaurant_id', $ingredient->restaurant_id)
            ->where('type', 'stock_faible')
            ->where('created_at', '>=', now()->subHours(2))
            ->where('data->ingredient_id', $ingredient->id)
            ->exists();

        if (! $recent) {
            $this->notifications->notifyLowStock($ingredient);
        }
    }
}
