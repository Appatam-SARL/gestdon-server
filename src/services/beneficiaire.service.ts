import { z } from 'zod';
import {
  Beneficiaire,
  BeneficiaireZodSchema,
  IBeneficiaire,
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
  static async getAll(): Promise<IBeneficiaire[]> {
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
    updateData: z.infer<typeof BeneficiaireZodSchema>
  ): Promise<IBeneficiaire | null> {
    const updatedBeneficiaire = await Beneficiaire.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    return updatedBeneficiaire as IBeneficiaire | null;
  }

  /**
   * Delete a beneficiaire by ID
   * @param id - The beneficiaire ID
   * @returns The deleted beneficiaire document or null if not found
   */
  static async delete(id: string): Promise<IBeneficiaire | null> {
    return Beneficiaire.findByIdAndDelete(id);
  }
}
