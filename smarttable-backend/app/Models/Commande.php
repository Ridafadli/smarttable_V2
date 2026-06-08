<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commande extends Model
{
    use HasFactory;

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
        'notes'
    ];

    protected $casts = [
        'total'    => 'float',
        'quantite' => 'integer',
    ];

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function client()     { return $this->belongsTo(Client::class); }
    public function menu()       { return $this->belongsTo(Menu::class); }
    public function table()      { return $this->belongsTo(TableRestaurant::class, 'table_id'); }
}