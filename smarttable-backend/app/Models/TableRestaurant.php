<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TableRestaurant extends Model
{
    use HasFactory;

    protected $table = 'table_restaurants';

    protected $fillable = [
        'restaurant_id',
        'numero_table',
        'qr_code_url',
        'nom',
        'is_active',
        'statut',
        'capacite',
        'occupied_at',
        'reserved_until',
        'pos_x',
        'pos_y',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'capacite'       => 'integer',
        'occupied_at'    => 'datetime',
        'reserved_until' => 'datetime',
        'pos_x'          => 'integer',
        'pos_y'          => 'integer',
    ];

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function commandes()  { return $this->hasMany(Commande::class, 'table_id'); }
    public function reservations() { return $this->hasMany(Reservation::class, 'table_restaurant_id'); }
}