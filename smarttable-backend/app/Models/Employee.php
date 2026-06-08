<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'restaurant_id',
        'nom',
        'prenom',
        'email',
        'telephone',
        'role',
        'permissions',
        'date_embauche',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'permissions'    => 'array',
        'date_embauche'  => 'date',
        'is_active'      => 'boolean',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(EmployeeActivityLog::class);
    }

    public function getNomCompletAttribute(): string
    {
        return trim($this->prenom.' '.$this->nom);
    }
}
