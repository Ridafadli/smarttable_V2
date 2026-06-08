<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facture_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('menu_id')->nullable()->constrained('menus')->nullOnDelete();
            $table->foreignId('commande_id')->nullable()->constrained('commandes')->nullOnDelete();
            $table->string('description');
            $table->unsignedInteger('quantite')->default(1);
            $table->decimal('prix_unitaire', 10, 2);
            $table->decimal('total_ligne', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture_lignes');
    }
};
