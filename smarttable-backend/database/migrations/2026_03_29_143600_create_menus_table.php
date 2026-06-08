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
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete(); 
            $table->string('nom_plat'); 
            $table->decimal('prix', 8, 2); 
            $table->enum('type', ['petit_dejeuner','dejeuner','diner','tout'])->default('tout'); 
            $table->string('image')->nullable(); 
            $table->text('description')->nullable(); 
            $table->boolean('disponible')->default(true); 
            $table->integer('ordre')->default(0); // pour trier l'affichage
            $table->timestamps();
            $table->index(['restaurant_id', 'type']); // optimisation requêtes 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
