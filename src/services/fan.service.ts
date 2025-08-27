import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Fan, { IFan } from '../models/fan.model';
export class FanService {
  /**
   * Créer un nouveau fan
   */
  static async createFan(fanData: {
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }): Promise<IFan> {
    // Vérifier si l'email ou le username existe déjà
    const existingFan = await Fan.findOne({
      $or: [
        { email: fanData.email.toLowerCase() },
        { username: fanData.username },
        ...(fanData.phoneNumber ? [{ phoneNumber: fanData.phoneNumber }] : []),
      ],
    });

    if (existingFan) {
      throw new Error(
        'Un utilisateur avec cet email, username ou numéro de téléphone existe déjà'
      );
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(fanData.password, saltRounds);

    // Créer le fan
    const fan = new Fan({
      ...fanData,
      email: fanData.email.toLowerCase(),
      password: hashedPassword,
    });

    return await fan.save();
  }

  /**
   * Authentifier un fan par email ou téléphone
   */
  static async authenticateFan(
    identifier: string,
    password: string
  ): Promise<{
    fan: IFan;
    token: string;
  }> {
    // Rechercher par email ou téléphone
    const fan = await Fan.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phoneNumber: identifier }],
    });

    if (!fan) {
      throw new Error('Identifiants invalides');
    }

    if (!fan.isActive) {
      throw new Error('Compte désactivé');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, fan.password);
    if (!isPasswordValid) {
      throw new Error('Identifiants invalides');
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        fanId: fan._id,
        email: fan.email,
        username: fan.username,
        type: 'fan',
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1y' }
    );

    return { fan, token };
  }

  /**
   * Mettre à jour le profil d'un fan
   */
  static async updateProfile(
    fanId: string,
    profileData: Partial<IFan['profile']>
  ): Promise<IFan> {
    console.log('🚀 ~ FanService ~ updateProfile ~ profileData:', profileData);
    const fan = await Fan.findByIdAndUpdate(
      fanId,
      {
        $set: {
          ...Object.keys(profileData).reduce((acc, key) => {
            acc[`profile.${key}`] = profileData[key as keyof IFan['profile']];
            return acc;
          }, {} as Record<string, unknown>),
        },
      },
      { new: true }
    );
    if (!fan) {
      throw new Error('Fan non trouvé');
    }

    // Vérifier et mettre à jour automatiquement le statut de complétion du profil
    await (Fan as any).updateProfileCompletionStatus(fanId);

    // Récupérer le fan mis à jour avec le nouveau statut
    const updatedFan = await Fan.findById(fanId);
    if (!updatedFan) {
      throw new Error('Fan non trouvé après mise à jour');
    }

    return updatedFan;
  }

  /**
   * Vérifier et mettre à jour le statut de complétion du profil
   */
  static async checkProfileCompletion(
    fanId: string
  ): Promise<{ isComplete: boolean; missingFields: string[] }> {
    const fan = await Fan.findById(fanId);
    if (!fan) {
      throw new Error('Fan non trouvé');
    }

    const missingFields: string[] = [];

    if (!fan.profile.firstName) missingFields.push('firstName');
    if (!fan.profile.lastName) missingFields.push('lastName');
    if (!fan.profile.avatar) missingFields.push('avatar');

    const isComplete = missingFields.length === 0;

    // Mettre à jour le statut dans la base de données
    await (Fan as any).updateProfileCompletionStatus(fanId);

    return {
      isComplete,
      missingFields,
    };
  }

  /**
   * Obtenir le profil d'un fan
   */
  static async getProfile(fanId: string): Promise<IFan> {
    const fan = await Fan.findById(fanId)
      .select('-password')
      .populate(
        'followers',
        'username profile.firstName profile.lastName profile.avatar'
      )
      .populate(
        'following',
        'username profile.firstName profile.lastName profile.avatar'
      );

    if (!fan) {
      throw new Error('Fan non trouvé');
    }

    return fan;
  }

  /**
   * Obtenir le profil public d'un fan par username
   */
  static async getPublicProfile(username: string): Promise<Partial<IFan>> {
    const fan = await Fan.findOne({ username })
      .select(
        'username profile.firstName profile.lastName profile.bio profile.avatar profile.coverPhoto profile.website isPrivate isVerified followers following'
      )
      .populate(
        'followers',
        'username profile.firstName profile.lastName profile.avatar'
      )
      .populate(
        'following',
        'username profile.firstName profile.lastName profile.avatar'
      );

    if (!fan) {
      throw new Error('Fan non trouvé');
    }

    if (fan.isPrivate) {
      throw new Error('Ce profil est privé');
    }

    return fan;
  }

  /**
   * Suivre un autre fan
   */
  static async followFan(fanId: string, targetFanId: string): Promise<void> {
    if (fanId === targetFanId) {
      throw new Error('Vous ne pouvez pas vous suivre vous-même');
    }

    const [fan, targetFan] = await Promise.all([
      Fan.findById(fanId),
      Fan.findById(targetFanId),
    ]);

    if (!fan || !targetFan) {
      throw new Error('Fan non trouvé');
    }

    // Vérifier si déjà en train de suivre
    if (fan.following.includes(targetFan._id as any)) {
      throw new Error('Vous suivez déjà ce fan');
    }

    // Ajouter aux following
    fan.following.push(targetFan._id as any);
    targetFan.followers.push(fan._id as any);

    await Promise.all([fan.save(), targetFan.save()]);
  }

  /**
   * Ne plus suivre un fan
   */
  static async unfollowFan(fanId: string, targetFanId: string): Promise<void> {
    const [fan, targetFan] = await Promise.all([
      Fan.findById(fanId),
      Fan.findById(targetFanId),
    ]);

    if (!fan || !targetFan) {
      throw new Error('Fan non trouvé');
    }

    // Retirer des following
    fan.following = fan.following.filter(
      (id) => !(id as any).equals(targetFan._id)
    );
    targetFan.followers = targetFan.followers.filter(
      (id) => !(id as any).equals(fan._id)
    );

    await Promise.all([fan.save(), targetFan.save()]);
  }

  /**
   * Rechercher des fans par username ou nom
   */
  static async searchFans(
    query: string,
    limit: number = 10
  ): Promise<Partial<IFan>[]> {
    const fans = await Fan.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { 'profile.firstName': { $regex: query, $options: 'i' } },
        { 'profile.lastName': { $regex: query, $options: 'i' } },
      ],
      isActive: true,
    })
      .select(
        'username profile.firstName profile.lastName profile.avatar isPrivate'
      )
      .limit(limit);

    return fans;
  }

  /**
   * Mettre à jour le mot de passe
   */
  static async updatePassword(
    fanId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const fan = await Fan.findById(fanId);
    if (!fan) {
      throw new Error('Fan non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      fan.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const saltRounds = 10;
    fan.password = await bcrypt.hash(newPassword, saltRounds);
    await fan.save();
  }

  /**
   * Désactiver un compte
   */
  static async deactivateAccount(fanId: string): Promise<void> {
    const fan = await Fan.findById(fanId);
    if (!fan) {
      throw new Error('Fan non trouvé');
    }

    fan.isActive = false;
    await fan.save();
  }

  /**
   * Réactiver un compte
   */
  static async reactivateAccount(fanId: string): Promise<void> {
    const fan = await Fan.findById(fanId);
    if (!fan) {
      throw new Error('Fan non trouvé');
    }

    fan.isActive = true;
    await fan.save();
  }
}
