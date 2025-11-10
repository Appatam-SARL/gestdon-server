import { Router } from 'express';
import { PackageController } from '../controllers/package.controller';

const router = Router();

// Routes publiques
/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Liste des packages
 *     tags: [Package]
 *     responses:
 *       200:
 *         description: Liste des packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Package'
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', PackageController.getAllPackages);
/**
 * @swagger
 * /packages/{id}:
 *   get:
 *     summary: Récupère un package par identifiant
 *     tags: [Package]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Package récupéré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       404:
 *         description: Package non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', PackageController.getPackageById);

// Routes admin (décommenter les middlewares quand prêts)
// router.post('/', authMiddleware, adminMiddleware, PackageController.createPackage);
// router.put('/:id', authMiddleware, adminMiddleware, PackageController.updatePackage);

/**
 * @swagger
 * /packages:
 *   post:
 *     summary: Crée un package
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePackageInput'
 *     responses:
 *       201:
 *         description: Package créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', PackageController.createPackage);
/**
 * @swagger
 * /packages/{id}:
 *   put:
 *     summary: Met à jour un package
 *     tags: [Package]
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
 *             $ref: '#/components/schemas/UpdatePackageInput'
 *     responses:
 *       200:
 *         description: Package mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Package non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', PackageController.updatePackage);

/**
 * @swagger
 * /packages/{id}:
 *   delete:
 *     summary: Supprime un package
 *     tags: [Package]
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
 *         description: Package supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Package non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', PackageController.deletePackage);

export default router;
