<?php

namespace App\Console\Commands;

use App\Models\Menu;
use App\Services\MenuImageService;
use Illuminate\Console\Command;

class AssignMenuImagesCommand extends Command
{
    protected $signature = 'menus:assign-images {--force : Régénérer même si une image existe}';

    protected $description = 'Attribue automatiquement des images aux plats sans photo';

    public function handle(MenuImageService $service): int
    {
        $query = Menu::query();

        if (! $this->option('force')) {
            $query->where(function ($q) {
                $q->whereNull('image')->orWhere('image', '');
            });
        }

        $menus = $query->get();
        $bar = $this->output->createProgressBar($menus->count());

        foreach ($menus as $menu) {
            $service->assignAutoImage($menu);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Images traitées pour {$menus->count()} plat(s).");

        return self::SUCCESS;
    }
}
