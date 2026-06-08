<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_ingredient', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->decimal('quantite_utilisee', 12, 3)->default(1);
            $table->timestamps();

            $table->unique(['menu_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_ingredient');
    }
};
