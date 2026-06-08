<?php

namespace App\Models; 
 
use Illuminate\Foundation\Auth\User as Authenticatable; 
use Laravel\Sanctum\HasApiTokens; 
use Illuminate\Database\Eloquent\SoftDeletes; 
 
class Restaurant extends Authenticatable 
{ 
    use HasApiTokens, SoftDeletes; 
 
    protected $fillable = [ 
        'nom', 'email', 'whatsapp', 'mot_de_passe', 'logo', 'adresse', 'plan' 
    ]; 
 
    protected $hidden = ['mot_de_passe', 'remember_token']; 
 
    protected $casts = [ 
        'plan_expires_at' => 'datetime', 
        'is_active'       => 'boolean', 
    ]; 
 
    // Relations 
    public function menus()      { return $this->hasMany(Menu::class); } 
    public function tables()     { return $this->hasMany(TableRestaurant::class); } 
    public function commandes()  { return $this->hasMany(Commande::class); } 
    public function reservations() { return $this->hasMany(Reservation::class); }
    public function clients()      { return $this->hasMany(Client::class); }
    public function factures()     { return $this->hasMany(Facture::class); }
    public function notifications() { return $this->hasMany(Notification::class); }
    public function employees()     { return $this->hasMany(Employee::class); }
 
    // Scope: commandes aujourd'hui 
    public function commandesAujourdhui() 
    { 
        return $this->commandes()->whereDate('created_at', today()); 
    } 
 
    // Vérification plan 
    public function canAddTable(): bool 
    { 
        if ($this->plan !== 'free') return true; 
        return $this->tables()->count() < 3; 
    } 
 
    public function canAcceptOrder(): bool 
    { 
        if ($this->plan !== 'free') return true; 
        return $this->commandesAujourdhui()->count() < 10; 
    } 
} 