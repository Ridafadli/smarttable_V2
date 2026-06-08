<?php 
// app/Services/WhatsAppService.php 
namespace App\Services; 
 
use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log; 
 
class WhatsAppService 
{ 
    private Client $client; 
 
    public function __construct() 
    { 
        $this->client = new Client( 
            config('services.twilio.sid'), 
            config('services.twilio.token') 
        ); 
    } 
 
    public function notifyAdminIfAllowed($restaurant, $commande): void
    {
        if (! in_array($restaurant->plan, ['pro', 'enterprise'], true)) {
            return;
        }

        $this->notifyAdmin($restaurant, $commande);
    }

    public function notifyAdmin($restaurant, $commande): void 
    { 
        if (empty($restaurant->whatsapp)) return; 
 
        $message = "🍽 *Nouvelle commande – SmartTable*\n\n" 
            . "Table: #{$commande->table->numero_table}\n" 
            . "Plat: {$commande->menu->nom_plat}\n" 
            . "Quantité: {$commande->quantite}\n" 
            . ($commande->sauce ? "Sauce: {$commande->sauce}\n" : '') 
            . "Total: {$commande->total} MAD\n" 
            . "Heure: " . now()->format('H:i'); 
 
        try { 
            $this->client->messages->create( 
                'whatsapp:' . $restaurant->whatsapp, 
                [ 
                    'from' => config('services.twilio.from'), 
                    'body' => $message, 
                ] 
            ); 
        } catch (\Exception $e) { 
            Log::error('WhatsApp notification failed: ' . $e->getMessage()); 
        } 
    } 
}