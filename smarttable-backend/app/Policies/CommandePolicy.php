<?php

namespace App\Policies;

use App\Models\Commande;
use App\Models\Restaurant;

class CommandePolicy
{
    public function update(Restaurant $restaurant, Commande $commande): bool
    {
        return (int) $commande->restaurant_id === (int) $restaurant->id;
    }
}
