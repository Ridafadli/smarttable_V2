<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function __invoke()
    {
        $dbStatus = 'error';
        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
        } catch (\Throwable) {
            $dbStatus = 'error';
        }

        return response()->json([
            'status'    => $dbStatus === 'connected' ? 'ok' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'database'  => $dbStatus,
            'version'   => '2.0.0',
            'services'  => [
                'n8n'      => $this->configured('services.n8n.webhook_url'),
                'whatsapp' => $this->configured('services.twilio.sid') && $this->configured('services.twilio.token'),
                'openai'   => $this->configured('services.openai.key') || $this->configured('openai.api_key'),
            ],
        ]);
    }

    private function configured(string $key): string
    {
        $value = config($key);

        return filled($value) ? 'configured' : 'not_configured';
    }
}
