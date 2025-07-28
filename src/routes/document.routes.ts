import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { roleMiddleware } from '../middlewares/role.middleware';

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Gestion des documents (permis de conduire, assurances, etc.)
 */

// Toutes les routes nécessitent une authentification
// router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/documents:
 *   post:
 *     summary: Télécharge un nouveau document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ownerType
 *               - ownerId
 *               - type
 *               - number
 *               - fileUrl
 *               - mimeType
 *               - fileId
 *             properties:
 *               ownerType:
 *                 type: string
 *                 enum: [DRIVER, VEHICLE, PARTNER, ADMIN, COMPANY]
 *                 description: Type d'entité propriétaire
 *               ownerId:
 *                 type: string
 *                 description: ID du propriétaire du document
 *               type:
 *                 type: string
 *                 enum: [DRIVER_LICENSE, VEHICLE_INSURANCE, VEHICLE_REGISTRATION, OTHER, ID_CARD, PASSPORT, RESIDENCE_PERMIT, NATIONAL_ID]
 *                 description: Type du document
 *               number:
 *                 type: string
 *                 description: Numéro ou identifiant du document
 *               fileUrl:
 *                 type: string
 *                 description: URL d'accès au fichier
 *               mimeType:
 *                 type: string
 *                 description: Type MIME du fichier
 *               fileId:
 *                 type: string
 *                 description: Identifiant unique du fichier dans le système de stockage
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'expiration du document (facultatif)
 *     responses:
 *       201:
 *         description: Document créé avec succès
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
 *                     document:
 *                       $ref: '#/components/schemas/Document'
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
 */
router.post(
  '/',
  // roleMiddleware(['driver', 'partner', 'admin']),
  DocumentController.uploadDocument
);

router.post('/create-many', DocumentController.createManyDocuments);

/**
 * @swagger
 * /api/v1/documents/{ownerType}/{ownerId}:
 *   get:
 *     summary: Récupère tous les documents d'un propriétaire
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [DRIVER, VEHICLE, PARTNER, ADMIN, COMPANY]
 *         description: Type d'entité propriétaire
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du propriétaire
 *     responses:
 *       200:
 *         description: Liste des documents du propriétaire
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   description: Nombre total de documents
 *                 data:
 *                   type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Document'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Propriétaire non trouvé
 */
router.get(
  '/:ownerType/:ownerId',
  // roleMiddleware(['driver', 'partner', 'admin']),
  DocumentController.getOwnerDocuments
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   get:
 *     summary: Récupère un document spécifique
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du document
 *     responses:
 *       200:
 *         description: Document trouvé
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
 *                     document:
 *                       $ref: '#/components/schemas/Document'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Document non trouvé
 */
router.get(
  '/:id',
  // roleMiddleware(['driver', 'partner', 'admin']),
  DocumentController.getDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}/verify:
 *   patch:
 *     summary: Vérifie et approuve un document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du document à vérifier
 *     responses:
 *       200:
 *         description: Document vérifié avec succès
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
 *                   example: Document vérifié avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       $ref: '#/components/schemas/Document'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (réservé aux administrateurs)
 *       404:
 *         description: Document non trouvé
 */
router.patch(
  '/:id/verify',
  roleMiddleware(['admin']),
  DocumentController.verifyDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}/reject:
 *   patch:
 *     summary: Rejette un document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du document à rejeter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Raison du rejet
 *     responses:
 *       200:
 *         description: Document rejeté avec succès
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
 *                   example: Document rejeté
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       $ref: '#/components/schemas/Document'
 *       400:
 *         description: Raison de rejet manquante
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (réservé aux administrateurs)
 *       404:
 *         description: Document non trouvé
 */
router.patch(
  '/:id/reject',
  roleMiddleware(['admin']),
  DocumentController.rejectDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   delete:
 *     summary: Supprime un document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du document à supprimer
 *     responses:
 *       204:
 *         description: Document supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: null
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Document non trouvé
 */
router.delete(
  '/:id',
  roleMiddleware(['driver', 'partner', 'admin']),
  DocumentController.deleteDocument
);

export const documentRoutes = router;
