<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMouvement extends Model
{
    protected $fillable = [
        'restaurant_id',
        'ingredient_id',
        'type',
        'quantite',
        'quantite_avant',
        'quantite_apres',
        'commande_id',
        'motif',
    ];

    protected $casts = [
        'quantite'        => 'float',
        'quantite_avant'  => 'float',
        'quantite_apres'  => 'float',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class);
    }
}
