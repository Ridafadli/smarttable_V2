<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Facture extends Model
{
    protected $fillable = [
        'restaurant_id',
        'client_id',
        'numero_facture',
        'session_id',
        'date_facture',
        'sous_total',
        'total',
        'statut',
        'client_nom',
        'client_telephone',
        'client_email',
        'client_adresse',
        'table_numero',
        'notes',
    ];

    protected $casts = [
        'date_facture' => 'date',
        'sous_total'   => 'float',
        'total'        => 'float',
        'table_numero' => 'integer',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }

    public static function generateNumero(int $restaurantId): string
    {
        $year = now()->year;
        $prefix = "FAC-{$year}-";

        $last = static::where('restaurant_id', $restaurantId)
            ->where('numero_facture', 'like', $prefix.'%')
            ->orderByDesc('numero_facture')
            ->value('numero_facture');

        $seq = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }
}
