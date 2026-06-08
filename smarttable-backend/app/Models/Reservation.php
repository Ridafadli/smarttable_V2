<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    protected $fillable = [
        'restaurant_id',
        'client_id',
        'table_restaurant_id',
        'client_nom',
        'client_telephone',
        'date_reservation',
        'heure_reservation',
        'nombre_personnes',
        'statut',
        'duree_minutes',
        'notes',
    ];

    protected $casts = [
        'date_reservation'  => 'date',
        'nombre_personnes'  => 'integer',
        'duree_minutes'     => 'integer',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(TableRestaurant::class, 'table_restaurant_id');
    }
}
