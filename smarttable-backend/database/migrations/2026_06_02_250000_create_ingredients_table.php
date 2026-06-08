<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('nom');
            $table->string('unite', 20)->default('pcs');
            $table->decimal('quantite_disponible', 12, 3)->default(0);
            $table->decimal('quantite_minimale', 12, 3)->default(0);
            $table->string('categorie')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'nom']);
            $table->index(['restaurant_id', 'quantite_disponible']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
