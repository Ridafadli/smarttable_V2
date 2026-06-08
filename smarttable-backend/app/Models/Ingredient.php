<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    protected $fillable = [
        'restaurant_id',
        'nom',
        'unite',
        'quantite_disponible',
        'quantite_minimale',
        'categorie',
        'notes',
    ];

    protected $casts = [
        'quantite_disponible' => 'float',
        'quantite_minimale'   => 'float',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function mouvements(): HasMany
    {
        return $this->hasMany(StockMouvement::class);
    }

    public function menus(): BelongsToMany
    {
        return $this->belongsToMany(Menu::class, 'menu_ingredient')
            ->withPivot('quantite_utilisee')
            ->withTimestamps();
    }

    public function isLowStock(): bool
    {
        return $this->quantite_disponible <= $this->quantite_minimale;
    }

    public function stockPercent(): float
    {
        if ($this->quantite_minimale <= 0) {
            return $this->quantite_disponible > 0 ? 100 : 0;
        }

        return min(100, round(($this->quantite_disponible / ($this->quantite_minimale * 2)) * 100, 1));
    }
}
