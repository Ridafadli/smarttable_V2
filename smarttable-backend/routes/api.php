<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\PublicRestaurantController;
use App\Http\Controllers\{MenuController, TableController, CommandeController, QrCodeController, StatisticsController, ChatbotController, ReservationController, ClientController, FactureController, IngredientController, StockController, NotificationController, EmployeeController};

// Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/public/restaurants/{restaurantId}', [PublicRestaurantController::class, 'show']);
Route::get('/menus/public/{restaurantId}', [MenuController::class, 'publicIndex']);
Route::post('/orders', [CommandeController::class, 'store']);
Route::post('/chatbot/message', [ChatbotController::class, 'message']);

// Routes protégées (admin restaurant)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::match(['put', 'post'], '/profile', [AuthController::class, 'updateProfile']);

    // Menus
    Route::apiResource('menus', MenuController::class)->except(['show']);
    Route::post('/menus/{menu}/regenerate-image', [MenuController::class, 'regenerateImage']);

    // Tables & QR Codes
    Route::apiResource('tables', TableController::class);
    Route::post('tables/{table}/reserve', [TableController::class, 'reserve']);
    Route::get('tables/{tableId}/qrcode', [QrCodeController::class, 'generate']);
    Route::get('tables/{tableId}/qrcode/download', [QrCodeController::class, 'download']);

    // Commandes
    Route::get('/orders/stats', [CommandeController::class, 'stats']);
    Route::get('/orders', [CommandeController::class, 'index']);
    Route::get('/orders/{commande}', [CommandeController::class, 'show']);
    Route::put('/orders/{commande}', [CommandeController::class, 'update']);
    Route::delete('/orders/{commande}', [CommandeController::class, 'destroy']);
    Route::patch('/orders/{commande}/status', [CommandeController::class, 'updateStatus']);

    // Réservations
    Route::get('/reservations/stats', [ReservationController::class, 'stats']);
    Route::post('/reservations/check-conflicts', [ReservationController::class, 'checkConflicts']);
    Route::apiResource('reservations', ReservationController::class);

    // Clients
    Route::get('/clients/stats', [ClientController::class, 'stats']);
    Route::apiResource('clients', ClientController::class);

    // Facturation
    Route::get('/invoices/stats', [FactureController::class, 'stats']);
    Route::post('/invoices/generate', [FactureController::class, 'generateFromOrder']);
    Route::get('/invoices/{facture}/pdf', [FactureController::class, 'pdf']);
    Route::get('/invoices/{facture}/print', [FactureController::class, 'printView']);
    Route::patch('/invoices/{facture}/cancel', [FactureController::class, 'cancel']);
    Route::apiResource('invoices', FactureController::class)->parameters(['invoices' => 'facture']);

    // Stock
    Route::get('/stock/stats', [StockController::class, 'stats']);
    Route::get('/stock/alerts', [StockController::class, 'alerts']);
    Route::get('/stock/movements', [StockController::class, 'movements']);
    Route::post('/stock/movements', [StockController::class, 'storeMovement']);
    Route::apiResource('ingredients', IngredientController::class);

    // Notifications
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::apiResource('notifications', NotificationController::class)->only(['index', 'destroy']);

    // Personnel (Enterprise)
    Route::middleware('plan:multi_admin')->group(function () {
        Route::get('/employees/stats', [EmployeeController::class, 'stats']);
        Route::get('/employees/permissions-config', [EmployeeController::class, 'permissionsConfig']);
        Route::get('/employees/activity', [EmployeeController::class, 'activity']);
        Route::apiResource('employees', EmployeeController::class);
    });

    // Statistiques (Pro+)
    Route::middleware('plan:statistics')->group(function () {
        Route::get('/statistics', [StatisticsController::class, 'index']);
        Route::get('/statistics/daily', [StatisticsController::class, 'daily']);
        Route::get('/statistics/popular', [StatisticsController::class, 'popularDishes']);
        Route::get('/statistics/report', [StatisticsController::class, 'report']);
        Route::get('/statistics/export/pdf', [StatisticsController::class, 'exportPdf']);
        Route::get('/statistics/export/excel', [StatisticsController::class, 'exportExcel']);
    });
});
