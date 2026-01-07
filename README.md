# 🏃 Application Sportive - Backend & Frontend
################ Basicfit2 ######################

**Étudiant** : SAIED Nabil

Ce dépôt contient la conteneurisation complète de l'application sportive Basicfit2.

## 🚀 Démarrage Rapide (Docker)

L'application est entièrement conteneurisée. Pour la lancer, une seule commande suffit :

```powershell
docker-compose up -d --build
```

## 📚 Documentation

Une documentation détaillée est disponible dans le fichier [DOCKER_README.md](./DOCKER_README.md).

### Accès aux services

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000/api |
| **Swagger Docs** | http://localhost:3000/api-docs |

## 🏗️ Architecture

Le projet utilise 4 conteneurs Docker :
1. **Frontend** (React + Vite + Nginx)
2. **Backend** (Node.js + Express)
3. **PostgreSQL** (Base de données relationnelle)
4. **MongoDB** (Base de données NoSQL)

Pour plus de détails sur l'architecture, voir [architecture-diagram.md](./architecture-diagram.md).
