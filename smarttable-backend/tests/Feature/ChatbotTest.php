<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Restaurant;
use App\Models\TableRestaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ChatbotTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        RateLimiter::clear('chatbot:test-session');
        RateLimiter::clear('chatbot:rate-limit-session');
    }

    /**
     * @return array{restaurant: Restaurant, table: TableRestaurant}
     */
    private function createChatbotFixtures(): array
    {
        $restaurant = Restaurant::create([
            'nom'          => 'Chatbot Resto',
            'email'        => uniqid('chatbot_').'@example.com',
            'mot_de_passe' => Hash::make('password123'),
            'plan'         => 'pro',
        ]);

        $table = TableRestaurant::create([
            'restaurant_id' => $restaurant->id,
            'numero_table'  => 5,
            'is_active'     => true,
        ]);

        Menu::create([
            'restaurant_id' => $restaurant->id,
            'nom_plat'      => 'Couscous Royal',
            'prix'          => 120.00,
            'type'          => 'tout',
            'disponible'    => true,
        ]);

        return compact('restaurant', 'table');
    }

    public function test_message_validates_required_fields(): void
    {
        $response = $this->postJson('/api/chatbot/message', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['message', 'restaurant_id', 'table_id', 'session_id']);
    }

    public function test_message_returns_successful_reply(): void
    {
        ['restaurant' => $restaurant, 'table' => $table] = $this->createChatbotFixtures();

        $response = $this->postJson('/api/chatbot/message', [
            'message'       => 'Bonjour, quel est le menu ?',
            'restaurant_id' => $restaurant->id,
            'table_id'      => $table->id,
            'session_id'    => 'test-session',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'reply',
                'source',
                'meal_period',
                'session_id',
                'timestamp',
            ])
            ->assertJsonPath('session_id', 'test-session')
            ->assertJson(fn ($json) => $json->whereType('reply', 'string')
                ->whereNot('reply', '')
                ->etc());
    }

    public function test_message_rate_limits_after_twenty_requests(): void
    {
        ['restaurant' => $restaurant, 'table' => $table] = $this->createChatbotFixtures();

        $payload = [
            'message'       => 'menu',
            'restaurant_id' => $restaurant->id,
            'table_id'      => $table->id,
            'session_id'    => 'rate-limit-session',
        ];

        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/chatbot/message', $payload)->assertOk();
        }

        $response = $this->postJson('/api/chatbot/message', $payload);

        $response->assertStatus(429)
            ->assertJsonPath('error', 'rate_limit_exceeded')
            ->assertJsonPath('source', 'rate_limit');
    }
}
