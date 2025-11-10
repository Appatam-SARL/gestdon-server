import { Router } from 'express';
import { ActivityTypeController } from '../controllers/activity-type.controller';

const router = Router();

/**
 * @swagger
 * /activity-types:
 *   post:
 *     summary: Crée un nouveau type d'activité
 *     tags: [Activity Type]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - addToMenu
 *             properties:
 *               label:
 *                 type: string
 *                 description: Le label du type d'activité
 *               addToMenu:
 *                 type: boolean
 *                 description: Si le type d'activité doit être ajouté au menu
 *     responses:
 *       201:
 *         description: Type d'activité créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     activityType:
 *                       $ref: '#/components/schemas/ActivityType'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Service indisponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       504:
 *         description: Délai d'expiration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       507:
 *         description: Stockage insuffisant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       508:
 *         description: Boucle infinie détectée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       509:
 *         description: Bande passante dépassée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       510:
 *         description: Extension requise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       511:
 *         description: Réseau non disponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       512:
 *         description: Erreur inconnue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       513:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       514:
 *         description: Erreur de connexion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       515:
 *         description: Erreur de permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       516:
 *         description: Erreur de délai d'expiration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post('/', ActivityTypeController.createActivityType);

/**
 * @swagger
 * /activity-types:
 *   get:
 *     summary: Récupère tous les types d'activités
 *     tags: [Activity Type]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Types d'activités récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActivityType'
 */
router.get('/', ActivityTypeController.getAllActivityTypes);

/**
 * @swagger
 * /activity-types/{id}:
 *   get:
 *     summary: Récupère un type d'activité par son identifiant
 *     tags: [Activity Type]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du type d'activité
 *     responses:
 *       200:
 *         description: Type d'activité récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ActivityType'
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Type d'activité non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', ActivityTypeController.getActivityTypeById);
/**
 * @swagger
 * /activity-types/{id}:
 *   put:
 *     summary: Met à jour un type d'activité
 *     tags: [Activity Type]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du type d'activité
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: Nouveau label du type d'activité
 *               addToMenu:
 *                 type: boolean
 *                 description: Indique si le type d'activité apparaît dans le menu
 *     responses:
 *       200:
 *         description: Type d'activité mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ActivityType'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Type d'activité non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', ActivityTypeController.updateActivityType);
/**
 * @swagger
 * /activity-types/{id}/toggle-menu:
 *   put:
 *     summary: Active ou désactive l'affichage du type d'activité dans le menu
 *     tags: [Activity Type]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du type d'activité
 *     responses:
 *       200:
 *         description: Statut addToMenu mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ActivityType'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Type d'activité non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id/toggle-menu', ActivityTypeController.toggleMenu);
/**
 * @swagger
 * /activity-types/{id}:
 *   delete:
 *     summary: Supprime un type d'activité
 *     tags: [Activity Type]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du type d'activité
 *     responses:
 *       200:
 *         description: Type d'activité supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Type d'activité non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', ActivityTypeController.deleteActivityType);

export default router;
