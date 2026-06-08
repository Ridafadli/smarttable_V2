<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->after('restaurant_id')->constrained('clients')->nullOnDelete();
        });

        Schema::table('commandes', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->after('restaurant_id')->constrained('clients')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('client_id');
        });

        Schema::table('commandes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('client_id');
        });
    }
};
