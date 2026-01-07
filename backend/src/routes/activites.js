const express = require('express');
const { 
  createActivity, 
  getUserActivities, 
  getActivity, 
  updateActivity,
  deleteActivity, 
  getStats 
} = require('../controllers/activityController');
const { authMiddleware } = require('../middlewares/auth');
const { activityValidation } = require('../middlewares/validation');
const requestLogger = require('../middlewares/logger');

const router = express.Router();
router.use(authMiddleware);
router.use(requestLogger);

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Créer une nouvelle activité
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - duration
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [running, cycling, swimming, walking, gym]
 *                 example: running
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 example: 30
 *               calories:
 *                 type: integer
 *                 minimum: 0
 *                 example: 250
 *               distance:
 *                 type: number
 *                 minimum: 0
 *                 example: 5.5
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: Belle course ce matin
 *     responses:
 *       201:
 *         description: Activité créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post('/', activityValidation, createActivity);

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Récupérer toutes les activités de l'utilisateur
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des activités
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
 *       401:
 *         description: Non authentifié
 */
router.get('/', getUserActivities);

/**
 * @swagger
 * /api/activities/stats:
 *   get:
 *     summary: Récupérer les statistiques des activités
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [all, week, month, year]
 *           default: all
 *         description: Période pour les statistiques
 *     responses:
 *       200:
 *         description: Statistiques des activités
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stats'
 *       401:
 *         description: Non authentifié
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: Récupérer une activité par son ID
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'activité
 *     responses:
 *       200:
 *         description: Détails de l'activité
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Activité non trouvée
 *       403:
 *         description: Accès non autorisé
 *       401:
 *         description: Non authentifié
 */
router.get('/:id', getActivity);

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: Mettre à jour une activité
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'activité
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - duration
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [running, cycling, swimming, walking, gym]
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *               calories:
 *                 type: integer
 *                 minimum: 0
 *               distance:
 *                 type: number
 *                 minimum: 0
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Activité mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Activité non trouvée
 *       403:
 *         description: Accès non autorisé
 *       401:
 *         description: Non authentifié
 */
router.put('/:id', activityValidation, updateActivity);

/**
 * @swagger
 * /api/activities/{id}:
 *   delete:
 *     summary: Supprimer une activité
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'activité
 *     responses:
 *       200:
 *         description: Activité supprimée avec succès
 *       404:
 *         description: Activité non trouvée
 *       403:
 *         description: Accès non autorisé
 *       401:
 *         description: Non authentifié
 */
router.delete('/:id', deleteActivity);

module.exports = router;

