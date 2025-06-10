import { HttpStatusCode } from 'axios';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { config } from '../config';
import PERMISSIONS from '../constants/permission';
import { BlacklistedToken } from '../models/blacklisted-token.model';
import { User } from '../models/user.model';
import { EmailService } from '../services/email.service';
import { LogService } from '../services/log.service';
import PermissionService from '../services/permission.service';
import { getAccountDeletionTemplate } from '../templates/emails/account-deletion.template';
import { getEmailChangeValidationTemplate } from '../templates/emails/email-change-validation.template';
import { getUserWelcomeTemplate } from '../templates/emails/user-welcome.template';
import { LOG_ACTIONS, LOG_ENTITY_TYPES } from '../types/log.types';
import { AppError } from '../utils/AppError';
import { sendEmail } from '../utils/email';
import { handleError } from '../utils/functions';
import { verifyTOTP } from '../utils/mfa';
import { generatePassword } from '../utils/password.utils';
import {
  generateVerificationToken,
  getTokenExpiryDate,
} from '../utils/token.utils';

export class UserController {
  // Helpers privés
  private static generateJWT(userId: string): string {
    return jwt.sign(
      { id: userId, type: 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
  }

  private static async checkExistingCredentials(
    email?: string,
    phone?: string
  ): Promise<string | null> {
    // Vérifier si l'email existe déjà
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return 'Cet email est déjà utilisé';
      }
    }

    // Vérifier si le numéro de téléphone existe déjà
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return 'Ce numéro de téléphone est déjà utilisé';
      }
    }

    return null;
  }

  private static normalizePhoneNumber(phone: string): string {
    // Supprimer tous les caractères non numériques sauf +
    let normalized = phone.replace(/[^\d+]/g, '');

    // Remplacer 00 par + au début
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.substring(2);
    }

    return normalized;
  }

  private static async sendWelcomeEmail(
    email: string,
    firstName: string,
    token: string
  ): Promise<void> {
    try {
      const verificationUrl = `${config.frontendUrl}/account-validation?token=${token}`;

      const emailTemplate = getUserWelcomeTemplate({
        firstName,
        verificationUrl,
      });

      await EmailService.sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      // On continue même si l'email échoue
    }
  }

  // CRUD - Create
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        contributorId,
      } = req.body;

      // Vérifier si les identifiants existent déjà
      const existingError = await UserController.checkExistingCredentials(
        email,
        phone
      );
      if (existingError) {
        return next(new AppError(existingError, 400));
      }

      // Création des données utilisateur
      const userData: any = {
        password,
        firstName,
        lastName,
        phone,
        role,
        contributorId,
      };

      // Si email fourni, générer un token de vérification
      if (email) {
        userData.email = email;
        userData.emailVerificationToken = generateVerificationToken();
        userData.emailVerificationExpires = getTokenExpiryDate(24 * 7); // 7 jours
      }

      // génération du mot de passe
      userData.password = generatePassword();

      // Créer et sauvegarder l'utilisateur
      const user = await User.create(userData);

      // Convertir en document Mongoose pour accéder à _id correctement typé
      const userId = (user as any)._id.toString();

      // Générer le token JWT
      const token = UserController.generateJWT(userId);

      // Envoyer l'email de bienvenue si l'email est fourni
      if (email && userData.emailVerificationToken) {
        await UserController.sendWelcomeEmail(
          email,
          firstName,
          userData.emailVerificationToken
        );
      }

      // 2. Création automatique des permissions pour le membre
      await Promise.all(
        PERMISSIONS.map((permission) =>
          PermissionService.createPermissionsForUser(
            permission.menu,
            permission.label,
            permission.actions,
            userId as string
          )
        )
      );

      // Réponse
      res.status(201).json({
        status: 'success',
        token,
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // CRUD - Read All
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, contributorId, role } = req.query;

      // Construction du filtre
      const filter: any = {};

      // Filtre par rôle
      if (role) {
        filter.role = role;
      }

      // Recherche sur email, prénom ou nom
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ];
      }

      if (contributorId) {
        filter.contributorId = contributorId;
      }

      // Calcul de la pagination
      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password -mfaEnabled -notificationPreferences -pushTokens')
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 })
          .populate('contributorId'),
        User.countDocuments(filter),
      ]);

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(total / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      res.status(200).json({
        status: 'success',
        data: users,
        metadata: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // CRUD - Read Single
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params?.id;
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // CRUD - Update
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // Empêcher la mise à jour du mot de passe et du numéro de téléphone via cette route

      const userId = req.params.id;
      const { password, ...updateData } = req.body;
      // const { password, role, phone, email, ...updateData } = req.body;

      // Récupérer l'utilisateur actuel
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      // // Vérifier si le numéro de téléphone ou l'email est différent
      // const isPhoneChanged = phone && phone !== currentUser.phone;
      // const isEmailChanged = email && email !== currentUser.email;

      // // Si tentative de modification du numéro de téléphone ou email
      // if (isPhoneChanged || isEmailChanged) {
      //   return next(
      //     new AppError(
      //       "La modification du numéro de téléphone ou de l'email nécessite une validation. Veuillez utiliser les routes dédiées : /users/request-phone-change ou /users/request-email-change",
      //       400
      //     )
      //   );
      // }

      // Mise à jour de l'utilisateur
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Nouvelle méthode pour demander un changement de numéro de téléphone
  static async requestPhoneChange(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { newPhone } = req.body;
      const userId = req.params.id;

      // Vérifier si le nouveau numéro existe déjà
      const existingPhone = await User.findOne({
        phone: newPhone,
        _id: { $ne: userId },
      });
      if (existingPhone) {
        return next(
          new AppError('Ce numéro de téléphone est déjà utilisé', 400)
        );
      }

      // Générer un token de validation
      const validationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Sauvegarder les informations de changement
      await User.findByIdAndUpdate(userId, {
        pendingPhoneChange: {
          newPhone,
          validationToken,
          tokenExpiry,
        },
      });

      // Envoyer le SMS avec le token
      // TODO: Implémenter l'envoi de SMS avec le token
      // await sendSMS(newPhone, `Votre code de validation pour le changement de numéro est: ${validationToken}`);

      res.status(200).json({
        status: 'success',
        message: 'Un code de validation a été envoyé par SMS',
      });
    } catch (error) {
      next(error);
    }
  }

  // Nouvelle méthode pour demander un changement d'email
  static async requestEmailChange(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { newEmail } = req.body;
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      // Vérifier si le nouvel email existe déjà
      const existingEmail = await User.findOne({
        email: newEmail,
        _id: { $ne: userId },
      });
      if (existingEmail) {
        return next(new AppError('Cet email est déjà utilisé', 400));
      }

      // Générer un token de validation
      const validationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Sauvegarder les informations de changement
      await User.findByIdAndUpdate(userId, {
        pendingEmailChange: {
          newEmail,
          validationToken,
          tokenExpiry,
        },
      });

      // Envoyer l'email avec le lien de validation
      const validationUrl = `${process.env.FRONTEND_URL}/verify-email-change/${validationToken}`;
      const emailTemplate = getEmailChangeValidationTemplate({
        firstName: user.firstName as string,
        validationUrl,
        oldEmail: user.email as string,
        newEmail,
      });

      await sendEmail({
        to: newEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      res.status(200).json({
        status: 'success',
        message: 'Un email de validation a été envoyé',
      });
    } catch (error) {
      next(error);
    }
  }

  // Nouvelle méthode pour valider le changement de numéro de téléphone
  static async validatePhoneChange(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token } = req.params;
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      if (!user.pendingPhoneChange) {
        return next(
          new AppError('Aucune demande de changement de numéro en cours', 400)
        );
      }

      if (user.pendingPhoneChange.tokenExpiry < new Date()) {
        return next(new AppError('Le token de validation a expiré', 400));
      }

      if (user.pendingPhoneChange.validationToken !== token) {
        return next(new AppError('Token de validation invalide', 400));
      }

      // Mettre à jour le numéro de téléphone
      user.phone = user.pendingPhoneChange.newPhone;
      user.pendingPhoneChange = undefined;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Numéro de téléphone mis à jour avec succès',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Nouvelle méthode pour valider le changement d'email
  static async validateEmailChange(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token } = req.params;
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      if (!user.pendingEmailChange) {
        return next(
          new AppError("Aucune demande de changement d'email en cours", 400)
        );
      }

      if (user.pendingEmailChange.tokenExpiry < new Date()) {
        return next(new AppError('Le token de validation a expiré', 400));
      }

      if (user.pendingEmailChange.validationToken !== token) {
        return next(new AppError('Token de validation invalide', 400));
      }

      // Mettre à jour l'email
      user.email = user.pendingEmailChange.newEmail;
      user.pendingEmailChange = undefined;
      await user.save();

      // Add logging for successful email verification
      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.USER,
          entityId: user?._id as string,
          action: LOG_ACTIONS.ACCOUNT_CONFIRMED,
          status: 'success',
          details: `Email verified for user ${user.email}`,
        },
        req
      );

      res.status(200).json({
        status: 'success',
        message: 'Email mis à jour avec succès',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // CRUD - Delete
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  // Authentication
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { login, password } = req.body.body || req.body;

      if (!login || !password) {
        return next(
          new AppError('Email ou téléphone et mot de passe requis', 400)
        );
      }

      // Normaliser le login (email en minuscules, numéro de téléphone standardisé)
      let normalizedLogin = login;

      // Si c'est un email, convertir en minuscules
      if (login.includes('@')) {
        normalizedLogin = login.toLowerCase();
      }
      // Si c'est un numéro de téléphone, normaliser le format
      else {
        normalizedLogin = UserController.normalizePhoneNumber(login);
      }

      // Recherche par email ou téléphone
      const user = await User.findOne({
        $or: [
          // Email (insensible à la casse)
          { email: { $regex: new RegExp(`^${normalizedLogin}$`, 'i') } },
          // Téléphone avec formats variés
          { phone: normalizedLogin },
          // Téléphone sans indicatif (si le login ne commence pas par +)
          ...(!normalizedLogin.startsWith('+')
            ? [{ phone: { $regex: new RegExp(`.*${normalizedLogin}$`) } }]
            : []),
        ],
      }).select('+password +mfaSecret +mfaEnabled');

      if (!user) {
        return next(new AppError('Identifiant ou mot de passe incorrect', 401));
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return next(new AppError('Identifiant ou mot de passe incorrect', 401));
      }

      if (user.mfaEnabled) {
        res.json({
          status: 'success',
          requireMfa: true,
          userId: (user as any)._id.toString(),
          message: 'Code MFA requis',
        });
        return;
      }

      const token = UserController.generateJWT((user as any)._id.toString());

      res.json({
        status: 'success',
        token,
        user: {
          id: (user as any)._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Fonctionnalités de compte
  static async deactivateAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        {
          new: true,
          runValidators: true,
        }
      ).select('-password');

      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      if (!token) {
        return next(new AppError('Token de vérification manquant', 400));
      }

      // Rechercher l'utilisateur avec ce token de vérification
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      });

      if (!user) {
        return next(
          new AppError('Token de vérification invalide ou expiré', 400)
        );
      }

      // Marquer l'email comme vérifié
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Add logging for successful email verification
      await LogService.createLog(
        {
          entityType: LOG_ENTITY_TYPES.USER,
          entityId: user._id as string,
          action: LOG_ACTIONS.ACCOUNT_CONFIRMED,
          status: 'success',
          details: `Email verified for user ${user.email}`,
        },
        req
      );

      res.json({
        status: 'success',
        message: 'Email vérifié avec succès',
        emailVerified: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Le token est déjà vérifié par le middleware d'authentification
      // On récupère l'ID de l'utilisateur depuis req.user
      const userId = (req as any).user?.id;

      if (!userId) {
        return next(new AppError('Token invalide ou expiré', 401));
      }

      // Récupérer les informations de l'utilisateur
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      res.json({
        status: 'success',
        message: 'Token valide',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Gestion de mot de passe
  static async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?._id;
      console.log('🚀 ~ UserController ~ updatePassword ~ userId:', userId);
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return next(new AppError('Mot de passe actuel incorrect', 400));
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Mot de passe mis à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const token = req.headers.authorization?.split(' ')[1];

      if (userId && token) {
        // Mettre à jour lastLogin
        const user = await User.findById(userId);
        await user?.save();

        // Ajouter le token à la liste noire
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as { exp: number };

        await BlacklistedToken.create({
          token,
          expiresAt: new Date(decoded.exp * 1000), // Convertir le timestamp en Date
        });

        // Journaliser la déconnexion
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.USER,
            entityId: userId,
            action: LOG_ACTIONS.LOGOUT,
            status: 'success',
            details: 'Déconnexion réussie',
          },
          req
        );

        res.json({
          message: 'Déconnexion réussie',
          logoutTime: new Date().toISOString(),
        });
      } else {
        res.status(401).json({ message: 'Session invalide' });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user || !user.email) {
        return next(
          new AppError('Aucun utilisateur trouvé avec cet email', 404)
        );
      }

      // Générer un token de réinitialisation
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Hasher le token avant de le sauvegarder
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Sauvegarder le token dans la base de données
      await User.findByIdAndUpdate(user._id, {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetTokenExpires,
      });

      // Envoyer l'email avec le lien de réinitialisation
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe (valide 30 minutes)',
        text: `Pour réinitialiser votre mot de passe, cliquez sur ce lien : ${resetURL}`,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token envoyé par email',
      });
    } catch (error) {
      // En cas d'erreur, supprimer le token de réinitialisation
      await User.findOneAndUpdate(
        { email: req.body.email },
        {
          passwordResetToken: undefined,
          passwordResetExpires: undefined,
        }
      );
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Hasher le token reçu pour le comparer avec celui stocké
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Trouver l'utilisateur avec le token valide et non expiré
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return next(new AppError('Token invalide ou expiré', 400));
      }

      // Mettre à jour le mot de passe
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Mot de passe réinitialisé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  // Authentification MFA
  static async enableMFA(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req?.params?.id);
      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      if (!user.email) {
        return next(
          new AppError(
            "Veuillez ajouter un email à votre compte avant d'activer la MFA",
            400
          )
        );
      }

      // Générer un secret TOTP unique pour l'utilisateur
      // const { secret, qrCode } = await generateTOTP(user.email);

      const secret = user.generateMfaSecret();
      const qrCode = user.getMfaQrCodeUrl();

      // Sauvegarder le secret temporaire
      user.mfaTempSecret = secret;
      await user.save();

      res.status(200).json({
        status: 'success',
        data: {
          qrCode,
          secret,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyAndEnableMFA(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token } = req.body;
      const user = await User.findById(req?.params?.id);

      if (!user || !user.mfaTempSecret) {
        return next(new AppError('Configuration MFA non initiée', 400));
      }

      // Vérifier le token TOTP
      const isValid = verifyTOTP(token, user.mfaTempSecret);
      if (!isValid) {
        return next(new AppError('Code MFA invalide', 400));
      }

      // Activer la MFA définitivement
      user.mfaSecret = user.mfaTempSecret;
      user.mfaEnabled = true;
      user.mfaTempSecret = undefined;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'MFA activée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async disableMFA(req: Request, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      const user = await User.findById(req?.params?.id);

      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      // Vérifier le mot de passe avant de désactiver la MFA
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(new AppError('Mot de passe incorrect', 400));
      }

      // Désactiver la MFA
      user.mfaSecret = undefined;
      user.mfaEnabled = false;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'MFA désactivée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  // Gestion de suppression de compte
  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      const user = await User.findById(req?.user?._id);

      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      // Vérifier le mot de passe avant la suppression
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(new AppError('Mot de passe incorrect', 400));
      }

      // Période de grâce de 7 jours avant la suppression définitive
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      user.accountDeletionScheduled = deletionDate;
      await user.save();

      // Envoyer un email de confirmation avec la possibilité d'annuler
      if (user.email) {
        // Construire l'URL de rétablissement du compte
        const baseUrl = process.env.FRONTEND_URL || 'https://val.com';
        const cancelUrl = `${baseUrl}/account/cancel-deletion?userId=${user._id}`;

        await sendEmail({
          to: user.email,
          subject: `Confirmation de suppression de compte`,
          text: `Votre compte sera définitivement supprimé le ${deletionDate.toLocaleDateString()}. Si vous souhaitez annuler cette suppression, connectez-vous à votre compte avant cette date.`,
          html: getAccountDeletionTemplate({
            userName: user.firstName || 'Client',
            deletionDate,
            cancelUrl,
          }).html,
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Compte programmé pour suppression',
        deletionDate,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelAccountDeletion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await User.findById(req?.params?.id);

      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      user.accountDeletionScheduled = undefined;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Suppression du compte annulée',
      });
    } catch (error) {
      next(error);
    }
  }

  // Gérer les statistiques de l'utilisateur
  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Récupérer l'ID de l'utilisateur depuis les paramètres ou l'utilisateur authentifié
      const userId = req.params.id || req.user?._id?.toString();

      if (!userId) {
        return next(new AppError('ID utilisateur non fourni', 400));
      }

      // Récupérer l'utilisateur de base pour vérifier son existence
      const user = await User.findById(userId);
      if (!user) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }

      interface OrderStatsResult {
        _id: 'DELIVERY' | 'RIDE';
        count: number;
        completedCount: number;
        totalRating: number;
        ratedOrders: number;
      }

      // Aggregation pour compter les commandes par type
      // const orderStats = await Order.aggregate<OrderStatsResult>([
      //   { $match: { customer: new mongoose.Types.ObjectId(userId) } },
      //   {
      //     $group: {
      //       _id: '$orderType',
      //       count: { $sum: 1 },
      //       completedCount: {
      //         $sum: {
      //           $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0],
      //         },
      //       },
      //       totalRating: {
      //         $sum: {
      //           $cond: [
      //             {
      //               $and: [
      //                 { $eq: ['$status', 'COMPLETED'] },
      //                 { $ne: ['$rating', null] },
      //               ],
      //             },
      //             '$rating.score',
      //             0,
      //           ],
      //         },
      //       },
      //       ratedOrders: {
      //         $sum: {
      //           $cond: [
      //             {
      //               $and: [
      //                 { $eq: ['$status', 'COMPLETED'] },
      //                 { $ne: ['$rating', null] },
      //               ],
      //             },
      //             1,
      //             0,
      //           ],
      //         },
      //       },
      //     },
      //   },
      // ]);

      interface UserStats {
        deliveryOrders: number;
        rideOrders: number;
        completedDeliveryOrders: number;
        completedRideOrders: number;
        averageRating: number;
        totalRatedOrders: number;
      }

      // Préparation des statistiques
      const stats: UserStats = {
        deliveryOrders: 0,
        rideOrders: 0,
        completedDeliveryOrders: 0,
        completedRideOrders: 0,
        averageRating: 0,
        totalRatedOrders: 0,
      };

      // Calcul des statistiques
      let totalRating = 0;
      let totalRatedOrders = 0;

      // orderStats.forEach((stat) => {
      //   if (stat._id === 'DELIVERY') {
      //     stats.deliveryOrders = stat.count;
      //     stats.completedDeliveryOrders = stat.completedCount;
      //   } else if (stat._id === 'RIDE') {
      //     stats.rideOrders = stat.count;
      //     stats.completedRideOrders = stat.completedCount;
      //   }

      //   totalRating += stat.totalRating;
      //   totalRatedOrders += stat.ratedOrders;
      // });

      // Calcul de la note moyenne
      stats.totalRatedOrders = totalRatedOrders;
      stats.averageRating =
        totalRatedOrders > 0 ? totalRating / totalRatedOrders : 0;

      console.log('🚀 ~ UserController ~ res.status ~ stats:', stats);
      res.status(200).json({
        status: 'success',
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static findByToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let userFound;
    try {
      const token = req?.header('Authorization')?.replace('Bearer ', '');
      console.log('🚀 ~ AdminController ~ token:', token);
      userFound = await User.findOne({
        token,
      }).populate([
        {
          path: 'contributorId',
        },
      ]);
      const verify: any = jwt.verify(
        token as string,
        process.env.JWT_SECRET as jwt.Secret
      );
      console.log('🚀 ~ AdminController ~ verify:', verify);

      if (verify) {
        const query = {
          _id: verify.id as string,
        };

        const user = await User.findOne(query).populate('contributorId'); // Populate the contributorId field

        if (!user) {
          const message = !user
            ? 'Membre introuvable ! Veuillez vous identifier.'
            : 'Le compte est déjà connecté à un autre appareil. Veuillez vous identifier.\n\nLe même compte ne peut être connecté que sur un seul appareil.';
          return res.status(200).send({
            success: false,
            user: null,
            pdv: null,
            store: null,
            message,
          });
        }

        await user.save();
        const contributor = user.contributorId;

        return res.status(200).send({ success: true, user, contributor });
      }
      return res.status(200).send({
        success: false,
        user: null,
        contributor: null,
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return res.status(HttpStatusCode.Unauthorized).send({
          success: false,
          user: userFound,
          contributor: null,
          message: 'Votre session a expiré. Veuillez-vous reconnecter.',
        });
      } else handleError(error, res);
    }
  };

  static async iniviteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { email, role } = req.body;
      const user = await User.findById(id);
      if (!user) {
        next(new AppError("L'utilisateur n'existe pas", 400));
      }

      // Vérifier que l'email existe déjà
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return next(new AppError('Cet email est déjà utilisé', 400));
      }

      const token = jwt.sign(
        {
          id: user?._id,
          fullName: user?.fullName,
          email,
          role,
          contributorId: user?.contributorId,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      const frontendUrl =
        process.env[`ADMIN_URL_${process.env.NODE_ENV?.toUpperCase()}`];

      const invitationUrl = `${frontendUrl}/register-invited?token=${token}`;

      await sendEmail({
        to: email,
        subject: 'Invitation à rejoindre Gescom',
        text: `Bonjour,

Vous avez été invité à rejoindre Gescom. Pour vous connecter, cliquez sur le lien suivant : ${invitationUrl}

Cordialement,
L'équipe Gescom`,
      });

      res.status(200).json({
        success: true,
        message: "L'utilisateur a été invité",
      });
    } catch (error) {
      next(error);
    }
  }

  static async registerUserByInvite(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      console.log(req.body);
      // Extract and decode the token
      const token = req.params.token;
      const decoded = jwt.verify(
        token as string,
        process.env.JWT_SECRET as string
      ) as {
        id: string;
        fullName: string;
        email: string;
        role: string;
        contributorId: string;
      };
      console.log('🚀 ~ UserController ~ decoded:', decoded);

      if (!decoded) {
        throw new Error("Le token n'est pas valide");
      }

      // Validate email from token and request body
      if (decoded.email !== req.body.email) {
        throw new Error(
          "L'email du token n'est pas le même que celui du formulaire"
        );
      }

      // Check if email is already in use
      const user = await User.findOne({
        email: req.body.email,
      });
      if (user) {
        throw new Error('Cet email est déjà utilisé');
      }

      // Prepare user payload
      const payload: any = {
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        role: decoded.role,
        contributorId: decoded.contributorId,
        address: req.body.address,
      };

      // Add email and verification details if provided
      if (req.body.email) {
        payload.email = req.body.email;
        payload.emailVerificationToken = generateVerificationToken();
        payload.emailVerificationExpires = getTokenExpiryDate(24 * 7); // 7 jours
      }

      // Save the new user
      const newOwner = new User(payload);
      await newOwner.save();

      // Automatically create permissions for the member
      await Promise.all(
        PERMISSIONS.map((permission) =>
          PermissionService.createPermissionsForUser(
            permission.menu,
            permission.label,
            permission.actions,
            newOwner._id as string
          )
        )
      );

      // Send welcome email
      await UserController.sendWelcomeEmail(
        newOwner.email as string,
        newOwner.firstName as string,
        newOwner.emailVerificationToken as string
      );

      // Response
      res.status(201).json({
        success: true,
        message: 'Votre compte a été créé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
}
