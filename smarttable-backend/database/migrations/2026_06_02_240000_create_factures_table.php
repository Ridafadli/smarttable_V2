<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('numero_facture');
            $table->string('session_id')->nullable();
            $table->date('date_facture');
            $table->decimal('sous_total', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->enum('statut', ['emise', 'annulee'])->default('emise');
            $table->string('client_nom')->nullable();
            $table->string('client_telephone')->nullable();
            $table->string('client_email')->nullable();
            $table->string('client_adresse')->nullable();
            $table->unsignedBigInteger('table_numero')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'numero_facture']);
            $table->index(['restaurant_id', 'date_facture']);
            $table->index(['restaurant_id', 'session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
