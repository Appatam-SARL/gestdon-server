import { z } from 'zod';
import {
  Beneficiaire,
  BeneficiaireZodSchema,
  IBeneficiaire,
  RepresentantZodSchema,
  UpdateBeneficiaireZodSchema,
} from '../models/beneficiaire.model';

export class BeneficiaireService {
  /**
   * Create a new beneficiaire
   * @param beneficiaireData - Data for the new beneficiaire (validated by Zod)
   * @returns The created beneficiaire document
   */
  static async create(
    beneficiaireData: z.infer<typeof BeneficiaireZodSchema>
  ): Promise<IBeneficiaire> {
    const beneficiaire = new Beneficiaire(beneficiaireData);
    return beneficiaire.save();
  }

  /**
   * Get all beneficiaires
   * @returns An array of beneficiaire documents
   */
  static async getAll(filter: {}): Promise<IBeneficiaire[]> {
    return Beneficiaire.find(); // Add filter if provided
  }

  /**
   * Get a beneficiaire by ID
   * @param id - The beneficiaire ID
   * @returns The beneficiaire document or null if not found
   */
  static async getById(id: string): Promise<IBeneficiaire | null> {
    return Beneficiaire.findById(id);
  }

  /**
   * Update a beneficiaire by ID
   * @param id - The beneficiaire ID
   * @param updateData - Data to update (validated by Zod)
   * @returns The updated beneficiaire document or null if not found
   */
  static async update(
    id: string,
    updateData: z.infer<typeof UpdateBeneficiaireZodSchema>
  ): Promise<IBeneficiaire | null> {
    const updatedBeneficiaire = await Beneficiaire.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    return updatedBeneficiaire as IBeneficiaire | null;
  }

  /**
   * Add a new beneficiaire
   * @param id - The beneficiaire ID
   * @param beneficiaireData - Data for the new beneficiaire (validated by Zod)
   * @returns The created beneficiaire document
   */
  static async addRepresentant(
    id: string,
    beneficiaireData: z.infer<typeof RepresentantZodSchema>
  ): Promise<IBeneficiaire | null> {
    const beneficiaire = await Beneficiaire.findByIdAndUpdate(
      id,
      {
        $push: {
          representant: beneficiaireData,
        },
      },
      { new: true }
    );
    return beneficiaire;
  }

  /**
   * Update a representant in the beneficiaire's representant list by _id
   * @param id - The beneficiaire ID
   * @param representantId - _id du représentant à modifier
   * @param updateData - Nouvelles données du représentant (validées par Zod)
   * @returns The updated beneficiaire document or null if not found
   */
  static async updateRepresentant(
    id: string,
    representantId: string,
    updateData: z.infer<typeof RepresentantZodSchema>
  ): Promise<IBeneficiaire | null> {
    const beneficiaire = await Beneficiaire.findById(id);
    if (!beneficiaire) return null;
    const index = beneficiaire.representant.findIndex(
      (r: any) => r._id?.toString() === representantId
    );
    if (index === -1) return null;
    // Remplacer le représentant à l'index trouvé
    beneficiaire.representant[index] = { ...updateData, _id: representantId };
    await beneficiaire.save();
    return beneficiaire;
  }

  /**
   * Delete a beneficiaire by ID
   * @param id - The beneficiaire ID
   * @returns The deleted beneficiaire document or null if not found
   */
  static async delete(id: string): Promise<IBeneficiaire | null> {
    return Beneficiaire.findByIdAndDelete(id);
  }

  /**
   * Delete a representant in the beneficiaire's representant list by _id
   * @param id - The beneficiaire ID
   * @param representantId - _id du représentant à supprimer
   * @returns The deleted beneficiaire document or null if not found
   */
  static async deleteRepresentant(
    id: string,
    representantId: string
  ): Promise<IBeneficiaire | null> {
    const beneficiaire = await Beneficiaire.findById(id);
    if (!beneficiaire) return null;
    const index = beneficiaire.representant.findIndex(
      (r: any) => r._id?.toString() === representantId
    );
    if (index === -1) return null;
    // Supprimer le représentant à l'index trouvé
    beneficiaire.representant.splice(index, 1);
    await beneficiaire.save();
    return beneficiaire;
  }
}
