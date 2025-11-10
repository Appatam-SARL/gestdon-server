import express, { NextFunction, Request, Response } from 'express';
import PermissionController from '../controllers/permission.controller';

const router = express.Router();

// Define a type for our route handlers
type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Helper function to wrap controller methods
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<any>): RouteHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res)).catch(next);
  };

// CREATE
// router.post(
//   '/create/:menu/:userId',
//   (req: Request, res: Response, next: NextFunction) => {
//     PermissionController.createPermissionForUser(req, res).catch(next);
//   }
// );
/**
 * @swagger
 * /permissions/create/{userId}:
 *   post:
 *     summary: Crée les permissions pour un utilisateur
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionsInput'
 *     responses:
 *       201:
 *         description: Permissions créées avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/create/:userId',
  (req: Request, res: Response, next: NextFunction) => {
    PermissionController.createPermissionsByuserId(req, res).catch(next);
  }
);

// READ
/**
 * @swagger
 * /permissions/get/{userId}:
 *   get:
 *     summary: Récupère les permissions d'administration d'un utilisateur
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permissions récupérées
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/get/:userId',
  (req: Request, res: Response, next: NextFunction) => {
    PermissionController.getAdminPermissions(req, res).catch(next);
  }
);

// UPDATE
/**
 * @swagger
 * /permissions/update/{userId}:
 *   put:
 *     summary: Met à jour les permissions d'un utilisateur
 *     tags: [Permission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePermissionsInput'
 *     responses:
 *       200:
 *         description: Permissions mises à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/update/:userId',
  (req: Request, res: Response, next: NextFunction) => {
    PermissionController.updatePermissionsByuserId(req, res).catch(next);
  }
);

// DELETE

export default router;
