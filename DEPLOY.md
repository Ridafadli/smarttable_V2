# Déploiement SmartTable — Guide complet

## Stack de production gratuite

| Service | Plateforme | URL |
|---------|-----------|-----|
| Frontend React | Vercel | smarttable.vercel.app |
| Backend Laravel | Render | smarttable-api.onrender.com |
| Base de données MySQL | Railway | (interne) |
| Images | Cloudinary | (CDN) |
| Uptime monitoring | UptimeRobot | (gratuit) |

---

## Étape 1 — Railway : créer la base MySQL

1. Aller sur [railway.app](https://railway.app) → **New Project** → **Add a service** → **Database** → **MySQL**
2. Cliquer sur le service MySQL → **Settings** → **Networking** → **Add Public Networking**
3. Copier les variables dans l’onglet **Variables** : `HOST`, `PORT`, `DATABASE`, `USER`, `PASSWORD`
4. Ces valeurs seront utilisées dans Render (étape 2)

**Variables à retenir :**

| Railway | Variable Render |
|---------|-----------------|
| `MYSQLHOST` ou `HOST` | `DB_HOST` |
| `MYSQLPORT` ou `PORT` | `DB_PORT` (3306) |
| `MYSQLDATABASE` | `DB_DATABASE` |
| `MYSQLUSER` | `DB_USERNAME` |
| `MYSQLPASSWORD` | `DB_PASSWORD` |

---

## Étape 2 — Render : déployer le backend

1. [render.com](https://render.com) → **New** → **Web Service** → Connect GitHub → sélectionner le repo
2. **Root Directory** : `smarttable-backend`
3. **Runtime** : **Docker** (utilise le `Dockerfile` inclus)
4. **Health Check Path** : `/api/health`
5. Remplir les variables d’environnement (voir liste dans `render.yaml` et section ci-dessous)
6. Après le premier deploy : aller dans **Shell** et lancer :

   ```bash
   bash scripts/post-deploy.sh
   ```

   Ou manuellement :

   ```bash
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

7. Copier l’URL Render (ex. `https://smarttable-backend.onrender.com`)
8. Vérifier : `https://smarttable-backend.onrender.com/api/health` → `"status": "ok"`

---

## Étape 3 — Vercel : déployer le frontend

1. [vercel.com](https://vercel.com) → **New Project** → Import Git Repository → sélectionner le repo
2. **Root Directory** : `smarttable-frontend`
3. **Framework Preset** : Vite
4. Variable d’environnement :

   ```
   VITE_API_URL=https://smarttable-backend.onrender.com/api
   ```

   (Remplacer par votre URL Render réelle + `/api`)

5. **Deploy** → copier l’URL Vercel (ex. `https://smarttable.vercel.app`)

---

## Étape 4 — Finir la config Render (CORS)

Retourner dans Render → **Environment Variables** → ajouter :

| Variable | Exemple |
|----------|---------|
| `APP_URL` | `https://smarttable-backend.onrender.com` |
| `FRONTEND_URL` | `https://smarttable.vercel.app` |
| `SANCTUM_STATEFUL_DOMAINS` | `smarttable.vercel.app,localhost:5173` |
| `SESSION_DOMAIN` | `.vercel.app` |

→ Cliquer **Save Changes** (redeploy automatique)

---

## Étape 5 — UptimeRobot (éviter le sleep Render)

1. [uptimerobot.com](https://uptimerobot.com) → **Create Monitor**
2. **Type** : HTTP(s)
3. **URL** : `https://smarttable-backend.onrender.com/api/health`
4. **Interval** : 5 minutes

→ Render ne dormira plus sur le plan gratuit (instance reste active).

---

## Étape 6 — Cloudinary (images persistantes)

Render efface les fichiers uploadés à chaque redeploy (disque éphémère).

1. [cloudinary.com](https://cloudinary.com) → créer compte gratuit
2. **Dashboard** → copier **Cloud Name**, **API Key**, **API Secret**
3. **Settings** → **Upload** → **Add upload preset** → nom : `smarttable`, mode **Unsigned**
4. Ajouter dans Render :

   ```
   CLOUDINARY_CLOUD_NAME=votre_cloud_name
   CLOUDINARY_API_KEY=votre_api_key
   CLOUDINARY_API_SECRET=votre_api_secret
   CLOUDINARY_UPLOAD_PRESET=smarttable
   ```

---

## Variables d’env complètes pour Render

Voir `smarttable-backend/.env.example` pour la liste complète.

**Variables obligatoires (fonctionnement minimal) :**

```
APP_KEY=                    # généré automatiquement par Render
APP_URL=https://xxx.onrender.com
APP_ENV=production
APP_DEBUG=false
FRONTEND_URL=https://xxx.vercel.app
SANCTUM_STATEFUL_DOMAINS=xxx.vercel.app,localhost:5173
SESSION_DOMAIN=.vercel.app
DB_CONNECTION=mysql
DB_HOST=                    # Railway public host
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
QUEUE_CONNECTION=sync
CACHE_DRIVER=file
SESSION_DRIVER=file
FILESYSTEM_DISK=public
```

**Variables optionnelles (fonctionnalités avancées) :**

```
N8N_WEBHOOK_URL=
OPENAI_API_KEY=
TWILIO_SID=
TWILIO_TOKEN=
TWILIO_WHATSAPP_FROM=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PEXELS_API_KEY=
UNSPLASH_ACCESS_KEY=
```

---

## Résolution des problèmes courants

### Erreur CORS après déploiement

→ Vérifier `FRONTEND_URL` et `SANCTUM_STATEFUL_DOMAINS` dans Render  
→ Le frontend doit être en HTTPS sur `*.vercel.app` (pattern autorisé dans `config/cors.php`)

### Login ne persiste pas

→ Vérifier `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`  
→ Le frontend utilise `withCredentials: true` (déjà configuré dans `src/api/axios.js`)  
→ Pour l’auth token Bearer, pas de cookie requis — vérifier que `VITE_API_URL` pointe bien vers Render

### Images disparaissent après redeploy

→ Configurer Cloudinary (étape 6)  
→ Sans Cloudinary, les logos uploadés dans `storage/` sont perdus à chaque redeploy

### DB connection refused

→ Vérifier que Railway a **Public Networking** activé  
→ Tester depuis Render Shell : `php artisan tinker` puis `DB::connection()->getPdo();`  
→ Vérifier `DB_HOST` (host public Railway, pas l’host interne)

### `php artisan migrate` échoue

→ Render Shell : `php artisan env` pour vérifier les variables DB  
→ Railway : autoriser les connexions depuis l’IP Render (Public Networking suffit en général)

### Health check degraded

→ `GET /api/health` retourne `"database": "error"` si MySQL inaccessible  
→ Corriger les variables `DB_*` puis relancer `bash scripts/post-deploy.sh`

---

## Fichiers de déploiement inclus

| Fichier | Rôle |
|---------|------|
| `smarttable-backend/Dockerfile` | Image PHP 8.2 + Apache pour Render |
| `smarttable-backend/render.yaml` | Blueprint Render (variables env) |
| `smarttable-backend/docker/apache.conf` | VirtualHost Laravel |
| `smarttable-backend/scripts/post-deploy.sh` | Migrations + cache post-deploy |
| `smarttable-frontend/vercel.json` | Config Vercel (SPA + cache assets) |
| `smarttable-backend/config/cloudinary.php` | Config stockage images CDN |

---

## Checklist rapide

- [ ] MySQL Railway créé + Public Networking activé
- [ ] Backend Render déployé (Docker) + migrations exécutées
- [ ] `/api/health` retourne `"status": "ok"`
- [ ] Frontend Vercel déployé avec `VITE_API_URL`
- [ ] CORS configuré (`FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`)
- [ ] UptimeRobot ping `/api/health` toutes les 5 min
- [ ] Cloudinary configuré pour logos/images persistantes
