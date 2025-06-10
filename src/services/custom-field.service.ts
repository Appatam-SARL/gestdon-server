import { Types } from 'mongoose';
import CustomField, {
  EntityType,
  ICustomFieldOption,
} from '../models/custom-field.model';

class CustomFieldService {
  /**
   * Get custom field configuration for a specific form and owner.
   * @param ownerId The ID of the owner (user).
   * @param form The name of the form.
   * @param entityType Optional entity type to filter by.
   * @param entityId Optional entity ID to filter by.
   * @returns A promise resolving to the custom field configuration or null.
   */
  public static async getCustomFieldsConfig(
    ownerId: Types.ObjectId,
    form: string,
    entityType?: EntityType,
    entityId?: Types.ObjectId
  ): Promise<ICustomFieldOption[] | null> {
    const query: any = { ownerId, form };

    if (entityType) {
      query.entityType = entityType;
    }

    if (entityId) {
      query.entityId = entityId;
    }

    const config = await CustomField.findOne(query);
    return config ? config.fields : null;
  }

  /**
   * Create or update custom field configuration for a specific form and owner.
   * @param ownerId The ID of the owner (user).
   * @param form The name of the form.
   * @param fields The custom field configuration to save.
   * @param entityType The type of entity this configuration is for.
   * @param entityId Optional ID of the specific entity.
   * @returns A promise resolving to the saved custom field configuration.
   */
  public static async createCustomField(
    ownerId: Types.ObjectId,
    form: string,
    fields: ICustomFieldOption[],
    entityType: EntityType = 'OTHER',
    entityId?: Types.ObjectId
  ): Promise<ICustomFieldOption[]> {
    const config = await CustomField.findOneAndUpdate(
      { ownerId, form, entityType, entityId },
      { ownerId, form, fields, entityType, entityId },
      { upsert: true, new: true }
    );
    return config.fields;
  }

  /**
   * Update custom field configuration for a specific form and owner.
   * @param ownerId The ID of the owner (user).
   * @param form The name of the form.
   * @param fields The updated custom field configuration.
   * @param entityType The type of entity this configuration is for.
   * @param entityId Optional ID of the specific entity.
   * @returns A promise resolving to the updated custom field configuration or null.
   */
  public static async updateCustomField(
    ownerId: Types.ObjectId,
    form: string,
    fields: ICustomFieldOption[],
    entityType: EntityType = 'OTHER',
    entityId?: Types.ObjectId
  ): Promise<ICustomFieldOption[] | null> {
    const config = await CustomField.findOneAndUpdate(
      { ownerId, form, entityType, entityId },
      { fields },
      { new: true }
    );
    return config ? config.fields : null;
  }

  /**
   * Delete custom field configuration for a specific form and owner.
   * @param ownerId The ID of the owner (user).
   * @param form The name of the form.
   * @param entityType The type of entity this configuration is for.
   * @param entityId Optional ID of the specific entity.
   * @returns A promise resolving to true if deleted, false if not found.
   */
  public static async deleteCustomField(
    ownerId: Types.ObjectId,
    form: string,
    entityType: EntityType = 'OTHER',
    entityId?: Types.ObjectId
  ): Promise<boolean> {
    const query: any = { ownerId, form, entityType };

    if (entityId) {
      query.entityId = entityId;
    }

    const result = await CustomField.deleteOne(query);
    return result.deletedCount > 0;
  }
}

export default CustomFieldService;
