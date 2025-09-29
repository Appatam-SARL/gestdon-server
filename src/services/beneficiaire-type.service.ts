import mongoose from 'mongoose';
// import { BeneficiaireType } from '../models/beneficiaire-type.model';
import BeneficiaireTypeModel from '../models/beneficiaire-type.model';
import {
  IBeneficiaireType,
  IBeneficiaireTypeBase,
} from '../types/beneficiaire-type.d';
import { BeneficiaireTypeQueryParams } from '../validations/beneficiaire-type.validation';

export class BeneficiaireTypeService {
  static async create(
    data: IBeneficiaireTypeBase,
    session?: mongoose.ClientSession
  ): Promise<IBeneficiaireType> {
    try {
      const existingType = await BeneficiaireTypeModel.findOne({
        label: data.label,
        contributorId: data.contributorId,
      }).session(session ?? null);

      if (existingType) {
        throw new Error('Un type de bénéficiaire avec ce label existe déjà');
      }

      const beneficiaireType = new BeneficiaireTypeModel(data);
      return await beneficiaireType.save(session ? { session } : undefined);
    } catch (error: any) {
      if (error.message.includes('existe déjà')) {
        throw error;
      }
      throw new Error('Erreur lors de la création du type de bénéficiaire');
    }
  }

  static async findAll(
    contributorId: string,
    queryParams: BeneficiaireTypeQueryParams
  ): Promise<{
    data: IBeneficiaireType[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        search = '',
        page = 1,
        limit = 10,
        typeBeneficiaireId = '',
      } = queryParams;
      const skip = (Number(page) - 1) * Number(limit);

      const query = {
        contributorId,
        ...(typeBeneficiaireId ? { _id: typeBeneficiaireId } : {}),
        ...(search ? { label: { $regex: search, $options: 'i' } } : {}),
      };

      const [data, total] = await Promise.all([
        BeneficiaireTypeModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        BeneficiaireTypeModel.countDocuments(query),
      ]);

      return {
        data,
        total,
        page: Number(page),
        limit: Number(limit),
      };
    } catch (error) {
      throw new Error(
        'Erreur lors de la récupération des types de bénéficiaires'
      );
    }
  }

  static async findById(id: string): Promise<IBeneficiaireType | null> {
    try {
      return await BeneficiaireTypeModel.findById(id);
    } catch (error) {
      throw new Error('Erreur lors de la récupération du type de bénéficiaire');
    }
  }

  static async update(
    id: string,
    data: Partial<IBeneficiaireTypeBase>,
    contributorId: string
  ): Promise<IBeneficiaireType | null> {
    console.log('🚀 ~ BeneficiaireTypeService ~ contributorId:', contributorId);
    try {
      const beneficiaireType = await BeneficiaireTypeModel.findById(id);
      console.log(
        '🚀 ~ BeneficiaireTypeService ~ beneficiaireType:',
        beneficiaireType
      );

      if (!beneficiaireType) {
        return null;
      }

      if (
        beneficiaireType.contributorId.toString() !== contributorId.toString()
      ) {
        throw new Error(
          "Vous n'êtes pas autorisé à modifier ce type de bénéficiaire"
        );
      }

      if (data.label && data.label !== beneficiaireType.label) {
        const existingType = await BeneficiaireTypeModel.findOne({
          label: data.label,
          contributorId,
          _id: { $ne: id },
        });

        if (existingType) {
          throw new Error('Un type de bénéficiaire avec ce label existe déjà');
        }
      }

      Object.assign(beneficiaireType, data);
      return await beneficiaireType.save();
    } catch (error: any) {
      if (
        error.message.includes("n'êtes pas autorisé") ||
        error.message.includes('existe déjà')
      ) {
        throw error;
      }
      throw new Error('Erreur lors de la mise à jour du type de bénéficiaire');
    }
  }

  static async delete(
    id: string,
    contributorId: string
  ): Promise<IBeneficiaireType | null> {
    try {
      const beneficiaireType = await BeneficiaireTypeModel.findById(id);

      if (!beneficiaireType) {
        return null;
      }

      if (
        beneficiaireType.contributorId.toString() !== contributorId.toString()
      ) {
        throw new Error(
          "Vous n'êtes pas autorisé à supprimer ce type de bénéficiaire"
        );
      }

      await beneficiaireType.deleteOne();
      return beneficiaireType;
    } catch (error: any) {
      if (error.message.includes("n'êtes pas autorisé")) {
        throw error;
      }
      throw new Error('Erreur lors de la suppression du type de bénéficiaire');
    }
  }

  static async findByLabelAndContributor(
    label: string,
    contributorId: string
  ): Promise<IBeneficiaireType | null> {
    try {
      return await BeneficiaireTypeModel.findOne({
        label,
        contributorId: new mongoose.Types.ObjectId(contributorId),
      });
    } catch (error) {
      throw new Error('Erreur lors de la recherche du type de bénéficiaire');
    }
  }
}
