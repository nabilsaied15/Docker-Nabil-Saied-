# 🏗️ Schéma d'Architecture - Application Sportive Basicfit2

## Vue d'ensemble

Le projet est composé de 4 conteneurs Docker interconnectés via un réseau privé. L'architecture suit le modèle micro-services simplifié.



## Description des Composants

### 1. Frontend 
*   **Technologie** : React + Vite (Build) -> Nginx (Serveur)
*   **Rôle** : Interface utilisateur pour interagir avec l'application.
*   **Communication** : Envoie des requêtes HTTP à l'API Backend.
*   **Exposition** : Accessible sur le port `5173` (mappé vers le port 80 du conteneur).

### 2. Backend
*   **Technologie** : Node.js + Express
*   **Rôle** : API REST centrale. Gère la logique métier, l'authentification et la communication avec les bases de données.
*   **Sécurité** : Exécuté avec un utilisateur non-root (`nodejs`) pour minimiser les risques.
*   **Communication** :
    *   Reçoit les requêtes du Frontend.
    *   Interroge PostgreSQL pour les données structurées.
    *   Interroge MongoDB pour les données non structurées.

### 3. PostgreSQL 
*   **Role** : Stockage relationnel (Utilisateurs, Profils, Données structurées).
*   **Persistance** : Les données sont sauvegardées dans le volume `postgres_data`.

### 4. MongoDB 
*   **Role** : Stockage NoSQL (Logs, Données flexibles).
*   **Persistance** : Les données sont sauvegardées dans le volume `mongo_data`.

## Réseau et Sécurité
*   Tous les services communiquent via un **réseau interne isolé** (`app-network`).
*   Seuls les ports nécessaires sont exposés à l'hôte.
