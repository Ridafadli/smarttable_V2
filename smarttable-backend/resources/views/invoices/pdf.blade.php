<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $facture->numero_facture }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1e293b; line-height: 1.5; }
        .page { padding: 36px 40px; }
        .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 28px; }
        .header-top { width: 100%; }
        .header-top td { vertical-align: top; }
        .brand { font-size: 22px; font-weight: bold; color: #312e81; }
        .brand-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 26px; color: #4f46e5; letter-spacing: 1px; }
        .invoice-meta { text-align: right; font-size: 11px; color: #64748b; margin-top: 6px; }
        .parties { width: 100%; margin-bottom: 28px; }
        .parties td { width: 50%; vertical-align: top; padding: 14px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; }
        .box-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: bold; margin-bottom: 8px; }
        .box-name { font-size: 14px; font-weight: bold; color: #0f172a; }
        .box-line { font-size: 11px; color: #475569; margin-top: 3px; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        table.items thead th { background: #4f46e5; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 12px; text-align: left; }
        table.items thead th.right { text-align: right; }
        table.items thead th.center { text-align: center; }
        table.items tbody td { padding: 11px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        table.items tbody td.right { text-align: right; }
        table.items tbody td.center { text-align: center; }
        table.items tbody tr:nth-child(even) { background: #f8fafc; }
        .totals { width: 280px; margin-left: auto; }
        .totals td { padding: 8px 12px; font-size: 12px; }
        .totals .label { color: #64748b; }
        .totals .value { text-align: right; font-weight: bold; }
        .totals .grand { background: #eef2ff; border: 1px solid #c7d2fe; font-size: 15px; color: #312e81; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
        .notes { margin-top: 20px; padding: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; font-size: 11px; color: #92400e; }
    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <table class="header-top">
            <tr>
                <td>
                    <div class="brand">{{ $restaurant->nom ?? 'Restaurant' }}</div>
                    <div class="brand-sub">
                        @if($restaurant->adresse) {{ $restaurant->adresse }}<br>@endif
                        @if($restaurant->email) {{ $restaurant->email }}@endif
                        @if($restaurant->whatsapp) · {{ $restaurant->whatsapp }}@endif
                    </div>
                </td>
                <td class="invoice-title">
                    <h1>FACTURE</h1>
                    <div class="invoice-meta">
                        <strong>{{ $facture->numero_facture }}</strong><br>
                        Date : {{ $facture->date_facture->format('d/m/Y') }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <table class="parties">
        <tr>
            <td style="padding-right: 10px;">
                <div class="box">
                    <div class="box-title">Émetteur</div>
                    <div class="box-name">{{ $restaurant->nom ?? '—' }}</div>
                    @if($restaurant->adresse)<div class="box-line">{{ $restaurant->adresse }}</div>@endif
                    @if($restaurant->email)<div class="box-line">{{ $restaurant->email }}</div>@endif
                    @if($restaurant->whatsapp)<div class="box-line">{{ $restaurant->whatsapp }}</div>@endif
                </div>
            </td>
            <td style="padding-left: 10px;">
                <div class="box">
                    <div class="box-title">Client</div>
                    <div class="box-name">{{ $facture->client_nom ?? 'Client invité' }}</div>
                    @if($facture->client_telephone)<div class="box-line">{{ $facture->client_telephone }}</div>@endif
                    @if($facture->client_email)<div class="box-line">{{ $facture->client_email }}</div>@endif
                    @if($facture->client_adresse)<div class="box-line">{{ $facture->client_adresse }}</div>@endif
                    @if($facture->table_numero)<div class="box-line">Table n° {{ $facture->table_numero }}</div>@endif
                </div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 45%;">Produit</th>
                <th class="center" style="width: 12%;">Qté</th>
                <th class="right" style="width: 20%;">Prix unitaire</th>
                <th class="right" style="width: 23%;">Total</th>
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
        <tr>
            <td class="label">Sous-total</td>
            <td class="value">{{ number_format($facture->sous_total, 2, ',', ' ') }} MAD</td>
        </tr>
        <tr class="grand">
            <td class="label"><strong>Total TTC</strong></td>
            <td class="value"><strong>{{ number_format($facture->total, 2, ',', ' ') }} MAD</strong></td>
        </tr>
    </table>

    @if($facture->notes)
    <div class="notes"><strong>Notes :</strong> {{ $facture->notes }}</div>
    @endif

    <div class="footer">
        Merci pour votre confiance · {{ $restaurant->nom ?? 'SmartTable' }} · Document généré automatiquement
    </div>
</div>
</body>
</html>
