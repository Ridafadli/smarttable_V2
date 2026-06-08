<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactureLigne extends Model
{
    protected $fillable = [
        'facture_id',
        'menu_id',
        'commande_id',
        'description',
        'quantite',
        'prix_unitaire',
        'total_ligne',
    ];

    protected $casts = [
        'quantite'      => 'integer',
        'prix_unitaire' => 'float',
        'total_ligne'   => 'float',
    ];

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class);
    }
}
