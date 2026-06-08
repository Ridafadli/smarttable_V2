<?php

namespace App\Services;

class MealTimeService
{
    public static function currentMealType(): string
    {
        $hour = (int) now()->format('H');

        if ($hour >= 6 && $hour < 11) {
            return 'petit_dejeuner';
        }
        if ($hour >= 11 && $hour < 16) {
            return 'dejeuner';
        }
        if ($hour >= 16 && $hour < 23) {
            return 'diner';
        }

        return 'tout';
    }

    /** @return array<int, string> */
    public static function activeMenuTypes(): array
    {
        return [self::currentMealType(), 'tout'];
    }

    public static function label(string $type): string
    {
        return match ($type) {
            'petit_dejeuner' => 'Petit-déjeuner',
            'dejeuner'       => 'Déjeuner',
            'diner'          => 'Dîner',
            default          => 'Toute la journée',
        };
    }
}
