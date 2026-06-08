<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $facture->numero_facture }} — Impression</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5; background: #fff; }
        .page { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
        .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #312e81; }
        .brand-sub { font-size: 12px; color: #64748b; margin-top: 6px; }
        .invoice-title h1 { font-size: 28px; color: #4f46e5; text-align: right; }
        .invoice-meta { text-align: right; font-size: 12px; color: #64748b; margin-top: 8px; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
        .box-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; margin-bottom: 8px; }
        .box-name { font-size: 15px; font-weight: 700; color: #0f172a; }
        .box-line { font-size: 12px; color: #475569; margin-top: 4px; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        table.items thead th { background: #4f46e5; color: #fff; font-size: 11px; text-transform: uppercase; padding: 12px; text-align: left; }
        table.items tbody td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        table.items tbody tr:nth-child(even) { background: #f8fafc; }
        .right { text-align: right; }
        .center { text-align: center; }
        .totals { width: 300px; margin-left: auto; border-collapse: collapse; }
        .totals td { padding: 10px 12px; }
        .totals .grand { background: #eef2ff; font-size: 16px; font-weight: 800; color: #312e81; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .notes { margin-top: 20px; padding: 14px; background: #fffbeb; border-radius: 10px; font-size: 12px; color: #92400e; }
        @media print { .no-print { display: none; } body { background: #fff; } .page { padding: 20px; } }
    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <div>
            <div class="brand">{{ $restaurant->nom ?? 'Restaurant' }}</div>
            <div class="brand-sub">
                @if($restaurant->adresse) {{ $restaurant->adresse }}<br>@endif
                @if($restaurant->email) {{ $restaurant->email }}@endif
                @if($restaurant->whatsapp) · {{ $restaurant->whatsapp }}@endif
            </div>
        </div>
        <div class="invoice-title">
            <h1>FACTURE</h1>
            <div class="invoice-meta">
                <strong>{{ $facture->numero_facture }}</strong><br>
                Date : {{ $facture->date_facture->format('d/m/Y') }}
            </div>
        </div>
    </div>

    <div class="parties">
        <div class="box">
            <div class="box-title">Émetteur</div>
            <div class="box-name">{{ $restaurant->nom ?? '—' }}</div>
            @if($restaurant->adresse)<div class="box-line">{{ $restaurant->adresse }}</div>@endif
            @if($restaurant->email)<div class="box-line">{{ $restaurant->email }}</div>@endif
        </div>
        <div class="box">
            <div class="box-title">Client</div>
            <div class="box-name">{{ $facture->client_nom ?? 'Client invité' }}</div>
            @if($facture->client_telephone)<div class="box-line">{{ $facture->client_telephone }}</div>@endif
            @if($facture->client_email)<div class="box-line">{{ $facture->client_email }}</div>@endif
            @if($facture->client_adresse)<div class="box-line">{{ $facture->client_adresse }}</div>@endif
            @if($facture->table_numero)<div class="box-line">Table n° {{ $facture->table_numero }}</div>@endif
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Produit</th>
                <th class="center">Qté</th>
                <th class="right">Prix unitaire</th>
                <th class="right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lignes as $ligne)
            <tr>
                <td>{{ $ligne->description }}</td>
                <td class="center">{{ $ligne->quantite }}</td>
                <td class="right">{{ number_format($ligne->prix_unitaire, 2, ',', ' ') }} MAD</td>
                <td class="right">{{ number_format($ligne->total_ligne, 2, ',', ' ') }} MAD</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td>Sous-total</td><td class="right">{{ number_format($facture->sous_total, 2, ',', ' ') }} MAD</td></tr>
        <tr class="grand"><td><strong>Total TTC</strong></td><td class="right"><strong>{{ number_format($facture->total, 2, ',', ' ') }} MAD</strong></td></tr>
    </table>

    @if($facture->notes)<div class="notes"><strong>Notes :</strong> {{ $facture->notes }}</div>@endif
    <div class="footer">Merci pour votre confiance · {{ $restaurant->nom ?? 'SmartTable' }}</div>
</div>
<script>window.onload = function () { window.print(); };</script>
</body>
</html>
