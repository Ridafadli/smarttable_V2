<?php

namespace App\Http\Controllers;

use App\Services\ChatbotService;
use Illuminate\Http\Request;

class ChatbotController extends Controller
{
    public function __construct(private ChatbotService $chatbot) {}

    public function message(Request $request)
    {
        $validated = $request->validate([
            'message'       => 'required|string|max:1000',
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id'      => 'required|exists:table_restaurants,id',
            'session_id'    => 'required|string|max:64',
        ]);

        $result = $this->chatbot->reply(
            $validated['message'],
            (int) $validated['restaurant_id'],
            (int) $validated['table_id'],
            $validated['session_id'],
        );

        return response()->json($result);
    }
}
