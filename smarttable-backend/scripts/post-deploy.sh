#!/bin/bash
set -e
echo "Running migrations..."
php artisan migrate --force
echo "Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "Deploy complete."
