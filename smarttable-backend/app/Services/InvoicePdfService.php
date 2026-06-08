<?php

namespace App\Services;

use App\Models\Facture;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\View;

class InvoicePdfService
{
    public function renderHtml(Facture $facture): string
    {
        $facture->load(['lignes', 'restaurant', 'client']);

        return View::make('invoices.pdf', [
            'facture'    => $facture,
            'restaurant' => $facture->restaurant,
            'lignes'     => $facture->lignes,
        ])->render();
    }

    public function generatePdf(Facture $facture): string
    {
        $html = $this->renderHtml($facture);

        if (! class_exists(Dompdf::class)) {
            throw new \RuntimeException('Dompdf n\'est pas installé. Exécutez: composer require dompdf/dompdf');
        }

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
