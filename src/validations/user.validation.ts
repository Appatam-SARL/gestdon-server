import { z } from 'zod';

export const userValidation = {
  register: z.object({
    body: z.object({
      email: z.string().email('Email invalide'),
      phone: z
        .string()
        .regex(/^(?:\+|00)?[1-9]\d{1,14}$/)
        .nonempty('Numéro de téléphone requis'),
      firstName: z
        .string()
        .min(2, 'Le prénom doit contenir au moins 2 caractères'),
      lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
      role: z.enum(['MANAGER', 'COORDINATOR', 'EDITOR', 'AGENT']),
      contributorId: z.string(),
      address: z
        .object({
          street: z.string(),
          city: z.string(),
          postalCode: z.string(),
          country: z.string(),
        })
        .optional(),
    }),
  }),
  registerUserByInvite: z.object({
    params: z.object({
      token: z.string(),
    }),
    body: z.object({
      email: z.string().email('Email invalide'),
      firstName: z
        .string()
        .min(2, 'Le prénom doit contenir au moins 2 caractères'),
      lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
      password: z
        .string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          'Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial'
        ),
      phone: z
        .string()
        .regex(/^(?:\+|00)?[1-9]\d{1,14}$/)
        .nonempty('Numéro de téléphone requis'),
      address: z
        .object({
          street: z.string(),
          city: z.string(),
          postalCode: z.string(),
          country: z.string(),
        })
        .optional(),
    }),
  }),

  login: z.object({
    body: z.object({
      login: z.string({
        required_error: 'Email ou téléphone requis',
        invalid_type_error:
          'Email ou téléphone doit être une chaîne de caractères',
      }),
      password: z
        .string({
          required_error: 'Mot de passe requis',
          invalid_type_error: 'Mot de passe doit être une chaîne de caractères',
        })
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    }),
  }),

  forgotPassword: z.object({
    body: z.object({
      email: z.string().email('Email invalide'),
    }),
  }),

  resetPassword: z.object({
    params: z.object({
      token: z.string(),
    }),
    body: z.object({
      password: z
        .string()
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    }),
  }),

  updateUser: z.object({
    body: z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      phone: z
        .string()
        .regex(/^(?:\+|00)?[1-9]\d{1,14}$/)
        .optional(),
      forceUpdatePhone: z.boolean().optional(),
      role: z.enum(['MANAGER', 'COORDINATOR', 'EDITOR', 'AGENT']).optional(),
      address: z
        .object({
          street: z.string(),
          city: z.string(),
          postalCode: z.string(),
          country: z.string(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
        .optional(),
    }),
  }),

  updatePassword: z.object({
    body: z.object({
      currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
      newPassword: z
        .string()
        .min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
    }),
  }),

  verifyMFA: z.object({
    body: z.object({
      token: z.string().length(6, 'Le code MFA doit contenir 6 caractères'),
    }),
  }),

  disableMFA: z.object({
    body: z.object({
      token: z.string().length(6, 'Le code MFA doit contenir 6 caractères'),
    }),
  }),

  deleteAccount: z.object({
    body: z.object({
      password: z
        .string()
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    }),
  }),

  requestPhoneChange: z.object({
    body: z.object({
      newPhone: z
        .string()
        .regex(/^(?:\+|00)?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide'),
    }),
  }),

  requestEmailChange: z.object({
    body: z.object({
      newEmail: z.string().email('Email invalide'),
    }),
  }),

  inviteUser: z.object({
    body: z.object({
      email: z.string().email('Email invalide'),
      role: z.enum(['MANAGER', 'COORDINATOR', 'EDITOR', 'AGENT']),
    }),
  }),
};
