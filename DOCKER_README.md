# Documentation Docker - Application Sportive Basicfit2
## Installation et Démarrage
### 1. Cloner le projet

git clone https://github.com/nabilsaied15/Docker-Nabil-Saied-.git
cd tp-backend

### 2. Configurer les variables d'environnement
Copiez le fichier `.env.example` vers `.env` :
# Windows PowerShell
Copy-Item .env.example .env

**Important** : Modifiez le fichier `.env` et changez les valeurs par défaut, notamment :
- `PG_PASSWORD` : Mot de passe PostgreSQL
- `MONGO_ROOT_PASSWORD` : Mot de passe MongoDB
- `JWT_SECRET` et `JWT_REFRESH_SECRET` : Clés secrètes pour JWT

### 3. Démarrer l'application
# Construire et démarrer tous les services
docker-compose up --build

# OU en mode détaché (arrière-plan)
docker-compose up -d --build


**Première fois** : Le build peut prendre 2-5 minutes. Les bases de données seront automatiquement initialisées.

### 4. Vérifier que tout fonctionne
# Voir l'état des conteneurs
docker-compose ps
# Voir les logs en temps réel
docker-compose logs -f
# Voir les logs d'un service spécifique
docker-compose logs -f backend



##  Services et Ports
Une fois démarrés, les services sont accessibles aux adresses suivantes :
 **Frontend** : http://localhost:5173 :Interface utilisateur React 
 **Backend API** : http://localhost:3000/api :API REST 
 **Swagger Docs**: http://localhost:3000/api-docs : Documentation API interactive 
 **PostgreSQL**: localhost:5432 : Base de données (accès interne uniquement) 
 **MongoDB** : localhost:27017 : Base de données NoSQL (accès interne uniquement) 


##  Commandes Utiles
### Gestion des conteneurs
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


### Accès aux conteneurs
# Accéder au shell du backend
docker-compose exec backend sh
# Accéder à PostgreSQL
docker-compose exec postgres psql -U postgres -d sportapp
# Accéder à MongoDB
docker-compose exec mongodb mongosh -u admin -p admin123
# Exécuter une commande dans un conteneur
docker-compose exec backend npm test


### Gestion des données
# Arrêter et supprimer les conteneurs (garde les volumes)
docker-compose down
# Arrêter et supprimer TOUT (y compris les données)
docker-compose down -v
# Voir les volumes
docker volume ls
# Inspecter un volume
docker volume inspect sportapp-postgres-data


##  Persistance des Données
Les données sont stockées dans des **volumes Docker nommés** :
- `sportapp-postgres-data` : Données PostgreSQL (utilisateurs, activités, objectifs)
- `sportapp-mongo-data` : Données MongoDB
**Avantages** :
- Les données persistent même si les conteneurs sont supprimés
- Performances optimales
- Facile à sauvegarder


### Réseaux
Un réseau bridge personnalisé `sportapp-network` permet :
- Communication inter-services par nom (ex: `backend` peut contacter `postgres`)
- Isolation du réseau hôte
- Résolution DNS automatique
