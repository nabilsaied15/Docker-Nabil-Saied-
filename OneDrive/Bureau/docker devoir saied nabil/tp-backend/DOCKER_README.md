# 🐳 Documentation Docker - Application Sportive Basicfit2

## Installation et Démarrage

### 1. Cloner le projet

```powershell
git clone <url-du-repo>
cd tp-backend
```

### 2. Configurer les variables d'environnement

Copiez le fichier `.env.example` vers `.env` :

```powershell
# Windows PowerShell
Copy-Item .env.example .env

# Linux/macOS
cp .env.example .env
```

**Important** : Modifiez le fichier `.env` et changez les valeurs par défaut, notamment :
- `PG_PASSWORD` : Mot de passe PostgreSQL
- `MONGO_ROOT_PASSWORD` : Mot de passe MongoDB
- `JWT_SECRET` et `JWT_REFRESH_SECRET` : Clés secrètes pour JWT

### 3. Démarrer l'application

```powershell
# Construire et démarrer tous les services
docker-compose up --build

# OU en mode détaché (arrière-plan)
docker-compose up -d --build
```

**Première fois** : Le build peut prendre 2-5 minutes. Les bases de données seront automatiquement initialisées.

### 4. Vérifier que tout fonctionne

```powershell
# Voir l'état des conteneurs
docker-compose ps

# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
```

## 🌐 Services et Ports

Une fois démarrés, les services sont accessibles aux adresses suivantes :

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Interface utilisateur React |
| **Backend API** | http://localhost:3000/api | API REST |
| **Swagger Docs** | http://localhost:3000/api-docs | Documentation API interactive |
| **PostgreSQL** | localhost:5432 | Base de données (accès interne uniquement) |
| **MongoDB** | localhost:27017 | Base de données NoSQL (accès interne uniquement) |

## 🔧 Variables d'Environnement

### PostgreSQL
- `PG_USER` : Nom d'utilisateur PostgreSQL (défaut: `postgres`)
- `PG_PASSWORD` : Mot de passe PostgreSQL (**À CHANGER**)
- `PG_DATABASE` : Nom de la base de données (défaut: `sportapp`)
- `PG_PORT` : Port PostgreSQL (défaut: `5432`)

### MongoDB
- `MONGO_ROOT_USER` : Utilisateur root MongoDB (défaut: `admin`)
- `MONGO_ROOT_PASSWORD` : Mot de passe root MongoDB (**À CHANGER**)
- `MONGO_PORT` : Port MongoDB (défaut: `27017`)

### JWT (Authentification)
- `JWT_SECRET` : Clé secrète pour les tokens JWT (**À CHANGER**)
- `JWT_REFRESH_SECRET` : Clé secrète pour les refresh tokens (**À CHANGER**)

### Serveur
- `PORT` : Port du backend (défaut: `3000`)
- `NODE_ENV` : Environnement Node.js (`development` ou `production`)

### Frontend
- `FRONTEND_URL` : URL du frontend (défaut: `http://localhost:5173`)
- `VITE_API_URL` : URL de l'API pour le frontend (défaut: `http://localhost:3000`)

## 📝 Commandes Utiles

### Gestion des conteneurs

```powershell
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Redémarrer un service spécifique
docker-compose restart backend

# Reconstruire et redémarrer
docker-compose up --build -d

# Voir les conteneurs en cours d'exécution
docker-compose ps

# Voir l'utilisation des ressources
docker stats
```

### Logs et débogage

```powershell
# Voir tous les logs
docker-compose logs

# Suivre les logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend

# Dernières 100 lignes
docker-compose logs --tail=100
```

### Accès aux conteneurs

```powershell
# Accéder au shell du backend
docker-compose exec backend sh

# Accéder à PostgreSQL
docker-compose exec postgres psql -U postgres -d sportapp

# Accéder à MongoDB
docker-compose exec mongodb mongosh -u admin -p admin123

# Exécuter une commande dans un conteneur
docker-compose exec backend npm test
```

### Gestion des données

```powershell
# Arrêter et supprimer les conteneurs (garde les volumes)
docker-compose down

# Arrêter et supprimer TOUT (y compris les données)
docker-compose down -v

# Voir les volumes
docker volume ls

# Inspecter un volume
docker volume inspect sportapp-postgres-data
```

## 💾 Persistance des Données

Les données sont stockées dans des **volumes Docker nommés** :

- `sportapp-postgres-data` : Données PostgreSQL (utilisateurs, activités, objectifs)
- `sportapp-mongo-data` : Données MongoDB

**Avantages** :
- Les données persistent même si les conteneurs sont supprimés
- Performances optimales
- Facile à sauvegarder

### Sauvegarder les données

```powershell
# Sauvegarder PostgreSQL
docker-compose exec postgres pg_dump -U postgres sportapp > backup.sql

# Sauvegarder MongoDB
docker-compose exec mongodb mongodump --out /tmp/backup
docker cp sportapp-mongodb:/tmp/backup ./mongodb-backup
```

### Restaurer les données

```powershell
# Restaurer PostgreSQL
docker-compose exec -T postgres psql -U postgres sportapp < backup.sql

# Restaurer MongoDB
docker cp ./mongodb-backup sportapp-mongodb:/tmp/backup
docker-compose exec mongodb mongorestore /tmp/backup
```

### Réinitialiser les données

```powershell
# Supprimer tous les conteneurs et volumes
docker-compose down -v

# Redémarrer avec des données fraîches
docker-compose up -d --build
```

## 🏗️ Architecture et Choix Techniques

### Images Docker

| Service | Image | Justification |
|---------|-------|---------------|
| Backend | `node:20-alpine` | Légère (40 MB vs 900 MB), sécurisée, officielle |
| Frontend Build | `node:20-alpine` | Pour construire l'app Vite |
| Frontend Serve | `nginx:alpine` | Serveur web performant et léger (23 MB) |
| PostgreSQL | `postgres:16-alpine` | Dernière version stable, légère |
| MongoDB | `mongo:7` | Version stable LTS |

### Multi-stage Build (Frontend)

Le Dockerfile du frontend utilise un **build en 2 étapes** :

1. **Étape 1 (Builder)** : Compile l'application React avec Vite
2. **Étape 2 (Production)** : Sert les fichiers statiques avec nginx

**Avantages** :
- Image finale très légère (~25 MB vs ~500 MB)
- Pas de dépendances de développement en production
- Meilleure sécurité

### Sécurité

✅ **Utilisateurs non-root** : Les conteneurs backend et frontend s'exécutent avec des utilisateurs non-root

✅ **Secrets** : Les mots de passe sont gérés via variables d'environnement (fichier `.env` non commité)

✅ **Images Alpine** : Images minimales réduisant la surface d'attaque

✅ **Health Checks** : Surveillance automatique de la santé des services

✅ **Réseau isolé** : Les services communiquent via un réseau Docker privé

### Réseaux

Un réseau bridge personnalisé `sportapp-network` permet :
- Communication inter-services par nom (ex: `backend` peut contacter `postgres`)
- Isolation du réseau hôte
- Résolution DNS automatique

### Health Checks

Chaque service a un health check :
- **PostgreSQL** : `pg_isready`
- **MongoDB** : `mongosh ping`
- **Backend** : Requête HTTP vers `/api`
- **Frontend** : Requête HTTP vers `/`

**Avantages** :
- Docker Compose attend que les services soient "healthy" avant de démarrer les dépendances
- Détection automatique des pannes
- Redémarrage automatique si nécessaire

## 🔍 Dépannage

### Problème : Port déjà utilisé

**Erreur** : `bind: address already in use`

**Solution** :
```powershell
# Trouver le processus utilisant le port
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F

# OU changer le port dans .env
PORT=3001
```

### Problème : Erreur de connexion à la base de données

**Erreur** : `Connection refused` ou `Authentication failed`

**Solution** :
```powershell
# Vérifier que les conteneurs sont démarrés
docker-compose ps

# Vérifier les logs
docker-compose logs postgres
docker-compose logs mongodb

# Redémarrer les services
docker-compose restart postgres mongodb backend
```

### Problème : Le frontend ne se connecte pas au backend

**Solution** :
1. Vérifiez que `VITE_API_URL` dans `.env` est correct
2. Reconstruisez le frontend : `docker-compose up --build frontend`
3. Vérifiez la configuration nginx dans `frontend/nginx.conf`

### Problème : Erreurs de permissions

**Erreur** : `Permission denied`

**Solution** :
```powershell
# Windows : Exécutez PowerShell en tant qu'administrateur

# Linux/macOS : Ajoutez votre utilisateur au groupe docker
sudo usermod -aG docker $USER
# Puis déconnectez-vous et reconnectez-vous
```

### Problème : Espace disque insuffisant

**Solution** :
```powershell
# Nettoyer les images inutilisées
docker system prune -a

# Nettoyer les volumes inutilisés
docker volume prune

# Voir l'utilisation de l'espace
docker system df
```

### Problème : Build très lent

**Solution** :
- Vérifiez votre connexion internet (téléchargement des images)
- Augmentez les ressources allouées à Docker Desktop (Settings > Resources)
- Utilisez le cache : évitez `--no-cache` sauf si nécessaire

## 📊 Schéma d'Architecture

Voir le fichier [architecture-diagram.md](./architecture-diagram.md) pour un schéma détaillé de l'architecture.

## 🧪 Tests

### Tester l'API

```powershell
# Tester la santé de l'API
curl http://localhost:3000/api

# Tester l'inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Accéder à Swagger pour tester interactivement
# Ouvrir http://localhost:3000/api-docs dans le navigateur
```

### Exécuter les tests backend

```powershell
docker-compose exec backend npm test
```

## 📚 Ressources Supplémentaires

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Best Practices Docker](https://docs.docker.com/develop/dev-best-practices/)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation MongoDB](https://www.mongodb.com/docs/)

## 👥 Support

Pour toute question ou problème :
1. Consultez la section **Dépannage** ci-dessus
2. Vérifiez les logs : `docker-compose logs -f`
3. Consultez la documentation Swagger : http://localhost:3000/api-docs

---

**Auteurs** : SAIED Nabil - TURKI Mohamed-Tamim - Reda El Hajjaji  
**Projet** : Basicfit2 - Application Sportive
