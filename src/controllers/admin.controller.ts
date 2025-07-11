import { HttpStatusCode } from 'axios';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '../config';
import { Admin } from '../models/admin.model';
import { BlacklistedToken } from '../models/blacklisted-token.model';
import { AdminAuthService } from '../services/admin-auth.service';
import { EmailService } from '../services/email.service';
import { LogService } from '../services/log.service';
import { getAdminInvitationTemplate } from '../templates/emails/admin-invitation.template';
import { getAdminWelcomeTemplate } from '../templates/emails/admin-welcome.template';
import { getEmailResetPasswordTemplate } from '../templates/emails/email-reset-password.template';
import { LOG_ACTIONS, LOG_ENTITY_TYPES } from '../types/log.types';
import { handleError } from '../utils/functions';
import { generatePassword } from '../utils/password.utils';

export class AdminController {
  // Méthodes d'authentification
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Email et mot de passe requis' });
        return;
      }

      const result = await AdminAuthService.login(email, password);
      console.log(result);

      if (result.requireMfa) {
        res.json({
          requireMfa: true,
          adminId: result.admin?._id,
          message: 'Code MFA requis',
        });
      } else {
        res.json({
          token: result.token,
          admin: {
            id: result.admin?._id,
            email: result.admin?.email,
            firstName: result.admin?.firstName,
            lastName: result.admin?.lastName,
            role: result.admin?.role,
            mfaEnabled: result.admin?.mfaEnabled,
            contributorId: result.admin?.contributorId,
          },
        });
      }
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async verifyMfaAndLogin(req: Request, res: Response): Promise<void> {
    try {
      const { adminId, mfaToken } = req.body;
      const result = await AdminAuthService.verifyMfaAndLogin(
        adminId,
        mfaToken,
        req
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Méthodes MFA
  static async setupMfa(req: Request, res: Response): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.params.adminId);
      const result = await AdminAuthService.setupMfa(adminId, req);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async activateMfa(req: Request, res: Response): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.params.adminId);
      const { mfaToken } = req.body;
      await AdminAuthService.activateMfa(adminId, mfaToken, req);
      res.json({ message: 'MFA activé avec succès' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async deactivateMfa(req: Request, res: Response): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.params.adminId);
      const { mfaToken } = req.body;
      await AdminAuthService.deactivateMfa(adminId, mfaToken, req);
      res.json({ message: 'MFA désactivé avec succès' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Méthode pour vérifier le token de confirmation via API (utilisée par le front-end)
  static async verifyConfirmationToken(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ message: 'Token manquant' });
        return;
      }

      // Hash le token pour le comparer avec celui stocké en base
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Rechercher l'admin avec ce token et s'assurer qu'il n'a pas expiré
      const admin = await Admin.findOne({
        confirmationToken: hashedToken,
        confirmationTokenExpires: { $gt: new Date() },
      });

      // Si aucun admin trouvé avec ce token, vérifier si c'est parce que le compte est déjà confirmé
      if (!admin) {
        // Essayer de trouver un admin qui aurait le même token hashé mais dont le compte est déjà confirmé
        // Note: cette recherche est approximative car le token aurait pu être supprimé lors de la confirmation
        const confirmedAdmin = await Admin.findOne({
          confirmationToken: hashedToken,
          confirmed: true,
        });

        if (confirmedAdmin) {
          // Le compte a déjà été confirmé
          res.status(200).json({
            message: 'Ce compte a déjà été confirmé',
            admin: {
              id: confirmedAdmin._id,
              email: confirmedAdmin.email,
              firstName: confirmedAdmin.firstName,
              lastName: confirmedAdmin.lastName,
              role: confirmedAdmin.role,
            },
            alreadyConfirmed: true,
          });
        } else {
          // Essayons de trouver un compte non confirmé (sans token ou avec token expiré) mais avec une adresse email qui correspond
          // Cela nécessite que le token contienne une information sur l'email, ce qui n'est pas le cas actuellement
          // On peut donc juste renvoyer une erreur générique
          res.status(400).json({
            message: 'Le token de confirmation est invalide ou a expiré',
          });
        }
        return;
      }

      // Si le compte est déjà confirmé
      if (admin.confirmed) {
        res.status(200).json({
          message: 'Ce compte a déjà été confirmé',
          admin: {
            id: admin._id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role,
          },
          alreadyConfirmed: true,
        });
        return;
      }

      // Mettre à jour l'admin
      admin.confirmed = true;
      admin.confirmationToken = undefined;
      admin.confirmationTokenExpires = undefined;
      await admin.save();

      // Journaliser la confirmation du compte
      if (admin._id) {
        await LogService.createLog(
          {
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: admin._id.toString(),
            action: LOG_ACTIONS.ACCOUNT_CONFIRMED,
            status: 'success',
            details: 'Compte confirmé par email',
          },
          req
        );
      }

      res.status(200).json({
        message: 'Compte confirmé avec succès',
        admin: {
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
        },
        alreadyConfirmed: false,
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  // Méthodes CRUD
  static async getAllAdmins(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role,
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      console.log(req.query);

      // Construction du filtre
      const filter: any = {};

      // Filtre par rôle
      if (role) {
        filter.role = role;
      }

      // Filtre par statut
      if (typeof isActive === 'string') {
        filter.isActive = isActive === 'true';
      }

      // Recherche sur email, prénom ou nom
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ];
      }

      // Calcul de la pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Préparation du tri
      const sort: { [key: string]: 'asc' | 'desc' } = {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      };

      // Exécution de la requête
      const [admins, total] = await Promise.all([
        Admin.find(filter)
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(Number(limit)),
        Admin.countDocuments(filter),
      ]);

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(total / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      res.json({
        admins,
        metadata: {
          total,
          page: Number(page),
          totalPages,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getAdminById(req: Request, res: Response): Promise<void> {
    try {
      const admin = await Admin.findById(req.params.id).select('-password');
      if (!admin) {
        res.status(404).json({ message: 'Admin non trouvé' });
        return;
      }
      res.json(admin);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, firstName, lastName, role, address } = req.body;

      // Vérifier si l'email existe déjà
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        res.status(400).json({ message: 'Cet email est déjà utilisé' });
        return;
      }

      // Générer un mot de passe sécurisé
      const generatedPassword = generatePassword();

      const admin = new Admin({
        email,
        password: generatedPassword,
        firstName,
        lastName,
        address,
        role: role || 'ADMIN',
        confirmed: false,
      });

      // Générer un token de confirmation
      const confirmationToken = admin.generateConfirmationToken();

      await admin.save();

      // 2. Création automatique des permissions pour le membre
      // await Promise.all(
      //   PERMISSIONS.map((permission) =>
      //     PermissionService.createPermissionsForAdmin(
      //       permission.menu,
      //       permission.label,
      //       permission.actions,
      //       admin._id as string
      //     )
      //   )
      // );

      // Déterminer l'URL du frontend selon l'environnement
      const frontendUrl =
        process.env[`ADMIN_URL_${process.env.NODE_ENV?.toUpperCase()}`];

      console.log(
        '🚀 ~ AdminController ~ createAdmin ~ frontendUrl:',
        frontendUrl
      );

      // Construire l'URL de confirmation qui pointe directement vers le frontend
      const confirmationUrl = `${frontendUrl}/account-validation?token=${confirmationToken}`;

      // Envoyer l'email de bienvenue avec les identifiants et le lien de confirmation
      try {
        const emailTemplate = getAdminWelcomeTemplate({
          firstName,
          password: generatedPassword,
          loginUrl: config.email.adminLoginUrl,
          confirmationUrl,
        });

        console.log('📧 Template email généré');
        console.log('📧 Config email utilisée:', {
          adminLoginUrl: config.email.adminLoginUrl,
        });

        await EmailService.sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        })
          .then(() => {
            console.log('📧 Email envoyé avec succès à', email);
          })
          .catch((error) => {
            console.error("❌ Erreur lors de l'envoi de l'email:", error);
            // On continue même si l'email échoue, mais on log l'erreur
          });
      } catch (emailError) {
        console.error(
          "❌ Erreur lors de la préparation de l'email:",
          emailError
        );
        // On continue même si l'email échoue, mais on log l'erreur
      }

      // Ne pas renvoyer le mot de passe
      const { password: _, ...adminResponse } = admin.toObject();

      // Renvoyer l'admin créé avec le mot de passe généré en clair
      res.status(201).json({
        ...adminResponse,
        generatedPassword, // Mot de passe en clair pour première connexion
        confirmationUrl, // Inclure l'URL de confirmation dans la réponse pour le débogage
        message:
          'Admin créé avec succès. Un email contenant les identifiants et le lien de confirmation a été envoyé.',
      });
    } catch (error) {
      console.error("❌ Erreur lors de la création de l'admin:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async createAdminByInvitation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { email } = req.body; // Get only the invited email from the body
      // Assuming inviting admin ID is available from authenticated user context
      const invitingAdminId = req.admin?.id;

      if (!invitingAdminId) {
        res
          .status(401)
          .json({ message: 'Administrateur invitant non authentifié.' });
        return;
      }

      // Find the inviting admin to get their details for the email
      const invitingAdmin = await Admin.findById(invitingAdminId);
      if (!invitingAdmin) {
        res
          .status(404)
          .json({ message: 'Administrateur invitant introuvable.' });
        return;
      }

      // Optional: Check if invited email already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        return;
      }

      // Generate a JWT token for the invitation
      // This token will contain the invited email and inviting admin ID
      const invitationToken = jwt.sign(
        { invitedEmail: email, invitedById: invitingAdminId },
        process.env.JWT_SECRET || 'your-secret-key', // Use your JWT secret
        { expiresIn: '48h' } // Token valid for 48 hours
      );

      // Determine the frontend URL based on environment
      const frontendUrl =
        process.env[`ADMIN_URL_${process.env.NODE_ENV?.toUpperCase()}`];

      if (!frontendUrl) {
        console.error('❌ Frontend URL not configured.');
        res.status(500).json({
          message: 'Configuration du serveur incomplète (URL frontend).',
        });
        return;
      }

      // Construire l'URL d'inscription qui pointe directement vers le frontend avec le token
      const registrationUrl = `${frontendUrl}/register-invited?token=${invitationToken}`; // Assuming a registration page path '/register-invited'

      // Envoyer l'email d'invitation
      try {
        const emailTemplate = getAdminInvitationTemplate({
          invitingAdminFirstName: invitingAdmin.firstName || 'Un', // Handle potential missing names
          invitingAdminLastName: invitingAdmin.lastName || 'administrateur',
          registrationUrl,
        });

        console.log("📧 Template email d'invitation généré");

        await EmailService.sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        })
          .then(() => {
            console.log("📧 Email d'invitation envoyé avec succès à", email);
          })
          .catch((error) => {
            console.error(
              "❌ Erreur lors de l'envoi de l'email d'invitation:",
              error
            );
            // Log the error, but still return success if token generated
          });
      } catch (emailError) {
        console.error(
          "❌ Erreur lors de la préparation de l'email d'invitation:",
          emailError
        );
        // Log the error, but still return success if token generated
      }

      // Respond with success message and potentially the token/URL for debugging/frontend redirect
      res.status(200).json({
        message: 'Invitation envoyée avec succès.',
        invitedEmail: email,
        invitationToken,
        registrationUrl,
      });
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'invitation:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, role, isActive } = req.body;

      console.log(`user updated ${firstName}`);

      const adminId = req.params.id;

      const admin = await Admin.findById(adminId);
      if (!admin) {
        res.status(404).json({ message: 'Admin non trouvé' });
        return;
      }

      // Mise à jour des champs
      if (firstName) admin.firstName = firstName;
      if (lastName) admin.lastName = lastName;
      if (email) admin.email = email;
      if (role) admin.role = role;
      if (typeof isActive === 'boolean') admin.isActive = isActive;

      await admin.save();

      // Ne pas renvoyer le mot de passe
      const { password: _, ...adminResponse } = admin.toObject();

      res.json(adminResponse);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async deleteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const admin = await Admin.findById(req.params.id);
      if (!admin) {
        res.status(404).json({ message: 'Admin non trouvé' });
        return;
      }

      // Soft delete
      admin.isActive = false;
      await admin.save();

      res.json({ message: 'Admin supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.params.id;

      const admin = await Admin.findById(adminId).select('+password');
      if (!admin) {
        res.status(404).json({ message: 'Admin non trouvé' });
        return;
      }

      // Vérifier l'ancien mot de passe
      const isValidPassword = await admin.comparePassword(currentPassword);
      if (!isValidPassword) {
        res.status(400).json({ message: 'Mot de passe actuel incorrect' });
        return;
      }

      // Mettre à jour le mot de passe
      admin.password = newPassword;
      await admin.save();

      res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.admin?.id;
      console.log('🚀 ~ AdminController ~ logout ~ adminId:', adminId);
      const token = req.headers.authorization?.split(' ')[1];

      if (adminId && token) {
        // Mettre à jour lastLogin
        const admin = await Admin.findById(adminId);
        if (admin) {
          admin.lastLogin = new Date();
          await admin.save();
        }

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
            entityType: LOG_ENTITY_TYPES.ADMIN,
            entityId: adminId,
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

  static async forgetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const admin = await Admin.findOne({ email });

      if (admin) {
        const token = jwt.sign(
          {
            email: admin.email,
            role: admin.role,
          },
          process.env.JWT_SECRET as string,
          {
            expiresIn: '1d',
          }
        );

        // await admin.updateOne({ token });

        // Envoyer l'email de bienvenue avec les identifiants et le lien de confirmation
        try {
          const resetEmailTemplate = getEmailResetPasswordTemplate({
            firstName: admin.firstName,
            resetUrl: `${config.email.adminForgotPasswordUrl}?token=${token}`,
          });

          console.log('📧 Template email généré');
          console.log('📧 Config email utilisée:', {
            adminLoginUrl: config.email.adminLoginUrl,
          });

          await EmailService.sendEmail({
            to: admin.email,
            subject: resetEmailTemplate.subject,
            html: resetEmailTemplate.html,
          })
            .then(() => {
              console.log('📧 Email envoyé avec succès à', email);
            })
            .catch((error) => {
              console.error("❌ Erreur lors de l'envoi de l'email:", error);
              // On continue même si l'email échoue, mais on log l'erreur
            });
        } catch (emailError) {
          console.error(
            "❌ Erreur lors de la préparation de l'email:",
            emailError
          );
        }

        res.status(200).json({
          message: 'Email de réinitialisation de mot de passe envoyé',
          data: {
            email: admin.email,
          },
        });
      } else {
        res.status(404).json({
          message: 'Aucun compte trouvé avec cet email',
        });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
  static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token;
      const password = req.body.password;

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        email: string;
        role: string;
      };

      const admin = await AdminAuthService.resetPassword(
        {
          email: decoded.email,
          password,
        },
        req
      );

      res.json({
        message: 'Mot de passe réinitialisé avec succès',
        data: {
          email: admin.email,
        },
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
    let adminFound;
    try {
      const token = req?.header('Authorization')?.replace('Bearer ', '');
      console.log('🚀 ~ AdminController ~ token:', token);
      adminFound = await Admin.findOne({
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

        const admin = await Admin.findOne(query).populate('contributorId'); // Populate the contributorId field

        if (!admin) {
          const message = !admin
            ? 'Membre introuvable ! Veuillez vous identifier.'
            : 'Le compte est déjà connecté à un autre appareil. Veuillez vous identifier.\n\nLe même compte ne peut être connecté que sur un seul appareil.';
          return res.status(200).send({
            success: false,
            admin: null,
            pdv: null,
            store: null,
            message,
          });
        }

        await admin.save();
        const contributor = admin.contributorId;

        return res.status(200).send({ success: true, admin, contributor });
      }
      return res.status(200).send({
        success: false,
        admin: null,
        contributor: null,
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return res.status(HttpStatusCode.Unauthorized).send({
          success: false,
          admin: adminFound,
          contributor: null,
          message: 'Votre session a expiré. Veuillez-vous reconnecter.',
        });
      } else handleError(error, res);
    }
  };
}
