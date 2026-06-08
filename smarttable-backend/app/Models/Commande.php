<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commande extends Model
{
    use HasFactory;

    public const STATUTS = [
        'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled',
    ];

    protected $fillable = [
        'restaurant_id',
        'client_id',
        'table_id',
        'menu_id',
        'sauce',
        'quantite',
        'statut',
        'session_id',
        'total',
        'notes',
    ];

    protected $casts = [
        'total'    => 'float',
        'quantite' => 'integer',
        'statut'   => 'string',
    ];

    protected $appends = ['formatted_total'];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }

    public function table()
    {
        return $this->belongsTo(TableRestaurant::class, 'table_id');
    }

    public function scopeForRestaurant(Builder $query, int $restaurantId): Builder
    {
        return $query->where('restaurant_id', $restaurantId);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('statut', $status);
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month);
    }

    public function getFormattedTotalAttribute(): string
    {
        return number_format((float) $this->total, 2, ',', ' ').' MAD';
    }
}
