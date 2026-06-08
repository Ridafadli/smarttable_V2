<?php

namespace App\Services;

use App\Models\Commande;
use App\Models\Ingredient;
use App\Models\Notification;
use App\Models\Reservation;

class NotificationService
{
    public function notifyOrder(Commande $commande): Notification
    {
        $commande->loadMissing(['menu', 'table']);

        return $this->create(
            $commande->restaurant_id,
            'nouvelle_commande',
            'Nouvelle commande',
            sprintf(
                '%s × %s — Table %s',
                $commande->quantite,
                $commande->menu?->nom_plat ?? 'Article',
                $commande->table?->numero_table ?? '—'
            ),
            [
                'link'       => '/orders',
                'commande_id'=> $commande->id,
            ]
        );
    }

    public function notifyReservation(Reservation $reservation): Notification
    {
        $reservation->loadMissing('table');

        return $this->create(
            $reservation->restaurant_id,
            'nouvelle_reservation',
            'Nouvelle réservation',
            sprintf(
                '%s — %s · %s pers. · Table %s',
                $reservation->client_nom,
                $reservation->date_reservation->format('d/m/Y'),
                substr($reservation->heure_reservation, 0, 5),
                $reservation->table?->numero_table ?? '—'
            ),
            [
                'link'           => '/reservations',
                'reservation_id' => $reservation->id,
            ]
        );
    }

    public function notifyReservationCancelled(Reservation $reservation): Notification
    {
        return $this->create(
            $reservation->restaurant_id,
            'reservation_annulee',
            'Réservation annulée',
            sprintf(
                '%s — %s à %s',
                $reservation->client_nom,
                $reservation->date_reservation->format('d/m/Y'),
                substr($reservation->heure_reservation, 0, 5)
            ),
            [
                'link'           => '/reservations',
                'reservation_id' => $reservation->id,
            ]
        );
    }

    public function notifyLowStock(Ingredient $ingredient): Notification
    {
        return $this->create(
            $ingredient->restaurant_id,
            'stock_faible',
            'Stock faible',
            sprintf(
                '%s : %.2f %s restant(s) (min. %.2f %s)',
                $ingredient->nom,
                $ingredient->quantite_disponible,
                $ingredient->unite,
                $ingredient->quantite_minimale,
                $ingredient->unite
            ),
            [
                'link'          => '/stock',
                'ingredient_id' => $ingredient->id,
            ]
        );
    }

    private function create(int $restaurantId, string $type, string $title, string $message, array $data = []): Notification
    {
        return Notification::create([
            'restaurant_id' => $restaurantId,
            'type'          => $type,
            'title'         => $title,
            'message'       => $message,
            'data'          => $data,
        ]);
    }
}
