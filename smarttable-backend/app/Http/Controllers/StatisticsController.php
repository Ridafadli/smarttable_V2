<?php

namespace App\Http\Controllers;

use App\Services\StatisticsReportService;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StatisticsController extends Controller
{
    public function __construct(private StatisticsReportService $reportService) {}

    public function index(Request $request)
    {
        $restaurantId = $request->user()->id;

        $todayOrders = $request->user()->commandes()
            ->whereDate('created_at', today())
            ->count();

        $pendingOrders = $request->user()->commandes()
            ->where('statut', 'pending')
            ->count();

        $todayRevenue = $request->user()->commandes()
            ->whereDate('created_at', today())
            ->where('statut', '!=', 'cancelled')
            ->sum('total');

        $activeTables = $request->user()->tables()
            ->where('is_active', true)
            ->count();

        $popularDishes = DB::table('commandes')
            ->join('menus', 'commandes.menu_id', '=', 'menus.id')
            ->where('commandes.restaurant_id', $restaurantId)
            ->whereDate('commandes.created_at', today())
            ->where('commandes.statut', '!=', 'cancelled')
            ->select('menus.nom_plat', DB::raw('SUM(commandes.quantite) as total'))
            ->groupBy('menus.nom_plat')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'today_orders'   => $todayOrders,
            'pending_orders' => $pendingOrders,
            'today_revenue'  => $todayRevenue,
            'active_tables'  => $activeTables,
            'popular_dishes' => $popularDishes,
        ]);
    }

    public function daily(Request $request)
    {
        $restaurantId = $request->user()->id;

        $daily = DB::table('commandes')
            ->where('restaurant_id', $restaurantId)
            ->where('statut', '!=', 'cancelled')
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total_commandes, SUM(total) as chiffre')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($daily);
    }

    public function popularDishes(Request $request)
    {
        $restaurantId = $request->user()->id;

        $popular = DB::table('commandes')
            ->join('menus', 'commandes.menu_id', '=', 'menus.id')
            ->where('commandes.restaurant_id', $restaurantId)
            ->where('commandes.statut', '!=', 'cancelled')
            ->select('menus.nom_plat', DB::raw('SUM(commandes.quantite) as total'))
            ->groupBy('menus.nom_plat')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return response()->json($popular);
    }

    public function report(Request $request)
    {
        $period = $request->get('period', 'week');

        return response()->json(
            $this->reportService->buildReport($request->user(), $period)
        );
    }

    public function exportPdf(Request $request)
    {
        $period = $request->get('period', 'month');
        $report = $this->reportService->buildReport($request->user(), $period);
        $restaurant = $request->user();

        $html = View::make('statistics.export-pdf', [
            'report'     => $report,
            'restaurant' => $restaurant,
            'periodLabel'=> $this->periodLabel($period),
        ])->render();

        if (! class_exists(Dompdf::class)) {
            return response()->json(['error' => 'Dompdf non disponible'], 503);
        }

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'statistiques-'.$period.'-'.now()->format('Y-m-d').'.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function exportExcel(Request $request): StreamedResponse
    {
        $period = $request->get('period', 'month');
        $report = $this->reportService->buildReport($request->user(), $period);
        $filename = 'statistiques-'.$period.'-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($report, $period) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($out, ['Rapport statistiques SmartTable', $this->periodLabel($period)], ';');
            fputcsv($out, ['Généré le', now()->format('d/m/Y H:i')], ';');
            fputcsv($out, [], ';');

            fputcsv($out, ['Résumé CA', 'Montant (MAD)', 'Commandes'], ';');
            fputcsv($out, ['Journalier', $report['summary']['daily'], $report['summary']['orders_daily']], ';');
            fputcsv($out, ['Hebdomadaire', $report['summary']['weekly'], $report['summary']['orders_weekly']], ';');
            fputcsv($out, ['Mensuel', $report['summary']['monthly'], $report['summary']['orders_monthly']], ';');
            fputcsv($out, ['Annuel', $report['summary']['yearly'], $report['summary']['orders_yearly']], ';');
            fputcsv($out, [], ';');

            fputcsv($out, ['Évolution', 'CA (MAD)', 'Commandes'], ';');
            foreach ($report['revenue']['series'] as $row) {
                fputcsv($out, [$row['label'], $row['revenue'], $row['orders']], ';');
            }
            fputcsv($out, [], ';');

            fputcsv($out, ['Top plats', 'Quantité', 'CA (MAD)'], ';');
            foreach ($report['top_dishes'] as $row) {
                fputcsv($out, [$row['name'], $row['quantity'], $row['revenue']], ';');
            }
            fputcsv($out, [], ';');

            fputcsv($out, ['Top tables', 'Commandes', 'CA (MAD)'], ';');
            foreach ($report['top_tables'] as $row) {
                fputcsv($out, [$row['label'], $row['orders'], $row['revenue']], ';');
            }
            fputcsv($out, [], ';');

            fputcsv($out, ['Top clients', 'Commandes', 'CA (MAD)'], ';');
            foreach ($report['top_clients'] as $row) {
                fputcsv($out, [$row['name'], $row['orders'], $row['revenue']], ';');
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function periodLabel(string $period): string
    {
        return match ($period) {
            'day'   => 'Journalier',
            'week'  => 'Hebdomadaire',
            'month' => 'Mensuel',
            'year'  => 'Annuel',
            default => 'Hebdomadaire',
        };
    }
}
