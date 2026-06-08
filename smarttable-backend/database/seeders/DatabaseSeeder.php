<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // \App\Models\User::factory(10)->create();

        // \App\Models\User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        // Créer / mettre à jour un restaurant de test (idempotent)
        $restaurant = \App\Models\Restaurant::updateOrCreate(
            ['email' => 'admin@demo.com'],
            [
                'nom'          => 'Restaurant Demo',
                'whatsapp'     => '+212600000000',
                'mot_de_passe' => Hash::make('password123'),
                'plan'         => 'pro',
            ]
        );
    
        // Créer des tables 
        for ($i = 1; $i <= 10; $i++) {
            $col = ($i - 1) % 5;
            $row = intdiv($i - 1, 5);
            \App\Models\TableRestaurant::updateOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'numero_table'  => $i,
                ],
                [
                    'capacite' => [2, 4, 4, 6, 8][$col] ?? 4,
                    'statut'   => 'disponible',
                    'pos_x'    => 12 + $col * 18,
                    'pos_y'    => 12 + $row * 18,
                ]
            );
        } 
    
        // Créer des menus 
        $plats = [ 
            ['nom_plat' => 'Couscous Royal', 'prix' => 85.00, 'type' => 'dejeuner'], 
            ['nom_plat' => 'Tajine Poulet', 'prix' => 70.00, 'type' => 'dejeuner'], 
            ['nom_plat' => 'Brochettes Mix', 'prix' => 65.00, 'type' => 'diner'], 
            ['nom_plat' => 'Salade Marocaine', 'prix' => 30.00, 'type' => 'tout'], 
        ]; 
    
        foreach ($plats as $plat) { 
            \App\Models\Menu::firstOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'nom_plat'      => $plat['nom_plat'],
                ],
                [...$plat, 'restaurant_id' => $restaurant->id]
            );
        }

        $ingredientData = [
            ['nom' => 'Semoule', 'unite' => 'kg', 'quantite_disponible' => 25, 'quantite_minimale' => 10, 'categorie' => 'Féculents'],
            ['nom' => 'Poulet', 'unite' => 'kg', 'quantite_disponible' => 8, 'quantite_minimale' => 12, 'categorie' => 'Viandes'],
            ['nom' => 'Légumes mix', 'unite' => 'kg', 'quantite_disponible' => 15, 'quantite_minimale' => 8, 'categorie' => 'Légumes'],
            ['nom' => 'Huile d\'olive', 'unite' => 'L', 'quantite_disponible' => 4, 'quantite_minimale' => 2, 'categorie' => 'Condiments'],
            ['nom' => 'Épices marocaines', 'unite' => 'kg', 'quantite_disponible' => 1.5, 'quantite_minimale' => 2, 'categorie' => 'Condiments'],
            ['nom' => 'Brochettes viande', 'unite' => 'kg', 'quantite_disponible' => 6, 'quantite_minimale' => 5, 'categorie' => 'Viandes'],
        ];

        $ingredientIds = [];
        foreach ($ingredientData as $ing) {
            $model = \App\Models\Ingredient::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'nom' => $ing['nom']],
                $ing
            );
            $ingredientIds[$ing['nom']] = $model->id;
        }

        $menuLinks = [
            'Couscous Royal' => [['Semoule', 0.2], ['Poulet', 0.25], ['Légumes mix', 0.15], ['Huile d\'olive', 0.05]],
            'Tajine Poulet'    => [['Poulet', 0.3], ['Légumes mix', 0.2], ['Épices marocaines', 0.02]],
            'Brochettes Mix'   => [['Brochettes viande', 0.25], ['Épices marocaines', 0.01]],
            'Salade Marocaine' => [['Légumes mix', 0.15], ['Huile d\'olive', 0.03]],
        ];

        foreach ($menuLinks as $platNom => $links) {
            $menu = \App\Models\Menu::where('restaurant_id', $restaurant->id)->where('nom_plat', $platNom)->first();
            if (! $menu) {
                continue;
            }
            foreach ($links as [$ingNom, $qty]) {
                if (isset($ingredientIds[$ingNom])) {
                    $menu->ingredients()->syncWithoutDetaching([
                        $ingredientIds[$ingNom] => ['quantite_utilisee' => $qty],
                    ]);
                }
            }
        }

        $table1 = \App\Models\TableRestaurant::where('restaurant_id', $restaurant->id)->where('numero_table', 1)->first();
        $table3 = \App\Models\TableRestaurant::where('restaurant_id', $restaurant->id)->where('numero_table', 3)->first();
        $menu1 = \App\Models\Menu::where('restaurant_id', $restaurant->id)->where('nom_plat', 'Couscous Royal')->first();
        $menu2 = \App\Models\Menu::where('restaurant_id', $restaurant->id)->where('nom_plat', 'Tajine Poulet')->first();

        $clientFatima = \App\Models\Client::updateOrCreate(
            ['restaurant_id' => $restaurant->id, 'telephone' => '+212612345678'],
            [
                'nom_complet' => 'Fatima El Amrani',
                'email'       => 'fatima.elamrani@email.com',
                'adresse'     => 'Casablanca, Maarif',
                'notes'       => 'Préfère table près de la fenêtre',
            ]
        );

        $clientYoussef = \App\Models\Client::updateOrCreate(
            ['restaurant_id' => $restaurant->id, 'telephone' => '+212698765432'],
            [
                'nom_complet' => 'Youssef Benjelloun',
                'email'       => 'youssef.b@gmail.com',
                'adresse'     => 'Rabat, Agdal',
            ]
        );

        $clientKarim = \App\Models\Client::updateOrCreate(
            ['restaurant_id' => $restaurant->id, 'telephone' => '+212655112233'],
            [
                'nom_complet' => 'Karim Alaoui',
                'email'       => 'karim.alaoui@email.com',
                'adresse'     => 'Marrakech, Guéliz',
            ]
        );

        if ($table1 && $table3) {
            $today = now()->toDateString();
            $tomorrow = now()->addDay()->toDateString();

            \App\Models\Reservation::updateOrCreate(
                [
                    'restaurant_id'       => $restaurant->id,
                    'table_restaurant_id' => $table1->id,
                    'client_nom'          => 'Fatima El Amrani',
                    'date_reservation'    => $today,
                    'heure_reservation'   => '19:30:00',
                ],
                [
                    'client_id'        => $clientFatima->id,
                    'client_telephone' => '+212612345678',
                    'nombre_personnes' => 2,
                    'statut'           => 'confirmee',
                    'notes'            => 'Anniversaire — gâteau sur place',
                ]
            );

            \App\Models\Reservation::updateOrCreate(
                [
                    'restaurant_id'       => $restaurant->id,
                    'table_restaurant_id' => $table3->id,
                    'client_nom'          => 'Youssef Benjelloun',
                    'date_reservation'    => $tomorrow,
                    'heure_reservation'   => '20:00:00',
                ],
                [
                    'client_id'        => $clientYoussef->id,
                    'client_telephone' => '+212698765432',
                    'nombre_personnes' => 4,
                    'statut'           => 'en_attente',
                ]
            );
        }

        if ($table1 && $menu1 && $menu2) {
            \App\Models\Commande::firstOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'client_id'     => $clientFatima->id,
                    'table_id'      => $table1->id,
                    'menu_id'       => $menu1->id,
                    'session_id'    => 'demo-session-fatima-1',
                ],
                [
                    'quantite' => 2,
                    'statut'   => 'delivered',
                    'total'    => 170.00,
                ]
            );

            \App\Models\Commande::firstOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'client_id'     => $clientKarim->id,
                    'table_id'      => $table1->id,
                    'menu_id'       => $menu2->id,
                    'session_id'    => 'demo-session-karim-1',
                ],
                [
                    'quantite' => 1,
                    'statut'   => 'delivered',
                    'total'    => 70.00,
                ]
            );

            $commandeFatima = \App\Models\Commande::where('session_id', 'demo-session-fatima-1')->first();
            if ($commandeFatima && ! \App\Models\Facture::where('session_id', 'demo-session-fatima-1')->exists()) {
                $facture = \App\Models\Facture::create([
                    'restaurant_id'    => $restaurant->id,
                    'client_id'        => $clientFatima->id,
                    'numero_facture'   => \App\Models\Facture::generateNumero($restaurant->id),
                    'session_id'       => 'demo-session-fatima-1',
                    'date_facture'     => now()->toDateString(),
                    'sous_total'       => 170.00,
                    'total'            => 170.00,
                    'statut'           => 'emise',
                    'client_nom'       => $clientFatima->nom_complet,
                    'client_telephone' => $clientFatima->telephone,
                    'client_email'     => $clientFatima->email,
                    'client_adresse'   => $clientFatima->adresse,
                    'table_numero'     => 1,
                ]);

                \App\Models\FactureLigne::create([
                    'facture_id'    => $facture->id,
                    'menu_id'       => $menu1->id,
                    'commande_id'   => $commandeFatima->id,
                    'description'   => $menu1->nom_plat,
                    'quantite'      => 2,
                    'prix_unitaire' => 85.00,
                    'total_ligne'   => 170.00,
                ]);
            }
        }

        $demoEmployees = [
            ['nom' => 'Alaoui', 'prenom' => 'Said', 'email' => 'said.admin@demo.com', 'telephone' => '+212611111111', 'role' => 'admin', 'date_embauche' => '2023-01-15'],
            ['nom' => 'Benjelloun', 'prenom' => 'Nadia', 'email' => 'nadia.manager@demo.com', 'telephone' => '+212622222222', 'role' => 'manager', 'date_embauche' => '2023-06-01'],
            ['nom' => 'Idrissi', 'prenom' => 'Omar', 'email' => 'omar.serveur@demo.com', 'telephone' => '+212633333333', 'role' => 'serveur', 'date_embauche' => '2024-03-10'],
            ['nom' => 'Tazi', 'prenom' => 'Hassan', 'email' => 'hassan.cuisinier@demo.com', 'telephone' => '+212644444444', 'role' => 'cuisinier', 'date_embauche' => '2024-01-20'],
        ];

        foreach ($demoEmployees as $emp) {
            \App\Models\Employee::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'email' => $emp['email']],
                [...$emp, 'restaurant_id' => $restaurant->id, 'is_active' => true]
            );
        }
    }
}
