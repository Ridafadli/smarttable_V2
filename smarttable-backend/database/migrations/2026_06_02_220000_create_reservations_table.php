<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignId('table_restaurant_id')->constrained('table_restaurants')->cascadeOnDelete();
            $table->string('client_nom');
            $table->string('client_telephone', 30);
            $table->date('date_reservation');
            $table->time('heure_reservation');
            $table->unsignedTinyInteger('nombre_personnes');
            $table->enum('statut', ['confirmee', 'en_attente', 'annulee'])->default('en_attente');
            $table->unsignedSmallInteger('duree_minutes')->default(120);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'date_reservation']);
            $table->index(['table_restaurant_id', 'date_reservation']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
