<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRestaurantPlan
{
    public function handle(Request $request, Closure $next, string $feature)
    {
        $restaurant = $request->user();

        $allowed = match($feature) {
            'whatsapp'    => in_array($restaurant->plan, ['pro', 'enterprise']),
            'statistics'  => in_array($restaurant->plan, ['pro', 'enterprise']),
            'multi_admin' => $restaurant->plan === 'enterprise',
            default       => true,
        };

        if (!$allowed) {
            return response()->json([
                'error'   => 'Fonctionnalité réservée au plan Pro ou supérieur.',
                'upgrade' => '/pricing',
                'plan'    => $restaurant->plan,
            ], 403);
        }

        return $next($request);
    }
}