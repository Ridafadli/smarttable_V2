<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'nom_plat',
        'prix',
        'type',
        'categorie',
        'variantes',
        'description',
        'image',
        'disponible',
        'ordre'
    ];

    protected $casts = [
        'disponible' => 'boolean',
        'prix'       => 'float',
        'variantes'  => 'array',
    ];

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function commandes()  { return $this->hasMany(Commande::class); }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'menu_ingredient')
            ->withPivot('quantite_utilisee')
            ->withTimestamps();
    }
}