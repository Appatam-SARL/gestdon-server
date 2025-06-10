import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, Schema } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

// Étendre l'interface Request pour inclure validatedData
declare global {
  namespace Express {
    interface Request {
      validatedData?: {
        body?: any;
        query?: any;
        params?: any;
      };
    }
  }
}

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req?.body?.body || req.body;
      logger.system('🚀 ~ return ~ body:', body);
      logger.system('🚀 ~ validateRequest ~ req.query:', req.query);

      // Convertir le schéma en objet pour vérifier ses propriétés
      const schemaObject = schema as AnyZodObject;
      const schemaShape = schemaObject.shape || {};

      // Créer un objet à valider qui ne contient que les clés présentes dans le schéma
      const dataToValidate: any = {};

      if ('body' in schemaShape) {
        dataToValidate.body = body;
      }

      if ('query' in schemaShape) {
        dataToValidate.query = req.query;
      }

      if ('params' in schemaShape) {
        dataToValidate.params = req.params;
      }

      // Valider uniquement les données qui correspondent au schéma
      const result = schema.parse(dataToValidate);

      // Stocker les données validées et transformées
      req.validatedData = result;

      next();
    } catch (error: any) {
      logger.error('🚀 ~ return ~ error:', error);
      next(new AppError(error.errors?.[0]?.message || 'Validation error', 400));
    }
  };
};
