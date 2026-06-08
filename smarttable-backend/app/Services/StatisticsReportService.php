<?php

namespace App\Services;

use App\Models\Restaurant;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatisticsReportService
{
    public function buildReport(Restaurant $restaurant, string $period = 'week'): array
    {
        $period = in_array($period, ['day', 'week', 'month', 'year'], true) ? $period : 'week';

        return [
            'period'       => $period,
            'generated_at' => now()->toIso8601String(),
            'summary'      => $this->revenueSummary($restaurant->id),
            'revenue'      => $this->revenueSeries($restaurant->id, $period),
            'orders'       => $this->ordersSeries($restaurant->id, $period),
            'top_dishes'   => $this->topDishes($restaurant->id, $period),
            'top_tables'   => $this->topTables($restaurant->id, $period),
            'top_clients'  => $this->topClients($restaurant->id, $period),
        ];
    }

    public function revenueSummary(int $restaurantId): array
    {
        $base = fn () => $this->ordersBase($restaurantId);

        return [
            'daily'   => (float) (clone $base())->whereDate('commandes.created_at', today())->sum('commandes.total'),
            'weekly'  => (float) (clone $base())->whereBetween('commandes.created_at', [
                now()->startOfWeek(), now()->endOfWeek(),
            ])->sum('commandes.total'),
            'monthly' => (float) (clone $base())->whereMonth('commandes.created_at', now()->month)
                ->whereYear('commandes.created_at', now()->year)->sum('commandes.total'),
            'yearly'  => (float) (clone $base())->whereYear('commandes.created_at', now()->year)->sum('commandes.total'),
            'orders_daily'   => (clone $base())->whereDate('commandes.created_at', today())->count(),
            'orders_weekly'  => (clone $base())->whereBetween('commandes.created_at', [
                now()->startOfWeek(), now()->endOfWeek(),
            ])->count(),
            'orders_monthly' => (clone $base())->whereMonth('commandes.created_at', now()->month)
                ->whereYear('commandes.created_at', now()->year)->count(),
            'orders_yearly'  => (clone $base())->whereYear('commandes.created_at', now()->year)->count(),
        ];
    }

    private function revenueSeries(int $restaurantId, string $period): array
    {
        return match ($period) {
            'day'   => $this->hourlySeries($restaurantId),
            'week'  => $this->dailySeries($restaurantId, now()->startOfWeek(), now()->endOfWeek(), 'D'),
            'month' => $this->dailySeries($restaurantId, now()->startOfMonth(), now()->endOfMonth(), 'j'),
            'year'  => $this->monthlySeries($restaurantId),
            default => $this->dailySeries($restaurantId, now()->subDays(6)->startOfDay(), now()->endOfDay(), 'D'),
        };
    }

    private function ordersSeries(int $restaurantId, string $period): array
    {
        $revenue = $this->revenueSeries($restaurantId, $period);

        return [
            'total'  => array_sum(array_column($revenue['series'], 'orders')),
            'series' => array_map(fn ($row) => [
                'label'  => $row['label'],
                'orders' => $row['orders'],
            ], $revenue['series']),
        ];
    }

    private function hourlySeries(int $restaurantId): array
    {
        $data = $this->ordersBase($restaurantId)
            ->whereDate('commandes.created_at', today())
            ->selectRaw('HOUR(commandes.created_at) as bucket, COUNT(*) as orders, COALESCE(SUM(commandes.total), 0) as revenue')
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $series = [];
        $total = 0;
        for ($h = 0; $h < 24; $h++) {
            $row = $data->get($h);
            $rev = (float) ($row->revenue ?? 0);
            $total += $rev;
            $series[] = [
                'label'   => sprintf('%02dh', $h),
                'revenue' => round($rev, 2),
                'orders'  => (int) ($row->orders ?? 0),
            ];
        }

        return ['total' => round($total, 2), 'series' => $series];
    }

    private function dailySeries(int $restaurantId, Carbon $from, Carbon $to, string $labelFormat): array
    {
        $data = $this->ordersBase($restaurantId)
            ->whereBetween('commandes.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->selectRaw('DATE(commandes.created_at) as bucket, COUNT(*) as orders, COALESCE(SUM(commandes.total), 0) as revenue')
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get()
            ->keyBy(fn ($r) => $r->bucket);

        $series = [];
        $total = 0;
        $cursor = $from->copy()->startOfDay();

        while ($cursor->lte($to)) {
            $key = $cursor->toDateString();
            $row = $data->get($key);
            $rev = (float) ($row->revenue ?? 0);
            $total += $rev;
            $series[] = [
                'label'   => $labelFormat === 'j' ? $cursor->format('d/m') : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][$cursor->dayOfWeek],
                'date'    => $key,
                'revenue' => round($rev, 2),
                'orders'  => (int) ($row->orders ?? 0),
            ];
            $cursor->addDay();
        }

        return ['total' => round($total, 2), 'series' => $series];
    }

    private function monthlySeries(int $restaurantId): array
    {
        $from = now()->startOfYear();
        $to = now()->endOfYear();

        $data = $this->ordersBase($restaurantId)
            ->whereBetween('commandes.created_at', [$from, $to])
            ->selectRaw('MONTH(commandes.created_at) as bucket, COUNT(*) as orders, COALESCE(SUM(commandes.total), 0) as revenue')
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        $series = [];
        $total = 0;

        for ($m = 1; $m <= 12; $m++) {
            $row = $data->get($m);
            $rev = (float) ($row->revenue ?? 0);
            $total += $rev;
            $series[] = [
                'label'   => $months[$m - 1],
                'revenue' => round($rev, 2),
                'orders'  => (int) ($row->orders ?? 0),
            ];
        }

        return ['total' => round($total, 2), 'series' => $series];
    }

    public function topDishes(int $restaurantId, string $period, int $limit = 10): array
    {
        [$from, $to] = $this->periodRange($period);

        return $this->ordersBase($restaurantId)
            ->whereBetween('commandes.created_at', [$from, $to])
            ->join('menus', 'commandes.menu_id', '=', 'menus.id')
            ->select(
                'menus.nom_plat as name',
                DB::raw('SUM(commandes.quantite) as quantity'),
                DB::raw('COALESCE(SUM(commandes.total), 0) as revenue')
            )
            ->groupBy('menus.nom_plat')
            ->orderByDesc('quantity')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'name'     => $r->name,
                'quantity' => (int) $r->quantity,
                'revenue'  => (float) $r->revenue,
            ])
            ->values()
            ->all();
    }

    public function topTables(int $restaurantId, string $period, int $limit = 10): array
    {
        [$from, $to] = $this->periodRange($period);

        return $this->ordersBase($restaurantId)
            ->whereBetween('commandes.created_at', [$from, $to])
            ->join('table_restaurants', 'commandes.table_id', '=', 'table_restaurants.id')
            ->select(
                'table_restaurants.numero_table as number',
                'table_restaurants.nom as name',
                DB::raw('COUNT(*) as orders'),
                DB::raw('COALESCE(SUM(commandes.total), 0) as revenue')
            )
            ->groupBy('table_restaurants.id', 'table_restaurants.numero_table', 'table_restaurants.nom')
            ->orderByDesc('orders')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'label'   => $r->name ? "Table {$r->number} — {$r->name}" : "Table {$r->number}",
                'number'  => (int) $r->number,
                'orders'  => (int) $r->orders,
                'revenue' => (float) $r->revenue,
            ])
            ->values()
            ->all();
    }

    public function topClients(int $restaurantId, string $period, int $limit = 10): array
    {
        [$from, $to] = $this->periodRange($period);

        return $this->ordersBase($restaurantId)
            ->whereBetween('commandes.created_at', [$from, $to])
            ->whereNotNull('commandes.client_id')
            ->join('clients', 'commandes.client_id', '=', 'clients.id')
            ->select(
                'clients.nom_complet as name',
                'clients.telephone',
                DB::raw('COUNT(*) as orders'),
                DB::raw('COALESCE(SUM(commandes.total), 0) as revenue')
            )
            ->groupBy('clients.id', 'clients.nom_complet', 'clients.telephone')
            ->orderByDesc('orders')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'name'      => $r->name,
                'telephone' => $r->telephone,
                'orders'    => (int) $r->orders,
                'revenue'   => (float) $r->revenue,
            ])
            ->values()
            ->all();
    }

    private function periodRange(string $period): array
    {
        return match ($period) {
            'day'   => [today()->startOfDay(), today()->endOfDay()],
            'week'  => [now()->startOfWeek(), now()->endOfWeek()],
            'month' => [now()->startOfMonth(), now()->endOfMonth()],
            'year'  => [now()->startOfYear(), now()->endOfYear()],
            default => [now()->startOfWeek(), now()->endOfWeek()],
        };
    }

    private function ordersBase(int $restaurantId)
    {
        return DB::table('commandes')
            ->where('commandes.restaurant_id', $restaurantId)
            ->where('commandes.statut', '!=', 'cancelled');
    }
}
