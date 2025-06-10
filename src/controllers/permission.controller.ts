import { Request, Response } from 'express';
import { IPermission } from '../models/permissions.model';
import PermissionService from '../services/permission.service';

class PermissionController {
  /**
   * Create permissions by Admin id
   * @param req
   * @param res
   *
   */
  static async createPermissionsByuserId(
    req: Request,
    res: Response
  ): Promise<Response> {
    if (!req.body || !Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Missing parameters',
        data: null,
      });
    }
    try {
      for (let i = 0; i < req.body.length; i++) {
        const { userId, label, actions } = req.body[i];
        const permission = await PermissionService.createPermissionsByuserId(
          userId,
          req.body[i].menu,
          label,
          actions
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Permissions created successfully',
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
  // Create many permissions for Admin
  /**
   * @param req
   * @param res
   */
  static async createPermissionsForAdmin(
    req: Request,
    res: Response
  ): Promise<Response> {
    if (
      !req.body.menu ||
      !req.body.label ||
      !req.body.actions ||
      !req.body.userId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing parameters',
        data: null,
      });
    }
    try {
      const { menu, label, actions, userId } = req.body;
      const permission = await PermissionService.createPermissionsForUser(
        menu,
        label,
        actions,
        userId
      );
      return res.status(200).json({
        success: true,
        message: 'Permissions created successfully',
        data: permission,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
  // Récupère les permissions d'un membre
  static async getAdminPermissions(
    req: Request,
    res: Response
  ): Promise<Response> {
    console.log(
      'permission.controller.js getPermissionsByuserId',
      req.params.userId
    );
    if (!req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing parameters',
        data: null,
      });
    }
    try {
      const permissions = await PermissionService.getPermissionsByuserId(
        req.params.userId
      );
      if (!permissions || permissions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Permissions not found',
          data: null,
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: permissions,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   *  Create a permission for a Admin
   */
  // static async createPermissionForUser(
  //   req: Request,
  //   res: Response
  // ): Promise<Response> {
  //   try {
  //     const { menu, label, actions, userId } = req.body;
  //     const permission = await PermissionService.createPermissionForAdmin(
  //       menu,
  //       label,
  //       actions,
  //       userId
  //     );
  //     return res.json(permission);
  //   } catch (error: any) {
  //     return res.status(400).json({ message: error.message });
  //   }
  // }
  /**
   * Met à jour toutes les permissions d'un membre
   * @param req
   * @param res
   */
  static async updatePermissionsByuserId(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { userId } = req.params;
    const permissions: IPermission[] = req.body;
    if (!userId || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or permissions array',
        data: null,
      });
    }
    try {
      const updated = await PermissionService.updatePermissionsByuserId(
        userId,
        permissions
      );
      return res.status(200).json({
        success: true,
        message: 'Permissions updated successfully',
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}

export default PermissionController;
