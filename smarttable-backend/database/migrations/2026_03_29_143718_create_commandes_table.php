<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete(); 
            $table->foreignId('table_id')->constrained('table_restaurants'); 
            $table->foreignId('menu_id')->constrained('menus'); 
            $table->string('sauce')->nullable(); 
            $table->integer('quantite')->default(1); 
            $table->enum('statut', ['pending','confirmed','preparing','ready','delivered','cancelled']) ->default('pending'); 
            $table->string('session_id')->nullable(); // grouper commandes d'une session 
            $table->decimal('total', 8, 2)->nullable(); 
            $table->text('notes')->nullable(); 
            $table->timestamps();
            $table->index(['restaurant_id', 'statut']); // optimisation dashboard 
        $table->index(['restaurant_id', 'created_at']); // optimisation statistiques
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commandes');
    }
};
