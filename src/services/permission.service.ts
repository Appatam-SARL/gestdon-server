import mongoose from 'mongoose';
import Permission, { IPermission } from '../models/permissions.model';

class PermissionService {
  /**
   * Create permissions by Admin id
   * @param userId
   * @param menu
   * @param label
   * @param actions
   */
  static async createPermissionsByuserId(
    userId: string | mongoose.Types.ObjectId,
    menu: string,
    label: string,
    actions: { name: string; value: string; enabled: boolean }[]
  ): Promise<IPermission | null> {
    try {
      const permission = await Permission.findOne({ userId });
      if (permission) {
        await Permission.updateOne(
          { userId },
          {
            $push: {
              actions: { $each: actions }, // Use $each to push multiple actions
            },
            $set: {
              label,
            },
          }
        );
      } else {
        await Permission.create({
          userId,
          menu,
          label,
          actions,
        });
      }
      return await Permission.findOne({ userId });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  /**
   * Create many permissions for Admin
   * @param menu
   * @param label
   * @param actions
   * @param userId
   */
  static async createPermissionsForUser(
    menu: string,
    label: string,
    actions: { name: string; value: string; enabled: boolean }[],
    userId: string | mongoose.Types.ObjectId
  ): Promise<IPermission | null> {
    try {
      // Add a check to ensure userId is valid
      if (!userId) {
        throw new Error(
          'User ID must be provided to create or update permissions.'
        );
      }

      const permission = await Permission.findOne({ menu, userId });
      console.log(
        '🚀 ~ PermissionService ~ createPermissionsForUser ~ permission:',
        permission
      );
      if (permission) {
        await Permission.updateOne(
          { menu, userId },
          {
            $addToSet: {
              actions: { $each: actions },
            },
            $set: {
              label,
            },
          }
        );
      } else {
        await Permission.create({
          menu,
          userId,
          label,
          actions,
        });
      }
      console.log('Ok');
      return await Permission.findOne({ menu, userId });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  /**Récupère les permissions d'un membre
   * @param userId
   */
  static async getPermissionsByuserId(
    userId: string | mongoose.Types.ObjectId
  ): Promise<IPermission[] | null> {
    try {
      const permissions = await Permission.find({ userId });
      return permissions;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  /**
   *  Create a permission for a Admin
   */
  static async createPermissionForAdmin(
    menu: string,
    label: string,
    actions: { name: string; value: string; enabled: boolean }[],
    userId: string | mongoose.Types.ObjectId
  ): Promise<IPermission | null> {
    try {
      const permission = await Permission.findOne({ menu, userId });
      if (permission) {
        await Permission.updateOne(
          { menu, userId },
          {
            $push: {
              actions: { $each: actions },
            },
            $set: {
              label,
            },
          }
        );
      } else {
        await Permission.create({
          menu,
          userId,
          label,
          actions,
        });
      }
      return await Permission.findOne({ menu, userId });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  /**
   * Met à jour toutes les permissions d'un membre
   * @param userId
   * @param permissions - [{menu, label, actions}]
   */
  static async updatePermissionsByuserId(
    userId: string | mongoose.Types.ObjectId,
    permissions: IPermission[]
  ): Promise<IPermission[] | null> {
    try {
      // Supprimer toutes les permissions existantes du membre
      await Permission.deleteMany({ userId });
      // Créer les nouvelles permissions
      const created = await Permission.insertMany(
        permissions.map((perm) => ({ ...perm, userId }))
      );
      return created as IPermission[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

export default PermissionService;
