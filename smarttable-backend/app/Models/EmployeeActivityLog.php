<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeActivityLog extends Model
{
    protected $fillable = [
        'restaurant_id',
        'employee_id',
        'action',
        'description',
        'metadata',
        'performed_by',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
