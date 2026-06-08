<?php

namespace Tests\Feature;

use App\Models\Restaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_restaurant_and_returns_token(): void
    {
        $response = $this->postJson('/api/register', [
            'nom'                      => 'Le Petit Bistro',
            'email'                    => 'bistro@example.com',
            'mot_de_passe'             => 'secretpass',
            'mot_de_passe_confirmation'=> 'secretpass',
            'whatsapp'                 => '+212600000000',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'message',
                'restaurant' => ['id', 'nom', 'email', 'plan'],
                'token',
            ])
            ->assertJsonPath('restaurant.email', 'bistro@example.com')
            ->assertJsonPath('restaurant.plan', 'free');

        $this->assertDatabaseHas('restaurants', [
            'email' => 'bistro@example.com',
            'plan'  => 'free',
        ]);
    }

    public function test_register_validates_required_fields(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['nom', 'email', 'mot_de_passe']);
    }

    public function test_login_with_valid_credentials(): void
    {
        Restaurant::create([
            'nom'          => 'Café Central',
            'email'        => 'cafe@example.com',
            'mot_de_passe' => Hash::make('password123'),
            'plan'         => 'free',
        ]);

        $response = $this->postJson('/api/login', [
            'email'        => 'cafe@example.com',
            'mot_de_passe' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'restaurant' => ['id', 'nom', 'email'],
                'token',
            ])
            ->assertJsonPath('restaurant.email', 'cafe@example.com');
    }

    public function test_login_with_invalid_credentials(): void
    {
        Restaurant::create([
            'nom'          => 'Café Central',
            'email'        => 'cafe@example.com',
            'mot_de_passe' => Hash::make('password123'),
            'plan'         => 'free',
        ]);

        $response = $this->postJson('/api/login', [
            'email'        => 'cafe@example.com',
            'mot_de_passe' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_logout_revokes_token(): void
    {
        $restaurant = Restaurant::create([
            'nom'          => 'Logout Test',
            'email'        => 'logout@example.com',
            'mot_de_passe' => Hash::make('password123'),
            'plan'         => 'free',
        ]);

        Sanctum::actingAs($restaurant);

        $response = $this->postJson('/api/logout');

        $response->assertOk()
            ->assertJsonPath('message', 'Déconnecté avec succès');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_me_returns_authenticated_restaurant(): void
    {
        $restaurant = Restaurant::create([
            'nom'          => 'Me Test',
            'email'        => 'me@example.com',
            'mot_de_passe' => Hash::make('password123'),
            'plan'         => 'pro',
        ]);

        Sanctum::actingAs($restaurant);

        $response = $this->getJson('/api/me');

        $response->assertOk()
            ->assertJsonStructure([
                'restaurant' => [
                    'id',
                    'nom',
                    'email',
                    'plan',
                    'limits' => [
                        'can_add_table',
                        'can_order',
                        'max_tables_free',
                        'max_orders_free',
                    ],
                ],
            ])
            ->assertJsonPath('restaurant.email', 'me@example.com')
            ->assertJsonPath('restaurant.plan', 'pro');
    }

    public function test_me_requires_authentication(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertUnauthorized();
    }
}
