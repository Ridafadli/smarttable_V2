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
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->string('nom'); 
            $table->string('email')->unique(); 
            $table->string('whatsapp', 20)->nullable(); 
            $table->string('mot_de_passe'); 
            $table->string('logo')->nullable(); 
            $table->string('adresse')->nullable(); 
            $table->enum('plan', ['free','pro','enterprise'])->default('free'); 
            $table->timestamp('plan_expires_at')->nullable(); 
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes(); // scalabilité: soft delete 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
