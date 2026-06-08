<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('nom');
            $table->string('prenom')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone', 30)->nullable();
            $table->enum('role', ['admin', 'manager', 'serveur', 'cuisinier'])->default('serveur');
            $table->json('permissions')->nullable();
            $table->date('date_embauche')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['restaurant_id', 'email']);
            $table->index(['restaurant_id', 'role']);
            $table->index(['restaurant_id', 'nom']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
