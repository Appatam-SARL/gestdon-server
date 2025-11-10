import { Router } from 'express';
import { AgendaController } from '../controllers/agenda.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Routes CRUD de base
/**
 * @swagger
 * /agendas:
 *   post:
 *     summary: Crée un nouvel évènement d'agenda
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAgendaInput'
 *     responses:
 *       201:
 *         description: Agenda créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agenda'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', AgendaController.create);
/**
 * @swagger
 * /agendas:
 *   get:
 *     summary: Récupère la liste des évènements d'agenda
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Taille de page
 *     responses:
 *       200:
 *         description: Liste des agendas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Agenda'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', AgendaController.findAll);
/**
 * @swagger
 * /agendas/{id}:
 *   get:
 *     summary: Récupère un évènement d'agenda par identifiant
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'agenda
 *     responses:
 *       200:
 *         description: Agenda récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agenda'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Agenda non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', AgendaController.findById);
/**
 * @swagger
 * /agendas/{id}:
 *   put:
 *     summary: Met à jour un évènement d'agenda
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAgendaInput'
 *     responses:
 *       200:
 *         description: Agenda mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agenda'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Agenda non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', AgendaController.update);
/**
 * @swagger
 * /agendas/{id}:
 *   delete:
 *     summary: Supprime un évènement d'agenda
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agenda supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Agenda non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', AgendaController.delete);

// Route pour rechercher par plage de dates
/**
 * @swagger
 * /agendas/range:
 *   get:
 *     summary: Recherche les évènements par plage de dates
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date/heure de début (ISO 8601)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date/heure de fin (ISO 8601)
 *     responses:
 *       200:
 *         description: Évènements trouvés dans l'intervalle
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agenda'
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/range', AgendaController.findByDateRange);

export default router;
