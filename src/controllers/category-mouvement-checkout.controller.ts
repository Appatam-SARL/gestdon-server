import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { CategoryMouvementCheckoutService } from '../services/category-mouvement-checkout.service';
import {
  createCategoryMouvementCheckoutSchema,
  updateCategoryMouvementCheckoutSchema,
} from '../validations/category-mouvement-checkout.validation';

export class CategoryMouvementCheckoutController {
  static async createCategoryMouvementCheckout(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const validatedData = createCategoryMouvementCheckoutSchema.parse(
        req.body
      );

      // Vérifier si la catégorie existe déjà
      const categoryExists =
        await CategoryMouvementCheckoutService.checkCategoryExists(
          validatedData.name,
          validatedData.contributorId.toString()
        );

      if (categoryExists) {
        res.status(409).json({
          success: false,
          message: 'Une catégorie avec ce nom existe déjà pour ce contributeur',
        });
        return;
      }

      const categoryMouvementCheckout =
        await CategoryMouvementCheckoutService.createCategoryMouvementCheckout(
          validatedData
        );

      res.status(201).json({
        success: true,
        data: categoryMouvementCheckout,
        message: 'La catégorie de mouvement checkout a été créée avec succès',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          message:
            'Erreur lors de la création de la catégorie de mouvement checkout',
          data: error,
        });
      }
    }
  }

  static async getAllCategoryMouvementCheckouts(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { search, page = '1', limit = '10', contributorId } = req.query;

      const options = {
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        contributorId: contributorId as string,
      };

      const categoryMouvementCheckouts =
        await CategoryMouvementCheckoutService.getAllCategoryMouvementCheckouts(
          options
        );

      res.status(200).json({
        success: true,
        ...categoryMouvementCheckouts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Erreur lors de la récupération des catégories de mouvement checkout',
        error,
      });
    }
  }

  static async getCategoryMouvementCheckoutById(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const categoryMouvementCheckout =
        await CategoryMouvementCheckoutService.getCategoryMouvementCheckoutById(
          req.params.id
        );

      if (!categoryMouvementCheckout) {
        res.status(404).json({
          success: false,
          message: 'Catégorie de mouvement checkout non trouvée',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: categoryMouvementCheckout,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Erreur lors de la récupération de la catégorie de mouvement checkout',
        error,
      });
    }
  }

  static async getCategoryMouvementCheckoutsByContributor(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { contributorId } = req.params;

      const categoryMouvementCheckouts =
        await CategoryMouvementCheckoutService.getCategoryMouvementCheckoutsByContributor(
          contributorId
        );

      res.status(200).json({
        success: true,
        data: categoryMouvementCheckouts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Erreur lors de la récupération des catégories par contributeur',
        error,
      });
    }
  }

  static async updateCategoryMouvementCheckout(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const validatedData = updateCategoryMouvementCheckoutSchema.parse(
        req.body
      );

      // Vérifier si une catégorie avec le même nom existe déjà (si le nom est modifié)
      if (validatedData.name) {
        const categoryExists =
          await CategoryMouvementCheckoutService.checkCategoryExists(
            validatedData.name,
            validatedData.contributorId?.toString() || req.body.contributorId,
            req.params.id
          );

        if (categoryExists) {
          res.status(409).json({
            success: false,
            message:
              'Une catégorie avec ce nom existe déjà pour ce contributeur',
          });
          return;
        }
      }

      const categoryMouvementCheckout =
        await CategoryMouvementCheckoutService.updateCategoryMouvementCheckout(
          req.params.id,
          validatedData
        );

      if (!categoryMouvementCheckout) {
        res.status(404).json({
          success: false,
          message: 'Catégorie de mouvement checkout non trouvée',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: categoryMouvementCheckout,
        message:
          'La catégorie de mouvement checkout a été mise à jour avec succès',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          message:
            'Erreur lors de la mise à jour de la catégorie de mouvement checkout',
          data: error,
        });
      }
    }
  }

  static async deleteCategoryMouvementCheckout(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const categoryMouvementCheckout =
        await CategoryMouvementCheckoutService.deleteCategoryMouvementCheckout(
          req.params.id
        );

      if (!categoryMouvementCheckout) {
        res.status(404).json({
          success: false,
          message: 'Catégorie de mouvement checkout non trouvée',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message:
          'La catégorie de mouvement checkout a été supprimée avec succès',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Erreur lors de la suppression de la catégorie de mouvement checkout',
        error,
      });
    }
  }
}
