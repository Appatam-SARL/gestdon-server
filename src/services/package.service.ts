import PackageModel from '../models/package.model';
import { ApiResponse } from '../types/api.type';

export class PackageService {
  // Récupérer tous les packages actifs
  static async getAllActivePackages(): Promise<ApiResponse> {
    try {
      const [packages, totalCount] = await Promise.all([
        await PackageModel.find({ isActive: true })
          .sort({ createdAt: -1 })
          .lean(),
        await PackageModel.countDocuments({ isActive: true }),
      ]);

      if (!packages) {
        return {
          success: false,
          message: 'Packages non trouvés',
        };
      }

      return {
        success: true,
        message: 'Packages récupérés avec succès',
        data: packages,
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des packages',
        error: (error as Error).message,
      };
    }
  }

  // Créer un nouveau package (Admin)
  static async createPackage(packageData: any): Promise<ApiResponse> {
    try {
      const newPackage = new PackageModel(packageData);
      await newPackage.save();

      return {
        success: true,
        message: 'Package créé avec succès',
        data: newPackage,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la création du package',
        error: (error as Error).message,
      };
    }
  }

  // Récupérer un package par ID
  static async getPackageById(packageId: string): Promise<ApiResponse> {
    try {
      const package_ = await PackageModel.findById(packageId);

      if (!package_) {
        return {
          success: false,
          message: 'Package non trouvé',
        };
      }

      return {
        success: true,
        message: 'Package récupéré avec succès',
        data: package_,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération du package',
        error: (error as Error).message,
      };
    }
  }

  // Mettre à jour un package
  static async updatePackage(
    packageId: string,
    updateData: any
  ): Promise<ApiResponse> {
    try {
      const updatedPackage = await PackageModel.findByIdAndUpdate(
        packageId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedPackage) {
        return {
          success: false,
          message: 'Package non trouvé',
        };
      }

      return {
        success: true,
        message: 'Package mis à jour avec succès',
        data: updatedPackage,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du package',
        error: (error as Error).message,
      };
    }
  }

  // Supprimer un package
  static async deletePackage(packageId: string): Promise<ApiResponse> {
    try {
      const deletedPackage = await PackageModel.findByIdAndDelete(packageId);

      if (!deletedPackage) {
        return {
          success: false,
          message: 'Package non trouvé',
        };
      }

      return {
        success: true,
        message: 'Package supprimé avec succès',
        data: deletedPackage,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la suppression du package',
        error: (error as Error).message,
      };
    }
  }
}
