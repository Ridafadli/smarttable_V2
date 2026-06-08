<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Commande;
use App\Models\Facture;
use App\Models\FactureLigne;
use App\Services\InvoicePdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FactureController extends Controller
{
    public function __construct(private InvoicePdfService $pdfService) {}

    public function stats(Request $request)
    {
        $base = $request->user()->factures()->where('statut', 'emise');

        return response()->json([
            'total'       => (clone $base)->count(),
            'this_month'  => (clone $base)->whereMonth('date_facture', now()->month)->whereYear('date_facture', now()->year)->count(),
            'total_amount'=> (float) (clone $base)->sum('total'),
            'month_amount'=> (float) (clone $base)->whereMonth('date_facture', now()->month)->whereYear('date_facture', now()->year)->sum('total'),
            'cancelled'   => $request->user()->factures()->where('statut', 'annulee')->count(),
        ]);
    }

    public function index(Request $request)
    {
        $query = $request->user()->factures()->with(['client:id,nom_complet,telephone']);

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('numero_facture', 'like', $search)
                    ->orWhere('client_nom', 'like', $search)
                    ->orWhere('client_telephone', 'like', $search);
            });
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date_facture', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date_facture', '<=', $request->date_to);
        }

        $sort = $request->get('sort', 'recent');
        match ($sort) {
            'oldest'  => $query->oldest('date_facture'),
            'amount'  => $query->orderByDesc('total'),
            'number'  => $query->orderByDesc('numero_facture'),
            default   => $query->latest('date_facture')->latest('id'),
        };

        $perPage = min((int) $request->get('per_page', 50), 100);
        $paginated = $query->paginate($perPage);
        $paginated->getCollection()->transform(fn (Facture $f) => $this->formatSummary($f));

        return response()->json($paginated);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id'    => 'nullable|exists:clients,id',
            'client_nom'   => 'nullable|string|max:150',
            'client_telephone' => 'nullable|string|max:30',
            'client_email' => 'nullable|email|max:150',
            'client_adresse' => 'nullable|string|max:255',
            'table_numero' => 'nullable|integer',
            'notes'        => 'nullable|string|max:500',
            'lignes'       => 'required|array|min:1',
            'lignes.*.description'   => 'required|string|max:200',
            'lignes.*.quantite'      => 'required|integer|min:1',
            'lignes.*.prix_unitaire' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $client = null;
            if (! empty($validated['client_id'])) {
                $client = Client::findOrFail($validated['client_id']);
                if ((int) $client->restaurant_id !== (int) $request->user()->id) {
                    abort(403);
                }
            }

            $sousTotal = 0;
            foreach ($validated['lignes'] as $ligne) {
                $sousTotal += $ligne['quantite'] * $ligne['prix_unitaire'];
            }

            $facture = Facture::create([
                'restaurant_id'    => $request->user()->id,
                'client_id'        => $client?->id,
                'numero_facture'   => Facture::generateNumero($request->user()->id),
                'date_facture'     => now()->toDateString(),
                'sous_total'       => round($sousTotal, 2),
                'total'            => round($sousTotal, 2),
                'statut'           => 'emise',
                'client_nom'       => $client?->nom_complet ?? $validated['client_nom'] ?? 'Client invité',
                'client_telephone' => $client?->telephone ?? $validated['client_telephone'] ?? null,
                'client_email'     => $client?->email ?? $validated['client_email'] ?? null,
                'client_adresse'   => $client?->adresse ?? $validated['client_adresse'] ?? null,
                'table_numero'     => $validated['table_numero'] ?? null,
                'notes'            => $validated['notes'] ?? null,
            ]);

            foreach ($validated['lignes'] as $ligne) {
                $totalLigne = round($ligne['quantite'] * $ligne['prix_unitaire'], 2);
                FactureLigne::create([
                    'facture_id'    => $facture->id,
                    'description'   => $ligne['description'],
                    'quantite'      => $ligne['quantite'],
                    'prix_unitaire' => $ligne['prix_unitaire'],
                    'total_ligne'   => $totalLigne,
                ]);
            }

            return response()->json($this->formatDetail($facture->fresh(['lignes', 'client'])), 201);
        });
    }

    public function generateFromOrder(Request $request)
    {
        $validated = $request->validate([
            'session_id'   => 'nullable|string',
            'commande_ids' => 'nullable|array|min:1',
            'commande_ids.*' => 'integer|exists:commandes,id',
        ]);

        if (empty($validated['session_id']) && empty($validated['commande_ids'])) {
            return response()->json(['error' => 'session_id ou commande_ids requis'], 422);
        }

        $query = Commande::where('restaurant_id', $request->user()->id)
            ->where('statut', '!=', 'cancelled')
            ->with(['menu', 'table', 'client']);

        if (! empty($validated['session_id'])) {
            $query->where('session_id', $validated['session_id']);

            $existing = Facture::where('restaurant_id', $request->user()->id)
                ->where('session_id', $validated['session_id'])
                ->where('statut', 'emise')
                ->first();

            if ($existing) {
                return response()->json($this->formatDetail($existing->load(['lignes', 'client'])));
            }
        } else {
            $query->whereIn('id', $validated['commande_ids']);
        }

        $commandes = $query->get();

        if ($commandes->isEmpty()) {
            return response()->json(['error' => 'Aucune commande trouvée'], 404);
        }

        foreach ($commandes as $commande) {
            if ((int) $commande->restaurant_id !== (int) $request->user()->id) {
                abort(403);
            }
        }

        return DB::transaction(function () use ($request, $commandes, $validated) {
            $first = $commandes->first();
            $client = $commandes->first(fn ($c) => $c->client_id)?->client ?? $first->client;
            $sousTotal = 0;

            $facture = Facture::create([
                'restaurant_id'    => $request->user()->id,
                'client_id'        => $client?->id,
                'numero_facture'   => Facture::generateNumero($request->user()->id),
                'session_id'       => $validated['session_id'] ?? null,
                'date_facture'     => now()->toDateString(),
                'sous_total'       => 0,
                'total'            => 0,
                'statut'           => 'emise',
                'client_nom'       => $client?->nom_complet ?? ('Client table '.($first->table?->numero_table ?? '—')),
                'client_telephone' => $client?->telephone,
                'client_email'     => $client?->email,
                'client_adresse'   => $client?->adresse,
                'table_numero'     => $first->table?->numero_table,
            ]);

            foreach ($commandes as $commande) {
                $unitPrice = $commande->menu
                    ? (float) $commande->menu->prix
                    : ((float) $commande->total / max(1, $commande->quantite));

                $totalLigne = round($unitPrice * $commande->quantite, 2);
                $sousTotal += $totalLigne;

                $description = $commande->menu?->nom_plat ?? 'Article';
                if ($commande->sauce) {
                    $description .= ' ('.$commande->sauce.')';
                }

                FactureLigne::create([
                    'facture_id'    => $facture->id,
                    'menu_id'       => $commande->menu_id,
                    'commande_id'   => $commande->id,
                    'description'   => $description,
                    'quantite'      => $commande->quantite,
                    'prix_unitaire' => round($unitPrice, 2),
                    'total_ligne'   => $totalLigne,
                ]);
            }

            $facture->update([
                'sous_total' => round($sousTotal, 2),
                'total'      => round($sousTotal, 2),
            ]);

            return response()->json($this->formatDetail($facture->fresh(['lignes', 'client'])), 201);
        });
    }

    public function show(Request $request, Facture $facture)
    {
        $this->authorizeFacture($request, $facture);

        return response()->json($this->formatDetail($facture->load(['lignes', 'client'])));
    }

    public function destroy(Request $request, Facture $facture)
    {
        $this->authorizeFacture($request, $facture);
        $facture->delete();

        return response()->json(['message' => 'Facture supprimée']);
    }

    public function cancel(Request $request, Facture $facture)
    {
        $this->authorizeFacture($request, $facture);
        $facture->update(['statut' => 'annulee']);

        return response()->json($this->formatDetail($facture->fresh(['lignes', 'client'])));
    }

    public function pdf(Request $request, Facture $facture)
    {
        $this->authorizeFacture($request, $facture);

        try {
            $binary = $this->pdfService->generatePdf($facture);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 503);
        }

        $filename = $facture->numero_facture.'.pdf';

        return response($binary, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function printView(Request $request, Facture $facture)
    {
        $this->authorizeFacture($request, $facture);

        $facture->load(['lignes', 'restaurant', 'client']);

        return view('invoices.print', [
            'facture'    => $facture,
            'restaurant' => $facture->restaurant,
            'lignes'     => $facture->lignes,
        ]);
    }

    private function authorizeFacture(Request $request, Facture $facture): void
    {
        if ((int) $facture->restaurant_id !== (int) $request->user()->id) {
            abort(403, 'Non autorisé');
        }
    }

    private function formatSummary(Facture $facture): array
    {
        return [
            'id'               => $facture->id,
            'numero_facture'   => $facture->numero_facture,
            'date_facture'     => $facture->date_facture->format('Y-m-d'),
            'client_nom'       => $facture->client_nom,
            'client_telephone' => $facture->client_telephone,
            'total'            => (float) $facture->total,
            'statut'           => $facture->statut,
            'table_numero'     => $facture->table_numero,
            'session_id'       => $facture->session_id,
            'client'           => $facture->relationLoaded('client') && $facture->client
                ? ['id' => $facture->client->id, 'nom_complet' => $facture->client->nom_complet]
                : null,
            'created_at'       => $facture->created_at?->toIso8601String(),
        ];
    }

    private function formatDetail(Facture $facture): array
    {
        return [
            ...$this->formatSummary($facture),
            'client_email'   => $facture->client_email,
            'client_adresse' => $facture->client_adresse,
            'sous_total'     => (float) $facture->sous_total,
            'notes'          => $facture->notes,
            'lignes'         => $facture->lignes->map(fn (FactureLigne $l) => [
                'id'            => $l->id,
                'description'   => $l->description,
                'quantite'      => $l->quantite,
                'prix_unitaire' => (float) $l->prix_unitaire,
                'total_ligne'   => (float) $l->total_ligne,
            ])->values(),
        ];
    }
}
