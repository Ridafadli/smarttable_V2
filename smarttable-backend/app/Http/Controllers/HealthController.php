<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $db = 'error';
        try {
            DB::connection()->getPdo();
            $db = 'connected';
        } catch (\Exception $e) {
        }

        return response()->json([
            'status'    => $db === 'connected' ? 'ok' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'database'  => $db,
            'version'   => '2.0.0',
            'services'  => [
                'n8n'        => config('services.n8n.webhook_url') ? 'configured' : 'not_configured',
                'whatsapp'   => config('services.twilio.sid') ? 'configured' : 'not_configured',
                'openai'     => config('services.openai.key') ? 'configured' : 'not_configured',
                'cloudinary' => config('cloudinary.cloud_name') ? 'configured' : 'not_configured',
            ],
        ]);
    }
}
