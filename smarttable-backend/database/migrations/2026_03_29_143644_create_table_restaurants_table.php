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
        Schema::create('table_restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete(); 
            $table->integer('numero_table'); 
            $table->string('qr_code_url')->nullable(); 
            $table->string('nom')->nullable(); // ex: 'Terrasse 1' 
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['restaurant_id', 'numero_table']); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('table_restaurants');
    }
};
