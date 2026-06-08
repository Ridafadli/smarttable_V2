<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('nom_complet');
            $table->string('telephone', 30);
            $table->string('email')->nullable();
            $table->string('adresse')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'telephone']);
            $table->index(['restaurant_id', 'nom_complet']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
