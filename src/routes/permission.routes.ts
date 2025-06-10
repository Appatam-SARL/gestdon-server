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
router.post(
  '/create/:userId',
  (req: Request, res: Response, next: NextFunction) => {
    PermissionController.createPermissionsByuserId(req, res).catch(next);
  }
);

// READ
router.get(
  '/get/:userId',
  (req: Request, res: Response, next: NextFunction) => {
    PermissionController.getAdminPermissions(req, res).catch(next);
  }
);

// UPDATE
router.put(
  '/update/:userId',
  (req: Request, res: Response, next: NextFunction) => {
    PermissionController.updatePermissionsByuserId(req, res).catch(next);
  }
);

// DELETE

export default router;
