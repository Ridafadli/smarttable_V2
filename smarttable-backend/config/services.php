<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'n8n' => [
        'webhook_url' => env('N8N_WEBHOOK_URL'),
    ],

    'twilio' => [
        'sid'   => env('TWILIO_SID'),
        'token' => env('TWILIO_TOKEN'),
        'from'  => env('TWILIO_WHATSAPP_FROM'),
    ],

    'pexels' => [
        'api_key' => env('PEXELS_API_KEY'),
    ],

    'unsplash' => [
        'access_key' => env('UNSPLASH_ACCESS_KEY'),
    ],

    'menu_image' => [
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:5175'),
        'fallback_url' => env('MENU_IMAGE_FALLBACK_URL'),
    ],

];
