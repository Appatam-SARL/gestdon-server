import { Router } from 'express';
import { PackageController } from '../controllers/package.controller';

const router = Router();

// Routes publiques
router.get('/', PackageController.getAllPackages);
router.get('/:id', PackageController.getPackageById);

// Routes admin (décommenter les middlewares quand prêts)
// router.post('/', authMiddleware, adminMiddleware, PackageController.createPackage);
// router.put('/:id', authMiddleware, adminMiddleware, PackageController.updatePackage);

router.post('/', PackageController.createPackage);
router.put('/:id', PackageController.updatePackage);

router.delete('/:id', PackageController.deletePackage);

export default router;
