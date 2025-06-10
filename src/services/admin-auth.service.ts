import bcrypt from 'bcryptjs';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Admin, IAdmin } from '../models/admin.model';
import Contributor from '../models/contributor.model';
import { LOG_ACTIONS, LOG_ENTITY_TYPES } from '../types/log.types';
import { generatePassword } from '../utils/password.utils';
import { LogService } from './log.service';

interface IAdminDocument extends IAdmin {
  _id: Types.ObjectId;
}

export class AdminAuthService {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '1d';

  static async login(
    email: string,
    password: string,
    req?: Request
  ): Promise<{
    requireMfa: boolean;
    token?: string;
    admin?: IAdmin;
  }> {
    try {
      const admin = (await Admin.findOne({ email }).select(
        '+mfaSecret'
      )) as IAdminDocument | null;

      if (!admin) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: email, // On utilise l'email car on n'a pas l'ID
            action: LOG_ACTIONS.LOGIN,
            status: 'failure',
            details: 'Admin non trouvé',
          },
          req
        );
        throw new Error('Identifiants invalides');
      }

      if (!admin.isActive) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: admin._id.toString(),
            action: LOG_ACTIONS.LOGIN,
            status: 'failure',
            details: 'Compte désactivé',
          },
          req
        );
        throw new Error(
          'Ce compte a été désactivé. Contactez un administrateur.'
        );
      }

      if (!admin.confirmed) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: admin._id.toString(),
            action: LOG_ACTIONS.LOGIN,
            status: 'failure',
            details: 'Compte non confirmé',
          },
          req
        );
        throw new Error(
          'Veuillez confirmer votre compte via le lien envoyé par email avant de vous connecter.'
        );
      }

      const isValidPassword = await admin.comparePassword(password);
      if (!isValidPassword) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: admin._id.toString(),
            action: LOG_ACTIONS.LOGIN,
            status: 'failure',
            details: 'Mot de passe incorrect',
          },
          req
        );
        throw new Error('Identifiants invalides');
      }

      if (!admin.confirmed) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: admin._id.toString(),
            action: LOG_ACTIONS.LOGIN,
            status: 'failure',
            details: 'Compte non confirmé',
          },
          req
        );
        throw new Error(
          'Veuillez confirmer votre compte via le lien envoyé par email avant de vous connecter.'
        );
      }

      if (admin.mfaEnabled) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: admin._id.toString(),
            action: LOG_ACTIONS.LOGIN,
            status: 'success',
            details: 'MFA requis',
          },
          req
        );
        return { requireMfa: true, admin };
      }

      // Si MFA n'est pas activé, on génère directement le token
      const token = this.generateToken(admin);
      admin.lastLogin = new Date();
      await admin.save();

      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.ADMIN,
          entityId: admin._id.toString(),
          action: LOG_ACTIONS.LOGIN,
          status: 'success',
          details: 'Connexion réussie sans MFA',
        },
        req
      );

      return { requireMfa: false, token, admin };
    } catch (error) {
      throw error;
    }
  }

  static async verifyMfaAndLogin(
    adminId: string,
    mfaToken: string,
    req?: Request
  ): Promise<{
    token: string;
    admin: IAdmin;
  }> {
    try {
      const admin = (await Admin.findById(adminId).select(
        '+mfaSecret'
      )) as IAdminDocument | null;
      if (!admin || !admin.isActive || !admin.mfaEnabled) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId,
            action: LOG_ACTIONS.MFA_VERIFY,
            status: 'failure',
            details: 'Session invalide',
          },
          req
        );
        throw new Error('Session invalide');
      }

      const isValidToken = admin.verifyMfaToken(mfaToken);
      if (!isValidToken) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId,
            action: LOG_ACTIONS.MFA_VERIFY,
            status: 'failure',
            details: 'Code MFA invalide',
          },
          req
        );
        throw new Error('Code MFA invalide');
      }

      const token = this.generateToken(admin);
      admin.lastLogin = new Date();
      await admin.save();

      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.ADMIN,
          entityId: adminId,
          action: LOG_ACTIONS.MFA_VERIFY,
          status: 'success',
          details: 'Vérification MFA réussie',
        },
        req
      );

      return { token, admin };
    } catch (error) {
      throw error;
    }
  }

  static async setupMfa(
    adminId: Types.ObjectId,
    req?: Request
  ): Promise<{
    secret: string;
    otpauthUrl: string;
  }> {
    try {
      const admin = (await Admin.findById(adminId).select(
        '+mfaSecret'
      )) as IAdminDocument | null;
      if (!admin) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId.toString(),
            action: LOG_ACTIONS.MFA_SETUP,
            status: 'failure',
            details: 'Admin non trouvé',
          },
          req
        );
        throw new Error('Admin non trouvé');
      }

      const secret = admin.generateMfaSecret();
      const otpauthUrl = admin.getMfaQrCodeUrl();
      if (!otpauthUrl) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId.toString(),
            action: LOG_ACTIONS.MFA_SETUP,
            status: 'failure',
            details: "Erreur lors de la génération de l'URL TOTP",
          },
          req
        );
        throw new Error("Erreur lors de la génération de l'URL TOTP");
      }

      await admin.save();

      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.ADMIN,
          entityId: adminId.toString(),
          action: LOG_ACTIONS.MFA_SETUP,
          status: 'success',
          details: 'Configuration MFA initiée',
        },
        req
      );

      return { secret, otpauthUrl };
    } catch (error) {
      throw error;
    }
  }

  static async activateMfa(
    adminId: Types.ObjectId,
    mfaToken: string,
    req?: Request
  ): Promise<void> {
    try {
      const admin = (await Admin.findById(adminId).select(
        '+mfaSecret'
      )) as IAdminDocument | null;
      if (!admin) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId.toString(),
            action: LOG_ACTIONS.MFA_ACTIVATE,
            status: 'failure',
            details: 'Admin non trouvé',
          },
          req
        );
        throw new Error('Admin non trouvé');
      }

      const isValidToken = admin.verifyMfaToken(mfaToken);
      if (!isValidToken) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId.toString(),
            action: LOG_ACTIONS.MFA_ACTIVATE,
            status: 'failure',
            details: 'Code MFA invalide',
          },
          req
        );
        throw new Error('Code MFA invalide');
      }

      admin.mfaEnabled = true;
      await admin.save();

      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.ADMIN,
          entityId: adminId.toString(),
          action: LOG_ACTIONS.MFA_ACTIVATE,
          status: 'success',
          details: 'MFA activé avec succès',
        },
        req
      );
    } catch (error) {
      throw error;
    }
  }

  static async deactivateMfa(
    adminId: Types.ObjectId,
    mfaToken: string,
    req?: Request
  ): Promise<void> {
    try {
      const admin = (await Admin.findById(adminId).select(
        '+mfaSecret'
      )) as IAdminDocument | null;
      if (!admin) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId.toString(),
            action: LOG_ACTIONS.MFA_DEACTIVATE,
            status: 'failure',
            details: 'Admin non trouvé',
          },
          req
        );
        throw new Error('Admin non trouvé');
      }

      const isValidToken = admin.verifyMfaToken(mfaToken);
      if (!isValidToken) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId.toString(),
            action: LOG_ACTIONS.MFA_DEACTIVATE,
            status: 'failure',
            details: 'Code MFA invalide',
          },
          req
        );
        throw new Error('Code MFA invalide');
      }

      admin.mfaEnabled = false;
      admin.mfaSecret = undefined;
      await admin.save();

      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.ADMIN,
          entityId: adminId.toString(),
          action: LOG_ACTIONS.MFA_DEACTIVATE,
          status: 'success',
          details: 'MFA désactivé avec succès',
        },
        req
      );
    } catch (error) {
      throw error;
    }
  }

  private static generateToken(admin: IAdmin): string {
    return jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        type: 'admin',
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  static async addAdminToAccountContributor(
    admin: IAdmin,
    contributorId: string
  ) {
    const contributor = await Contributor.findById(contributorId);
    if (contributor) {
      if (!contributor._id) {
        throw new Error("Le contributeur n'est pas associé à un partenaire");
      }

      const password = generatePassword();

      const payload = {
        email: admin.email,
        password,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: 'SUPER_ADMIN',
        address: admin.address,
        confirmed: true,
        isActive: true,
      };

      const newOwner = new Admin(payload);
      await newOwner.save();

      Admin.findByIdAndUpdate(newOwner._id, {
        $set: {
          contributorId: contributor._id,
        },
      });
    }
  }

  static async resetPassword(
    payload: {
      email: string;
      password: string;
    },
    req?: Request
  ): Promise<IAdminDocument> {
    const { email, password } = payload;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.ADMIN,
          entityId: email,
          action: LOG_ACTIONS.PASSWORD_RESET,
          status: 'failure',
          details: 'Aucun compte trouvé avec cet email',
        },
        req
      );
      throw new Error('Aucun compte trouvé avec cet email');
    }

    const salt = await bcrypt.genSalt(10);
    const newpassword = await bcrypt.hash(password, salt);

    const updatedAdmin = (await Admin.findByIdAndUpdate(
      admin._id,
      {
        $set: {
          password: newpassword,
        },
      },
      { new: true }
    )) as IAdminDocument | null;

    if (!updatedAdmin) {
      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.ADMIN,
          entityId: admin._id as string,
          action: LOG_ACTIONS.PASSWORD_RESET,
          status: 'failure',
          details: 'Erreur lors de la mise à jour du mot de passe',
        },
        req
      );
      throw new Error('Erreur lors de la mise à jour du mot de passe');
    }

    await LogService.createLog(
      {
        entityType: LOG_ENTITY_TYPES.ADMIN,
        entityId: updatedAdmin._id.toString(),
        action: LOG_ACTIONS.PASSWORD_RESET,
        status: 'success',
        details: 'Mot de passe réinitialisé',
      },
      req
    );

    return updatedAdmin;
  }
}
