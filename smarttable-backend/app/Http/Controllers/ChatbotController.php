<?php

namespace App\Http\Controllers;

use App\Services\ChatbotService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class ChatbotController extends Controller
{
    public function __construct(private ChatbotService $chatbot) {}

    public function message(Request $request)
    {
        $validated = $request->validate([
            'message'       => 'required|string|max:500',
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id'      => 'required|exists:table_restaurants,id',
            'session_id'    => 'required|string|max:64',
        ]);

        $rateKey = 'chatbot:'.$validated['session_id'];
        if (RateLimiter::tooManyAttempts($rateKey, 20)) {
            return response()->json([
                'reply'   => 'Trop de messages, veuillez patienter.',
                'source'  => 'rate_limit',
                'error'   => 'rate_limit_exceeded',
            ], 429);
        }
        RateLimiter::hit($rateKey, 60);

        Log::info('Chatbot message', [
            'restaurant_id' => $validated['restaurant_id'],
            'table_id'      => $validated['table_id'],
            'session_id'    => $validated['session_id'],
            'message_len'   => strlen($validated['message']),
        ]);

        $result = $this->chatbot->reply(
            $validated['message'],
            (int) $validated['restaurant_id'],
            (int) $validated['table_id'],
            $validated['session_id'],
        );

        return response()->json([
            'reply'       => $result['reply'] ?? '',
            'source'      => $result['source'] ?? 'local',
            'meal_period' => $result['meal_period'] ?? null,
            'session_id'  => $validated['session_id'],
            'timestamp'   => now()->toIso8601String(),
        ]);
    }
}
