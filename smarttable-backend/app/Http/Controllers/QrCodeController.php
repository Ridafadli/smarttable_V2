<?php

namespace App\Http\Controllers;

use App\Models\TableRestaurant;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Throwable;

class QrCodeController extends Controller
{
    public function __construct(private QrCodeService $qrCodes) {}

    public function generate(Request $request, $tableId)
    {
        $table = TableRestaurant::findOrFail($tableId);

        if ($table->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        try {
            $result = $this->qrCodes->generateForTable($table);

            return response()->json($result);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'error'   => 'Impossible de générer le QR code.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function download(Request $request, $tableId)
    {
        $table = TableRestaurant::findOrFail($tableId);

        if ($table->restaurant_id !== $request->user()->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        if (! $table->qr_code_url) {
            return response()->json(['error' => 'QR code non généré'], 404);
        }

        $path = str_replace('/storage/', '', $table->qr_code_url);
        $fullPath = storage_path('app/public/'.$path);

        if (! is_file($fullPath)) {
            return response()->json(['error' => 'Fichier QR introuvable'], 404);
        }

        $ext = pathinfo($fullPath, PATHINFO_EXTENSION) ?: 'svg';
        $mime = $ext === 'png' ? 'image/png' : 'image/svg+xml';

        return response()->download(
            $fullPath,
            "table_{$table->numero_table}_qrcode.{$ext}",
            ['Content-Type' => $mime]
        );
    }
}
