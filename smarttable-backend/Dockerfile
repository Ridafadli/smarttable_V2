FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev libpng-dev libonig-dev libxml2-dev nginx \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN cp .env.example .env \
    && php artisan key:generate \
    && php artisan storage:link

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage

COPY docker/nginx.conf /etc/nginx/sites-available/default

EXPOSE 8080

CMD ["/bin/sh", "-c", "sed -i \"s/8080/$PORT/g\" /etc/nginx/sites-available/default && php-fpm -D && nginx -g 'daemon off;'"]