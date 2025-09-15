import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TypeMouvementCheckout from '../models/type-mouvement-checkout';

export class TypeMouvementCheckoutController {
  static async index(req: Request, res: Response): Promise<void> {
    try {
      const { contributorId } = req.query;
      const filter: any = {};
      if (contributorId) {
        filter.contributorId = new mongoose.Types.ObjectId(
          contributorId as string
        );
      }
      const typeMouvementCheckouts = await TypeMouvementCheckout.find(filter);
      res.status(200).json({
        success: true,
        data: typeMouvementCheckouts,
        message: 'Types de mouvements de checkout récupérés avec succès',
      });
    } catch (error) {
      res.status(500).json({
        message:
          'Erreur lors de la récupération des types de mouvements de checkout',
        error,
      });
    }
  }
  static async show(req: Request, res: Response): Promise<void> {
    try {
      const typeMouvementCheckout = await TypeMouvementCheckout.findById(
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: typeMouvementCheckout,
        message: 'Type de mouvement de checkout récupéré avec succès',
      });
    } catch (error) {
      res.status(500).json({
        message:
          'Erreur lors de la récupération du type de mouvement de checkout',
        error,
      });
    }
  }
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const typeMouvementCheckout = await TypeMouvementCheckout.create(
        req.body
      );
      res.status(201).json({
        success: true,
        data: typeMouvementCheckout,
        message: 'Type de mouvement de checkout créé avec succès',
      });
    } catch (error) {
      res.status(500).json({
        message: 'Erreur lors de la création du type de mouvement de checkout',
        error,
      });
    }
  }
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const typeMouvementCheckout =
        await TypeMouvementCheckout.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
        });
      res.status(200).json({
        success: true,
        data: typeMouvementCheckout,
        message: 'Type de mouvement de checkout mis à jour avec succès',
      });
    } catch (error) {
      res.status(500).json({
        message:
          'Erreur lors de la mise à jour du type de mouvement de checkout',
        error,
      });
    }
  }
}
