const express = require('express');
const {
  createGoal,
  getUserGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  updateProgress
} = require('../controllers/goalController');
const { authMiddleware } = require('../middlewares/auth');
const { goalValidation, goalUpdateValidation } = require('../middlewares/validation');
const requestLogger = require('../middlewares/logger');

const router = express.Router();
router.use(authMiddleware);
router.use(requestLogger);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Créer un nouvel objectif
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - target_value
 *               - start_date
 *               - end_date
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Courir 100 km ce mois"
 *               description:
 *                 type: string
 *                 example: "Objectif de course à pied pour le mois"
 *               type:
 *                 type: string
 *                 enum: [duration, distance, calories, activities_count]
 *                 example: "distance"
 *               target_value:
 *                 type: number
 *                 example: 100
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-30"
 *     responses:
 *       201:
 *         description: Objectif créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post('/', goalValidation, createGoal);

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Récupérer tous les objectifs de l'utilisateur
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des objectifs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Goal'
 *       401:
 *         description: Non authentifié
 */
router.get('/', getUserGoals);

/**
 * @swagger
 * /api/goals/{id}:
 *   get:
 *     summary: Récupérer un objectif par son ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'objectif
 *     responses:
 *       200:
 *         description: Détails de l'objectif
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       404:
 *         description: Objectif non trouvé
 *       403:
 *         description: Accès non autorisé
 *       401:
 *         description: Non authentifié
 */
router.get('/:id', getGoal);

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Mettre à jour un objectif
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'objectif
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Courir 100 km ce mois"
 *               description:
 *                 type: string
 *                 example: "Objectif de course à pied pour le mois"
 *               type:
 *                 type: string
 *                 enum: [duration, distance, calories, activities_count]
 *                 example: "distance"
 *               target_value:
 *                 type: number
 *                 example: 100
 *               current_value:
 *                 type: number
 *                 example: 45.5
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-30"
 *               status:
 *                 type: string
 *                 enum: [active, completed, cancelled]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Objectif mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       404:
 *         description: Objectif non trouvé
 *       403:
 *         description: Accès non autorisé
 *       401:
 *         description: Non authentifié
 */
router.put('/:id', goalUpdateValidation, updateGoal);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Supprimer un objectif
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'objectif
 *     responses:
 *       200:
 *         description: Objectif supprimé avec succès
 *       404:
 *         description: Objectif non trouvé
 *       403:
 *         description: Accès non autorisé
 *       401:
 *         description: Non authentifié
 */
router.delete('/:id', deleteGoal);

/**
 * @swagger
 * /api/goals/{id}/progress:
 *   post:
 *     summary: Mettre à jour la progression d'un objectif
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'objectif
 *     description: Calcule automatiquement la progression basée sur les activités de l'utilisateur
 *     responses:
 *       200:
 *         description: Progression mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       404:
 *         description: Objectif non trouvé
 *       401:
 *         description: Non authentifié
 */
router.post('/:id/progress', updateProgress);

module.exports = router;

