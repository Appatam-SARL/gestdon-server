import { Types } from 'mongoose';
import CustomField, {
  EntityType,
  ICustomFieldOption,
} from '../models/custom-field.model';

class CustomFieldService {
  /**
   * Retrieve all custom fields for a specific owner and form with pagination and search.
   * @param ownerId The ID of the owner (user).
   * @param form The name of the form.
   * @param options Pagination and search options
   * @returns A promise resolving to an object containing fields array and total count
   */
  public static async getAllCustomFields(
    ownerId: Types.ObjectId,
    form: string,
    options: {
      limit?: number;
      page?: number;
      search?: string;
    } = {}
  ): Promise<{
    fields: ICustomFieldOption[];
    total: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const { limit = 10, page = 1, search } = options;
    const skip = (page - 1) * limit;

    const query = { ownerId, form };
    const customFields = await CustomField.find(query).lean();

    // Aplatir tous les champs de toutes les configurations en un seul tableau
    let allFields = customFields.reduce<ICustomFieldOption[]>((acc, field) => {
      return [...acc, ...(field.fields || [])];
    }, []);

    // Appliquer la recherche si spécifiée
    if (search) {
      const searchLower = search.toLowerCase();
      allFields = allFields.filter(
        (field) =>
          field.name.toLowerCase().includes(searchLower) ||
          field.label.toLowerCase().includes(searchLower)
      );
    }

    const total = allFields.length;
    const totalPages = Math.ceil(total / limit);

    // Appliquer la pagination
    const paginatedFields = allFields.slice(skip, skip + limit);

    return {
      fields: paginatedFields,
      total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  public static async getCustomFieldsByEntityType(filter: any = {}): Promise<{
    fields: ICustomFieldOption[];
  }> {
    const customFields = await CustomField.find(filter).lean();

    // Aplatir tous les champs de toutes les configurations en un seul tableau
    let allFields = customFields.reduce<ICustomFieldOption[]>((acc, field) => {
      return [...acc, ...(field.fields || [])];
    }, []);

    return {
      fields: allFields,
    };
  }
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

    const config = await CustomField.findOne(query).lean();
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
    // Rechercher la configuration existante
    const existingConfig = await CustomField.findOne({
      ownerId,
      form,
      entityType,
      entityId,
    });

    let updatedFields: ICustomFieldOption[];

    if (existingConfig) {
      // Fusionner les champs existants avec les nouveaux champs en évitant les doublons
      const existingFields = existingConfig.fields || [];
      const existingFieldNames = new Set(
        existingFields.map((field) => field.name)
      );

      // Filtrer les nouveaux champs pour ne garder que ceux qui n'existent pas déjà
      const newFields = fields.filter(
        (field) => !existingFieldNames.has(field.name)
      );

      updatedFields = [...existingFields, ...newFields];
    } else {
      updatedFields = fields;
    }

    // Mettre à jour ou créer la configuration
    const config = await CustomField.findOneAndUpdate(
      { ownerId, form, entityType, entityId },
      { ownerId, form, fields: updatedFields, entityType, entityId },
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

  /**
   * Update a specific custom field by its ID
   * @param ownerId The ID of the owner (user)
   * @param form The name of the form
   * @param fieldId The ID of the field to update
   * @param fieldData The updated field data
   * @param entityType The type of entity this configuration is for
   * @param entityId Optional ID of the specific entity
   * @returns A promise resolving to the updated field or null if not found
   */
  public static async updateCustomFieldById(
    ownerId: Types.ObjectId,
    form: string,
    fieldId: string,
    fieldData: Partial<ICustomFieldOption>,
    entityType: EntityType = 'OTHER',
    entityId?: Types.ObjectId
  ): Promise<ICustomFieldOption | null> {
    console.log('🚀 ~ CustomFieldService ~ fieldData:', fieldData);
    const query: any = { ownerId, form, entityType };
    if (entityId) {
      query.entityId = entityId;
    }

    // Trouver d'abord le document pour obtenir le champ existant
    const existingConfig = await CustomField.findOne({
      ...query,
      'fields._id': new Types.ObjectId(fieldId),
    });

    if (!existingConfig) {
      return null;
    }

    // Trouver le champ existant
    const existingField = existingConfig.fields.find(
      (field) => field._id?.toString() === fieldId
    );

    if (!existingField) {
      return null;
    }

    // Fusionner les données existantes avec les nouvelles données
    const updatedField = {
      ...existingField,
      ...fieldData,
      _id: new Types.ObjectId(fieldId),
    };

    // Mettre à jour le document
    const config = await CustomField.findOneAndUpdate(
      {
        ...query,
        'fields._id': new Types.ObjectId(fieldId),
      },
      {
        $set: {
          'fields.$': updatedField,
        },
      },
      { new: true }
    );

    if (!config) {
      return null;
    }

    const updatedFieldResult = config.fields.find(
      (field) => field._id?.toString() === fieldId
    );

    return updatedFieldResult || null;
  }

  /**
   * Delete a specific custom field by its name
   * @param ownerId The ID of the owner (user)
   * @param form The name of the form
   * @param fieldId The name of the field to delete
   * @param entityType The type of entity this configuration is for
   * @returns A promise resolving to true if deleted, false if not found
   */
  public static async deleteCustomFieldById(
    ownerId: Types.ObjectId,
    form: string,
    fieldId: string,
    entityType: EntityType = 'OTHER'
  ): Promise<boolean> {
    console.log('🚀 ~ CustomFieldService ~ entityType:', entityType);
    console.log('🚀 ~ CustomFieldService ~ form:', form);
    console.log('🚀 ~ CustomFieldService ~ ownerId:', ownerId);
    console.log('🚀 ~ CustomFieldService ~ fieldId:', fieldId);
    try {
      // D'abord, vérifier si le champ existe
      const config = await CustomField.findOne({
        ownerId,
        form,
        entityType,
        'fields._id': new Types.ObjectId(fieldId),
      });

      if (!config) {
        console.log('🚀 ~ CustomFieldService ~ config not found');
        return false;
      }

      // Supprimer le champ du tableau fields
      const result = await CustomField.updateOne(
        {
          ownerId,
          form,
          entityType,
          'fields._id': new Types.ObjectId(fieldId),
        },
        {
          $pull: {
            fields: { _id: new Types.ObjectId(fieldId) },
          },
        }
      );

      console.log('🚀 ~ CustomFieldService ~ result:', result);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error deleting custom field:', error);
      return false;
    }
  }
}

export default CustomFieldService;
