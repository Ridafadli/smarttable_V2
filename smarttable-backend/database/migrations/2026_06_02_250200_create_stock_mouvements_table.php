<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_mouvements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->enum('type', ['entree', 'sortie', 'ajustement', 'commande', 'annulation']);
            $table->decimal('quantite', 12, 3);
            $table->decimal('quantite_avant', 12, 3);
            $table->decimal('quantite_apres', 12, 3);
            $table->foreignId('commande_id')->nullable()->constrained('commandes')->nullOnDelete();
            $table->string('motif')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'created_at']);
            $table->index(['ingredient_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_mouvements');
    }
};
