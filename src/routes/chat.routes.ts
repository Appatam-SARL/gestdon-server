import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { chatValidation } from '../validations/chat.validation';

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Gestion des conversations et messages
 */
const router = Router();
const controller = new ChatController();

// Toutes les routes de chat nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * /chat/conversations:
 *   post:
 *     summary: Création d'une nouvelle conversation
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [USER, PARTNER, DRIVER, ADMIN]
 *               order:
 *                 type: string
 *               subject:
 *                 type: string
 *               initialMessage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation créée avec succès
 */
router.post(
  '/conversations',
  validateRequest({ body: chatValidation.createConversation.shape.body }),
  controller.createConversation.bind(controller)
);

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Récupération des conversations de l'utilisateur
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste des conversations
 */
router.get(
  '/conversations',
  (req, res, next) => {
    if (chatValidation.getConversations.shape.query?.unwrap) {
      validateRequest({
        query: chatValidation.getConversations.shape.query.unwrap(),
      })(req, res, next);
    } else {
      next();
    }
  },
  controller.getUserConversations.bind(controller)
);

/**
 * @swagger
 * /chat/conversations/{conversationId}:
 *   get:
 *     summary: Récupération d'une conversation spécifique
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Détails de la conversation et messages
 */
router.get(
  '/conversations/:conversationId',
  validateRequest({
    params: chatValidation.getConversation.shape.params,
    query: chatValidation.getConversation.shape.query?.unwrap?.() || undefined,
  }),
  controller.getConversation.bind(controller)
);

/**
 * @swagger
 * /chat/conversations/{conversationId}/messages:
 *   post:
 *     summary: Ajout d'un message à une conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Message ajouté avec succès
 */
router.post(
  '/conversations/:conversationId/messages',
  validateRequest({
    params: chatValidation.addMessage.shape.params,
    body: chatValidation.addMessage.shape.body,
  }),
  controller.addMessage.bind(controller)
);

/**
 * @swagger
 * /chat/search:
 *   get:
 *     summary: Recherche dans les conversations et messages
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Résultats de recherche
 */
router.get(
  '/search',
  validateRequest({ query: chatValidation.searchConversations.shape.query }),
  controller.searchConversations.bind(controller)
);

/**
 * @swagger
 * /chat/conversations/{conversationId}:
 *   patch:
 *     summary: Mise à jour d'une conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED, PENDING]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Conversation mise à jour avec succès
 */
router.patch(
  '/conversations/:conversationId',
  validateRequest({
    params: chatValidation.updateConversation.shape.params,
    body: chatValidation.updateConversation.shape.body,
  }),
  controller.updateConversation.bind(controller)
);

// Fermer la conversation
router.patch(
  '/conversations/:conversationId/closed',
  validateRequest({
    params: chatValidation.closed.shape.params,
  }),
  controller.closedConversation.bind(controller)
);

export const chatRoutes = router;
