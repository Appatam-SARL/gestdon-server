import z from 'zod';

export const fanValidation = {
  // Validation pour l'inscription
  register: {
    body: z.object({
      username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/)
        .nonempty("Le nom d'utilisateur est requis")
        .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
        .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères")
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores"
        ),
      email: z
        .string()
        .email()
        .toLowerCase()
        .nonempty("L'email est requis")
        .email("Format d'email invalide"),
      password: z
        .string()
        .min(6)
        .nonempty('Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
      phoneNumber: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/)
        .optional(),
    }),
  },

  // Validation pour la connexion
  login: {
    body: z.object({
      identifier: z.string().nonempty('Email ou numéro de téléphone requis'),
      password: z.string().nonempty('Mot de passe requis'),
    }),
  },

  // Validation pour la mise à jour du profil
  updateProfile: {
    body: z.object({
      firstName: z.string().min(2).max(50).trim().optional(),
      lastName: z.string().min(2).max(50).trim().optional(),
      bio: z.string().max(500).trim().optional(),
      avatar: z.string().url().optional(),
      coverPhoto: z.string().url().optional(),
      website: z.string().url().optional(),
    }),
  },

  // Validation pour la mise à jour du mot de passe
  updatePassword: {
    body: z.object({
      currentPassword: z.string().nonempty("L'ancien mot de passe est requis"),
      newPassword: z
        .string()
        .min(6)
        .nonempty('Le nouveau mot de passe est requis'),
    }),
  },

  // Validation pour la recherche
  search: {
    params: z.object({
      q: z
        .string()
        .min(1)
        .max(100)
        .nonempty('La requête de recherche est requise'),
      limit: z
        .number()
        .int()
        .positive()
        .min(1, 'La limite doit être au moins 1')
        .max(50, 'La limite ne peut pas dépasser 50')
        .default(10),
    }),
  },

  // Validation pour les paramètres de route
  params: z.object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/)
      .nonempty("Le nom d'utilisateur est requis")
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores"
      ),
    targetFanId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .nonempty('ID du fan cible requis'),
  }),
};
