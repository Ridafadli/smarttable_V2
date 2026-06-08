<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Statistiques — {{ $restaurant->nom }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; margin: 32px; }
        h1 { font-size: 20px; color: #312e81; margin: 0 0 4px; }
        .meta { color: #64748b; margin-bottom: 24px; font-size: 10px; }
        h2 { font-size: 13px; color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 24px 0 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #4f46e5; color: #fff; padding: 8px; text-align: left; font-size: 10px; }
        td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .kpi-grid { width: 100%; margin-bottom: 20px; }
        .kpi-grid td { text-align: center; background: #eef2ff; border: 1px solid #c7d2fe; padding: 12px; }
        .kpi-val { font-size: 16px; font-weight: bold; color: #312e81; }
        .kpi-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
        .right { text-align: right; }
    </style>
</head>
<body>
    <h1>{{ $restaurant->nom }}</h1>
    <p class="meta">Rapport statistiques — Période : {{ $periodLabel }} · {{ now()->format('d/m/Y H:i') }}</p>

    <table class="kpi-grid">
        <tr>
            <td><div class="kpi-val">{{ number_format($report['summary']['daily'], 2, ',', ' ') }} MAD</div><div class="kpi-label">CA Journalier</div></td>
            <td><div class="kpi-val">{{ number_format($report['summary']['weekly'], 2, ',', ' ') }} MAD</div><div class="kpi-label">CA Hebdomadaire</div></td>
            <td><div class="kpi-val">{{ number_format($report['summary']['monthly'], 2, ',', ' ') }} MAD</div><div class="kpi-label">CA Mensuel</div></td>
            <td><div class="kpi-val">{{ number_format($report['summary']['yearly'], 2, ',', ' ') }} MAD</div><div class="kpi-label">CA Annuel</div></td>
        </tr>
    </table>

    <h2>Évolution du chiffre d'affaires</h2>
    <table>
        <thead><tr><th>Période</th><th class="right">Commandes</th><th class="right">CA (MAD)</th></tr></thead>
        <tbody>
            @foreach($report['revenue']['series'] as $row)
            <tr>
                <td>{{ $row['label'] }}</td>
                <td class="right">{{ $row['orders'] }}</td>
                <td class="right">{{ number_format($row['revenue'], 2, ',', ' ') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h2>Plats les plus vendus</h2>
    <table>
        <thead><tr><th>Plat</th><th class="right">Quantité</th><th class="right">CA (MAD)</th></tr></thead>
        <tbody>
            @forelse($report['top_dishes'] as $row)
            <tr><td>{{ $row['name'] }}</td><td class="right">{{ $row['quantity'] }}</td><td class="right">{{ number_format($row['revenue'], 2, ',', ' ') }}</td></tr>
            @empty
            <tr><td colspan="3">Aucune donnée</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Tables les plus utilisées</h2>
    <table>
        <thead><tr><th>Table</th><th class="right">Commandes</th><th class="right">CA (MAD)</th></tr></thead>
        <tbody>
            @forelse($report['top_tables'] as $row)
            <tr><td>{{ $row['label'] }}</td><td class="right">{{ $row['orders'] }}</td><td class="right">{{ number_format($row['revenue'], 2, ',', ' ') }}</td></tr>
            @empty
            <tr><td colspan="3">Aucune donnée</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Clients les plus fidèles</h2>
    <table>
        <thead><tr><th>Client</th><th class="right">Commandes</th><th class="right">CA (MAD)</th></tr></thead>
        <tbody>
            @forelse($report['top_clients'] as $row)
            <tr><td>{{ $row['name'] }}</td><td class="right">{{ $row['orders'] }}</td><td class="right">{{ number_format($row['revenue'], 2, ',', ' ') }}</td></tr>
            @empty
            <tr><td colspan="3">Aucune donnée</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
