import { Request, Response } from 'express';
import { EntityType, ICustomFieldOption } from '../models/custom-field.model';
import CustomFieldService from '../services/custom-field.service';

class CustomFieldController {
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

      const savedFields = await CustomFieldService.createCustomField(
        userId,
        form,
        fields as ICustomFieldOption[],
        entityType as EntityType,
        entityId
      );

      res.json(savedFields);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
      const { form } = req.params;
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
        userId,
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
}

export default CustomFieldController;
