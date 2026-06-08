<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\Restaurant;
use App\Models\TableRestaurant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotService
{
    public function reply(
        string $message,
        int $restaurantId,
        int $tableId,
        string $sessionId,
    ): array {
        $restaurant = Restaurant::findOrFail($restaurantId);
        $table = TableRestaurant::where('id', $tableId)
            ->where('restaurant_id', $restaurantId)
            ->firstOrFail();

        $mealType = MealTimeService::currentMealType();
        $menus = Menu::where('restaurant_id', $restaurantId)
            ->where('disponible', true)
            ->whereIn('type', MealTimeService::activeMenuTypes())
            ->orderBy('ordre')
            ->get(['id', 'nom_plat', 'prix', 'type', 'variantes']);

        $webhook = config('services.n8n.webhook_url');
        if ($webhook) {
            try {
                $response = Http::timeout(12)->post($webhook, [
                    'message'        => $message,
                    'restaurant_id'  => $restaurantId,
                    'table_id'       => $tableId,
                    'session_id'     => $sessionId,
                    'meal_period'    => $mealType,
                    'restaurant_nom' => $restaurant->nom,
                    'table_numero'   => $table->numero_table,
                    'menus'          => $menus,
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    return [
                        'reply'       => $data['reply'] ?? $data['message'] ?? 'Message reçu.',
                        'source'      => 'n8n',
                        'meal_period' => $mealType,
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('n8n webhook failed: '.$e->getMessage());
            }
        }

        return [
            'reply'       => $this->localReply($message, $restaurant, $table, $menus, $mealType),
            'source'      => 'local',
            'meal_period' => $mealType,
        ];
    }

    private function localReply(
        string $message,
        Restaurant $restaurant,
        TableRestaurant $table,
        $menus,
        string $mealType,
    ): string {
        $lower = mb_strtolower(trim($message));

        if (preg_match('/\b(menu|carte|plat|manger|commander|quoi)\b/u', $lower)) {
            if ($menus->isEmpty()) {
                return 'La carte du '.MealTimeService::label($mealType).' n\'a pas encore de plats disponibles. Utilisez l\'onglet « Commander » pour parcourir la carte dès qu\'elle sera complète.';
            }

            $lines = $menus->take(8)->map(fn ($m) => sprintf(
                '• %s — %.0f MAD%s',
                $m->nom_plat,
                $m->prix,
                $m->variantes ? ' (options disponibles)' : ''
            ))->implode("\n");

            return "Bonjour ! Voici notre sélection ".MealTimeService::label($mealType)." :\n\n{$lines}\n\nPour commander rapidement, ouvrez l'onglet **Commander** : choisissez votre plat, sauce et quantité, puis confirmez.";
        }

        if (preg_match('/\b(merci|thanks)\b/u', $lower)) {
            return 'Avec plaisir ! Bon appétit à la table '.$table->numero_table.'.';
        }

        if (preg_match('/\b(aide|help|bonjour|salut|hello)\b/u', $lower)) {
            return "Bienvenue chez {$restaurant->nom} (table {$table->numero_table}) ! Je peux vous présenter la carte (".MealTimeService::label($mealType)."). Utilisez l'onglet **Commander** pour passer commande, ou demandez-moi « le menu ».";
        }

        return "Je suis l'assistant {$restaurant->nom}. Demandez « le menu » ou passez commande via l'onglet **Commander**. Période actuelle : ".MealTimeService::label($mealType).'.';
    }
}
