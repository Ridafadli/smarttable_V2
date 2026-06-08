# SmartTable — AI Ordering & Management Assistant

Plateforme SaaS de gestion de restaurant avec commandes via QR code, assistant IA conversationnel et tableau de bord admin complet.

## Présentation

SmartTable permet aux restaurants de digitaliser leurs commandes : le client scanne un QR code, commande via chatbot IA ou carte interactive, et le personnel suit tout en temps réel depuis un dashboard admin. Plans Free, Pro et Enterprise avec limites et fonctionnalités progressives.

## Screenshots

| Écran | Description |
|-------|-------------|
| Dashboard admin | KPIs, commandes actives, graphiques 7 jours, alertes stock |
| Gestion menus | CRUD plats, variantes JSON, images IA, filtre repas |
| Tables & QR | Plan de salle, génération QR avec logo restaurant |
| OrderPage client | Stepper 4 étapes : bienvenue → chat IA → récap → confirmation |
| Statistiques Pro | CA, plats populaires, export PDF/Excel |

*(Ajoutez vos captures dans `docs/screenshots/`)*

## Architecture

```
┌─────────────────┐     HTTPS/API      ┌──────────────────┐
│  React + Vite   │ ◄────────────────► │  Laravel 11 API  │
│  (Vercel)       │     Sanctum JWT    │  (Render/Docker) │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
         │ QR scan                              │ MySQL 8
         ▼                                      ▼
┌─────────────────┐                    ┌──────────────────┐
│  Client mobile  │                    │   smarttable DB  │
│  /order?r=&t=   │                    └──────────────────┘
└────────┬────────┘
         │ chatbot
         ▼
┌─────────────────┐     POST orders    ┌──────────────────┐
│  n8n workflow   │ ─────────────────► │  Laravel API     │
│  + OpenAI       │                    └──────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Twilio WhatsApp│  (plans Pro+)
└─────────────────┘
```

## Stack technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Backend API | Laravel + Sanctum | 10/11, PHP 8.2+ |
| Base de données | MySQL / SQLite (dev) | 8.0+ |
| Frontend | React + Vite + TailwindCSS | React 19 |
| IA Chatbot | n8n + OpenAI gpt-4o-mini | — |
| Notifications | Twilio WhatsApp API | — |
| Conteneurisation | Docker + nginx + php-fpm | — |
| Déploiement FE | Vercel | — |
| Déploiement BE | Render | — |

## Prérequis

- PHP 8.2+, Composer 2.x
- Node.js 18+, npm
- MySQL 8+ (ou SQLite pour dev local)
- n8n (optionnel, pour chatbot avancé)
- Clés API : OpenAI, Twilio (optionnel)

## Installation locale

### Backend

```bash
cd smarttable-backend
cp ../.env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

API disponible sur `http://localhost:8000/api`

### Frontend

```bash
cd smarttable-frontend
echo "VITE_API_URL=http://localhost:8000/api" > .env.local
npm install
npm run dev
```

Interface sur `http://localhost:5173` (ou port Vite affiché)

**Compte démo** : `admin@demo.com` / `password123`

## Déploiement Docker

```bash
cp .env.example .env   # remplir DB_PASSWORD, APP_KEY, etc.
docker-compose up -d
docker-compose exec backend php artisan migrate --force
docker-compose exec backend php artisan storage:link
```

Services :
- **nginx** : port 80
- **backend** (php-fpm) : port 8000
- **db** (MySQL) : port 3306

## Déploiement Cloud

### Frontend → Vercel

1. Importer le repo, dossier racine `smarttable-frontend`
2. Framework : Vite (config `vercel.json`)
3. Variable : `VITE_API_URL` = URL API production

### Backend → Render

1. Utiliser `smarttable-backend/render.yaml`
2. Lier la base MySQL Render (`smarttable-db`)
3. Variables auto : `APP_KEY`, `DB_*`, `FRONTEND_URL`

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Clé Laravel (générée) |
| `APP_URL` | URL backend |
| `FRONTEND_URL` | URL frontend (CORS Sanctum) |
| `DB_*` | Connexion MySQL |
| `N8N_WEBHOOK_URL` | URL webhook n8n |
| `OPENAI_API_KEY` | Clé OpenAI (n8n) |
| `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_WHATSAPP_FROM` | WhatsApp Pro+ |

## Configuration n8n

1. Importer `n8n-workflows/smarttable-chatbot.json` dans n8n
2. Configurer la variable d'environnement `BACKEND_URL` (ex. `http://localhost:8000`)
3. Activer le workflow
4. Copier l'URL webhook dans `.env` → `N8N_WEBHOOK_URL`

Webhook attendu : `POST /webhook/smarttable-chat`

## API

- **OpenAPI 3.0** : [`docs/api-documentation.json`](docs/api-documentation.json)
- **Postman** : [`docs/postman-collection.json`](docs/postman-collection.json)
- **Health check** : `GET /api/health`

## Plans SaaS

| Plan | Prix | Tables | Commandes/jour | Fonctionnalités |
|------|------|--------|----------------|-----------------|
| **Free** | 0 MAD | 3 max | 10 max | Menus, QR, commandes, chatbot local |
| **Pro** | 200 MAD/mois | Illimité | Illimité | + Statistiques, WhatsApp, exports |
| **Enterprise** | 300 MAD/mois | Illimité | Illimité | + Multi-admin, logs employés |

## Structure du projet

```
smarttable-main/
├── smarttable-backend/     # API Laravel
│   ├── app/Http/Controllers/
│   ├── app/Services/       # Chatbot, QR, WhatsApp, MealTime
│   ├── routes/api.php
│   ├── Dockerfile
│   └── render.yaml
├── smarttable-frontend/    # React SPA
│   ├── src/pages/admin/    # Dashboard, Menus, Tables, Orders…
│   ├── src/pages/client/   # OrderPage (QR client)
│   └── vercel.json
├── n8n-workflows/          # Workflow chatbot exportable
├── docs/                   # OpenAPI + Postman
├── docker-compose.yml
└── .env.example
```

## Tests

### Backend (PHPUnit)

```bash
cd smarttable-backend
php artisan test --filter="AuthTest|CommandeTest|ChatbotTest"
```

### Frontend

```bash
cd smarttable-frontend
npm run lint
npm run build
```

## Licence

Projet propriétaire — SmartTable © 2026. Tous droits réservés.
