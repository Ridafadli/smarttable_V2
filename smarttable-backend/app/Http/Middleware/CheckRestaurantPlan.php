<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRestaurantPlan
{
    private const REQUIRED_PLANS = [
        'statistics'  => ['pro', 'enterprise'],
        'whatsapp'    => ['pro', 'enterprise'],
        'multi_admin' => ['enterprise'],
    ];

    private const LABELS = [
        'statistics'  => 'Pro',
        'whatsapp'    => 'Pro',
        'multi_admin' => 'Enterprise',
    ];

    public function handle(Request $request, Closure $next, string $feature)
    {
        $restaurant = $request->user();
        $allowedPlans = self::REQUIRED_PLANS[$feature] ?? [];
        $allowed = in_array($restaurant->plan, $allowedPlans, true);

        if (! $allowed) {
            $required = self::LABELS[$feature] ?? 'Pro';

            return response()->json([
                'message'       => "Cette fonctionnalité nécessite le plan {$required}.",
                'required_plan' => strtolower($required),
                'current_plan'  => $restaurant->plan,
                'upgrade_url'   => '/subscription',
                'error'         => 'plan_required',
            ], 403);
        }

        return $next($request);
    }
}
