<?php

namespace Tests\Feature;

use App\Models\Commande;
use App\Models\Menu;
use App\Models\Restaurant;
use App\Models\TableRestaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommandeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{restaurant: Restaurant, table: TableRestaurant, menu: Menu}
     */
    private function createRestaurantFixtures(array $restaurantOverrides = []): array
    {
        $restaurant = Restaurant::create([
            'nom'          => $restaurantOverrides['nom'] ?? 'Restaurant Test',
            'email'        => $restaurantOverrides['email'] ?? uniqid('resto_').'@example.com',
            'mot_de_passe' => Hash::make('password123'),
            'plan'         => $restaurantOverrides['plan'] ?? 'pro',
            'is_active'    => $restaurantOverrides['is_active'] ?? true,
        ]);

        $table = TableRestaurant::create([
            'restaurant_id' => $restaurant->id,
            'numero_table'  => 1,
            'is_active'     => true,
        ]);

        $menu = Menu::create([
            'restaurant_id' => $restaurant->id,
            'nom_plat'      => 'Tajine Poulet',
            'prix'          => 85.00,
            'type'          => 'tout',
            'disponible'    => true,
        ]);

        return compact('restaurant', 'table', 'menu');
    }

    public function test_public_store_creates_order(): void
    {
        ['restaurant' => $restaurant, 'table' => $table, 'menu' => $menu] = $this->createRestaurantFixtures();

        $response = $this->postJson('/api/orders', [
            'restaurant_id' => $restaurant->id,
            'table_id'      => $table->id,
            'menu_id'       => $menu->id,
            'quantite'      => 2,
            'sauce'         => 'Harissa',
            'session_id'    => 'session-abc',
            'notes'         => 'Sans oignons',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Commande enregistrée avec succès!')
            ->assertJsonPath('commande.restaurant_id', $restaurant->id)
            ->assertJsonPath('commande.table_id', $table->id)
            ->assertJsonPath('commande.menu_id', $menu->id)
            ->assertJsonPath('commande.statut', 'confirmed')
            ->assertJsonPath('commande.quantite', 2)
            ->assertJsonPath('commande.total', 170);

        $this->assertDatabaseHas('commandes', [
            'restaurant_id' => $restaurant->id,
            'table_id'      => $table->id,
            'menu_id'       => $menu->id,
            'quantite'      => 2,
            'statut'        => 'confirmed',
        ]);
    }

    public function test_public_store_rejects_foreign_table(): void
    {
        ['restaurant' => $restaurantA, 'menu' => $menuA] = $this->createRestaurantFixtures([
            'email' => 'resto-a@example.com',
        ]);
        ['table' => $tableB] = $this->createRestaurantFixtures([
            'email' => 'resto-b@example.com',
        ]);

        $response = $this->postJson('/api/orders', [
            'restaurant_id' => $restaurantA->id,
            'table_id'      => $tableB->id,
            'menu_id'       => $menuA->id,
            'quantite'      => 1,
        ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'Cette table n\'appartient pas à ce restaurant ou est inactive.');
    }

    public function test_public_store_rejects_foreign_menu(): void
    {
        ['restaurant' => $restaurantA, 'table' => $tableA] = $this->createRestaurantFixtures([
            'email' => 'resto-a-menu@example.com',
        ]);
        ['menu' => $menuB] = $this->createRestaurantFixtures([
            'email' => 'resto-b-menu@example.com',
        ]);

        $response = $this->postJson('/api/orders', [
            'restaurant_id' => $restaurantA->id,
            'table_id'      => $tableA->id,
            'menu_id'       => $menuB->id,
            'quantite'      => 1,
        ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'Ce plat n\'appartient pas à ce restaurant ou n\'est pas disponible.');
    }

    public function test_free_plan_blocks_eleventh_daily_order(): void
    {
        ['restaurant' => $restaurant, 'table' => $table, 'menu' => $menu] = $this->createRestaurantFixtures([
            'plan'  => 'free',
            'email' => 'free-plan@example.com',
        ]);

        for ($i = 0; $i < 10; $i++) {
            Commande::create([
                'restaurant_id' => $restaurant->id,
                'table_id'      => $table->id,
                'menu_id'       => $menu->id,
                'quantite'      => 1,
                'statut'        => 'confirmed',
                'total'         => 85.00,
            ]);
        }

        $response = $this->postJson('/api/orders', [
            'restaurant_id' => $restaurant->id,
            'table_id'      => $table->id,
            'menu_id'       => $menu->id,
            'quantite'      => 1,
        ]);

        $response->assertForbidden()
            ->assertJsonPath('required_plan', 'pro')
            ->assertJsonPath('current_plan', 'free');
    }

    public function test_admin_index_returns_only_own_orders(): void
    {
        ['restaurant' => $restaurantA, 'table' => $tableA, 'menu' => $menuA] = $this->createRestaurantFixtures([
            'email' => 'owner-a@example.com',
        ]);
        ['restaurant' => $restaurantB, 'table' => $tableB, 'menu' => $menuB] = $this->createRestaurantFixtures([
            'email' => 'owner-b@example.com',
        ]);

        $ownOrder = Commande::create([
            'restaurant_id' => $restaurantA->id,
            'table_id'      => $tableA->id,
            'menu_id'       => $menuA->id,
            'quantite'      => 1,
            'statut'        => 'confirmed',
            'total'         => 85.00,
        ]);

        Commande::create([
            'restaurant_id' => $restaurantB->id,
            'table_id'      => $tableB->id,
            'menu_id'       => $menuB->id,
            'quantite'      => 1,
            'statut'        => 'confirmed',
            'total'         => 90.00,
        ]);

        Sanctum::actingAs($restaurantA);

        $response = $this->getJson('/api/orders');

        $response->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertSame([$ownOrder->id], $ids);
    }

    public function test_update_status_changes_order_status(): void
    {
        ['restaurant' => $restaurant, 'table' => $table, 'menu' => $menu] = $this->createRestaurantFixtures();

        $commande = Commande::create([
            'restaurant_id' => $restaurant->id,
            'table_id'      => $table->id,
            'menu_id'       => $menu->id,
            'quantite'      => 1,
            'statut'        => 'confirmed',
            'total'         => 85.00,
        ]);

        Sanctum::actingAs($restaurant);

        $response = $this->patchJson("/api/orders/{$commande->id}/status", [
            'statut' => 'preparing',
        ]);

        $response->assertOk()
            ->assertJsonPath('statut', 'preparing');

        $this->assertDatabaseHas('commandes', [
            'id'     => $commande->id,
            'statut' => 'preparing',
        ]);
    }

    public function test_update_status_denied_for_other_tenant(): void
    {
        ['restaurant' => $restaurantA, 'table' => $tableA, 'menu' => $menuA] = $this->createRestaurantFixtures([
            'email' => 'tenant-a@example.com',
        ]);
        ['restaurant' => $restaurantB] = $this->createRestaurantFixtures([
            'email' => 'tenant-b@example.com',
        ]);

        $commande = Commande::create([
            'restaurant_id' => $restaurantA->id,
            'table_id'      => $tableA->id,
            'menu_id'       => $menuA->id,
            'quantite'      => 1,
            'statut'        => 'confirmed',
            'total'         => 85.00,
        ]);

        Sanctum::actingAs($restaurantB);

        $response = $this->patchJson("/api/orders/{$commande->id}/status", [
            'statut' => 'ready',
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('commandes', [
            'id'     => $commande->id,
            'statut' => 'confirmed',
        ]);
    }
}
