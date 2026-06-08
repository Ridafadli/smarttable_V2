<?php

namespace App\Services;

use App\Models\Menu;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MenuImageService
{
    private const SEARCH_RULES = [
        ['keys' => ['couscous'], 'query' => 'couscous moroccan food'],
        ['keys' => ['tajine', 'tagine'], 'query' => 'tajine moroccan food'],
        ['keys' => ['pizza'], 'query' => 'pizza italian food'],
        ['keys' => ['salade', 'salad'], 'query' => 'fresh salad bowl'],
        ['keys' => ['brochette', 'kebab', 'grillade', 'grill'], 'query' => 'grilled meat skewers'],
        ['keys' => ['burger'], 'query' => 'gourmet burger'],
        ['keys' => ['tacos'], 'query' => 'tacos mexican food'],
        ['keys' => ['poulet', 'chicken'], 'query' => 'chicken dish restaurant'],
        ['keys' => ['poisson', 'fish'], 'query' => 'grilled fish dish'],
        ['keys' => ['dessert', 'gateau', 'gâteau', 'patisserie', 'msemen', 'chebakia'], 'query' => 'dessert plate restaurant'],
        ['keys' => ['boisson', 'jus', 'café', 'cafe', 'thé', 'the'], 'query' => 'restaurant drink'],
    ];

    private const LOCAL_FILES = [
        'couscous' => 'couscous',
        'tajine' => 'tajine',
        'tagine' => 'tajine',
        'salade' => 'salade',
        'salad' => 'salade',
        'brochette' => 'grillades',
        'grillade' => 'grillades',
        'dessert' => 'dessert',
        'boisson' => 'boisson',
    ];

    public function assignAutoImage(Menu $menu): ?string
    {
        $query = $this->buildSearchQuery($menu->nom_plat, $menu->categorie);
        $url = $this->fetchFromPexels($query)
            ?? $this->fetchFromUnsplash($query)
            ?? $this->getLocalFallbackUrl($menu);

        if ($url) {
            $menu->update(['image' => $url]);
        }

        return $url;
    }

    public function buildSearchQuery(string $nomPlat, ?string $categorie = null): string
    {
        $haystack = $this->normalize("{$nomPlat} {$categorie}");

        foreach (self::SEARCH_RULES as $rule) {
            foreach ($rule['keys'] as $key) {
                if (str_contains($haystack, $this->normalize($key))) {
                    return $rule['query'];
                }
            }
        }

        $words = preg_split('/\s+/', trim($nomPlat)) ?: [];
        $stopWords = ['royal', 'mix', 'marocaine', 'poulet', 'viande', 'special', 'spécial', 'du', 'de', 'la', 'le', 'les', 'aux', 'au'];
        $significant = array_values(array_filter($words, fn ($w) => ! in_array($this->normalize($w), $stopWords, true)));

        $term = $significant[0] ?? $nomPlat;

        return $term.' food restaurant';
    }

    private function fetchFromPexels(string $query): ?string
    {
        $apiKey = config('services.pexels.api_key');
        if (! $apiKey) {
            return null;
        }

        try {
            $response = Http::timeout(12)
                ->withHeaders(['Authorization' => $apiKey])
                ->get('https://api.pexels.com/v1/search', [
                    'query' => $query,
                    'per_page' => 1,
                    'orientation' => 'landscape',
                ]);

            if (! $response->successful()) {
                return null;
            }

            $photo = $response->json('photos.0');
            return $photo['src']['large'] ?? $photo['src']['medium'] ?? null;
        } catch (\Throwable $e) {
            Log::warning('Pexels image fetch failed', ['message' => $e->getMessage()]);

            return null;
        }
    }

    private function fetchFromUnsplash(string $query): ?string
    {
        $accessKey = config('services.unsplash.access_key');
        if (! $accessKey) {
            return null;
        }

        try {
            $response = Http::timeout(12)
                ->withHeaders(['Authorization' => "Client-ID {$accessKey}"])
                ->get('https://api.unsplash.com/search/photos', [
                    'query' => $query,
                    'per_page' => 1,
                    'orientation' => 'landscape',
                ]);

            if (! $response->successful()) {
                return null;
            }

            return $response->json('results.0.urls.regular')
                ?? $response->json('results.0.urls.small')
                ?? null;
        } catch (\Throwable $e) {
            Log::warning('Unsplash image fetch failed', ['message' => $e->getMessage()]);

            return null;
        }
    }

    public function getLocalFallbackUrl(Menu $menu): string
    {
        $configured = config('services.menu_image.fallback_url');
        if ($configured) {
            return $configured;
        }

        $base = rtrim(config('services.menu_image.frontend_url', config('app.url')), '/');
        $file = $this->resolveLocalFile($menu);

        return "{$base}/menu-defaults/{$file}.jpg";
    }

    private function resolveLocalFile(Menu $menu): string
    {
        $haystack = $this->normalize("{$menu->nom_plat} {$menu->categorie}");

        foreach (self::LOCAL_FILES as $key => $file) {
            if (str_contains($haystack, $this->normalize($key))) {
                return $file;
            }
        }

        return 'plat-generic';
    }

    public function isExternalUrl(?string $image): bool
    {
        return $image && Str::startsWith($image, ['http://', 'https://']);
    }

    private function normalize(string $text): string
    {
        $text = Str::lower($text);
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;

        return preg_replace('/[^a-z0-9\s]/', '', $text) ?? $text;
    }
}
