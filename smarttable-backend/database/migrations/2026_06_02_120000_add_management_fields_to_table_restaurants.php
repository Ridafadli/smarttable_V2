<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('table_restaurants', function (Blueprint $table) {
            $table->string('statut', 20)->default('disponible')->after('is_active');
            $table->unsignedTinyInteger('capacite')->default(4)->after('statut');
            $table->timestamp('occupied_at')->nullable()->after('capacite');
            $table->timestamp('reserved_until')->nullable()->after('occupied_at');
            $table->unsignedSmallInteger('pos_x')->nullable()->after('reserved_until');
            $table->unsignedSmallInteger('pos_y')->nullable()->after('pos_x');
        });
    }

    public function down(): void
    {
        Schema::table('table_restaurants', function (Blueprint $table) {
            $table->dropColumn([
                'statut',
                'capacite',
                'occupied_at',
                'reserved_until',
                'pos_x',
                'pos_y',
            ]);
        });
    }
};
