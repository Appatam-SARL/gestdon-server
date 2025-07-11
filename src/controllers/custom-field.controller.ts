import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { EntityType, ICustomFieldOption } from '../models/custom-field.model';
import CustomFieldService from '../services/custom-field.service';

class CustomFieldController {
  public static async getAllCustomFields(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { form, ownerId } = req.params;
      const { limit, page, search } = req.query;

      if (!ownerId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
      }

      if (!form) {
        res.status(400).json({ message: 'Form parameter is required.' });
        return;
      }

      const currentPage = page ? parseInt(page as string) : 1;
      const currentLimit = limit ? parseInt(limit as string) : 10;

      const options = {
        limit: currentLimit,
        page: currentPage,
        search: search as string | undefined,
      };

      const result = await CustomFieldService.getAllCustomFields(
        new Types.ObjectId(ownerId),
        form,
        options
      );

      res.json({
        success: true,
        data: result.fields,
        pagination: {
          total: result.total,
          page: currentPage,
          limit: currentLimit,
          totalPages: Math.ceil(result.total / currentLimit),
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
  }

  public static async getCustomFieldsByTypeActivity(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { ownerId, form, entityId, entityType } = req.query;
      const filter: any = {};

      if (ownerId) {
        filter.ownerId = new Types.ObjectId(ownerId as string);
      }
      if (form) {
        filter.form = form;
      }
      if (entityType) {
        filter.entityType = entityType;
      }
      if (entityId) {
        filter.entityId = new Types.ObjectId(entityId as string);
      }

      const result = await CustomFieldService.getCustomFieldsByEntityType(
        filter
      );
      const fields = result.fields || [];
      const total = fields.length;

      res.json({
        success: true,
        data: fields,
        total,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
  }
  /**
   * Get custom field configuration for a specific form.
   * Assumes user ID is available from authentication middleware on req.user._id.
   */
  public static async getFormCustomFields(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const { form } = req.params;
      const { entityType, entityId } = req.query;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
      }

      if (!form) {
        res.status(400).json({ message: 'Form parameter is required.' });
        return;
      }

      const fields = await CustomFieldService.getCustomFieldsConfig(
        userId,
        form,
        entityType as EntityType,
        entityId as any
      );

      res.json(fields || []);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Create or update custom field configuration for a specific form.
   * Assumes user ID is available from authentication middleware on req.user._id.
   */
  public static async createCustomField(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const { form } = req.params;
      const { fields, entityType = 'OTHER', entityId, ownerId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated.',
          data: null,
        });
        return;
      }

      if (!form) {
        res.status(400).json({
          success: false,
          message: 'Form parameter is required.',
          data: null,
        });
        return;
      }

      if (!Array.isArray(fields)) {
        res.status(400).json({
          success: false,
          message: 'Fields must be an array.',
          data: null,
        });
        return;
      }

      const savedFields = await CustomFieldService.createCustomField(
        ownerId ? new Types.ObjectId(ownerId) : userId,
        form,
        fields as ICustomFieldOption[],
        entityType as EntityType,
        entityId
      );

      res.json({
        success: true,
        message: 'Votre champ personnalisé a bien été créé.',
        data: savedFields,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message, data: null });
    }
  }

  /**
   * Update custom field configuration for a specific form.
   * Assumes user ID is available from authentication middleware on req.user._id.
   */
  public static async updateCustomField(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const { form, ownerId } = req.params;
      const { fields, entityType = 'OTHER', entityId } = req.body;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
      }

      if (!form) {
        res.status(400).json({ message: 'Form parameter is required.' });
        return;
      }

      if (!Array.isArray(fields)) {
        res.status(400).json({ message: 'Fields must be an array.' });
        return;
      }

      const updatedFields = await CustomFieldService.updateCustomField(
        ownerId ? new Types.ObjectId(ownerId) : userId,
        form,
        fields as ICustomFieldOption[],
        entityType as EntityType,
        entityId
      );

      if (!updatedFields) {
        res
          .status(404)
          .json({ message: 'Custom field configuration not found.' });
        return;
      }

      res.json(updatedFields);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Delete custom field configuration for a specific form.
   * Assumes user ID is available from authentication middleware on req.user._id.
   */
  public static async deleteCustomField(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const { form } = req.params;
      const { entityType = 'OTHER', entityId } = req.query;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
      }

      if (!form) {
        res.status(400).json({ message: 'Form parameter is required.' });
        return;
      }

      const deleted = await CustomFieldService.deleteCustomField(
        userId,
        form,
        entityType as EntityType,
        entityId as any
      );

      if (!deleted) {
        res
          .status(404)
          .json({ message: 'Custom field configuration not found.' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Update a specific custom field by its ID
   */
  public static async updateCustomFieldById(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // const userId = (req as any).user?._id;
      const { form, fieldId } = req.params;
      console.log(req.body);
      const { fields, entityType = 'OTHER', entityId, ownerId } = req.body;

      if (!ownerId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated.',
          data: null,
        });
        return;
      }

      if (!form) {
        res.status(400).json({
          success: false,
          message: 'Form parameter is required.',
          data: null,
        });
        return;
      }

      if (!fieldId) {
        res.status(400).json({
          success: false,
          message: 'Field ID is required.',
          data: null,
        });
        return;
      }

      if (!fields || typeof fields !== 'object') {
        res.status(400).json({
          success: false,
          message: 'Field data is required and must be an object.',
          data: null,
        });
        return;
      }

      const updatedField = await CustomFieldService.updateCustomFieldById(
        ownerId,
        form,
        fieldId,
        fields,
        entityType as EntityType,
        entityId ? new Types.ObjectId(entityId) : undefined
      );

      if (!updatedField) {
        res.status(404).json({
          success: false,
          message: 'Custom field not found.',
          data: null,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Champ personnalisé mis à jour avec succès.',
        data: updatedField,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Delete a specific custom field by its ID
   */
  public static async deleteCustomFieldById(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { form, fieldId } = req.params;
      const { entityType = 'OTHER', ownerId } = req.body;

      if (!ownerId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated.',
          data: null,
        });
        return;
      }

      if (!form) {
        res.status(400).json({
          success: false,
          message: 'Form parameter is required.',
          data: null,
        });
        return;
      }

      if (!fieldId) {
        res.status(400).json({
          success: false,
          message: 'Field ID is required.',
          data: null,
        });
        return;
      }

      const deleted = await CustomFieldService.deleteCustomFieldById(
        new Types.ObjectId(ownerId),
        form,
        fieldId,
        entityType as EntityType
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Custom field not found.',
          data: null,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Champ personnalisé supprimé avec succès.',
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
  }
}

export default CustomFieldController;
