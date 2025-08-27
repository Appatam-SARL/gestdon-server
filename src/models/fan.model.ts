import mongoose, { Document, Schema } from 'mongoose';

interface IFan extends Document {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
    avatar: string;
    coverPhoto: string;
    website: string;
  };
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  isPrivate: boolean;
  isVerified: boolean;
  isActive: boolean;
  isProfileComplete: boolean;
  checkProfileComplete(): boolean;
}

interface IFanModel extends mongoose.Model<IFan> {
  updateProfileCompletionStatus(fanId: string): Promise<boolean>;
}

const fanSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    profile: {
      firstName: {
        type: String,
        trim: true,
        default: '',
      },
      lastName: {
        type: String,
        trim: true,
        default: '',
      },
      bio: {
        type: String,
        maxlength: 500,
        default: '',
      },
      avatar: {
        type: String, // URL de l'image de profil
        default: '',
      },
      coverPhoto: {
        type: String, // URL de la photo de couverture
        default: '',
      },
      website: {
        type: String,
        default: '',
      },
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Fan',
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Fan',
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour la recherche par email ou téléphone
fanSchema.index({ email: 1, phoneNumber: 1 });

// Méthode pour vérifier si le profil est complet
fanSchema.methods.checkProfileComplete = function (): boolean {
  const profile = this.profile;
  // Le profil est considéré comme complet si firstName, lastName et avatar sont renseignés
  return !!(profile.firstName && profile.lastName && profile.avatar);
};

// Méthode statique pour vérifier et mettre à jour le statut du profil
fanSchema.statics.updateProfileCompletionStatus = async function (
  fanId: string
): Promise<boolean> {
  const fan = await this.findById(fanId);
  if (!fan) {
    throw new Error('Fan non trouvé');
  }

  const isComplete = fan.checkProfileComplete();

  // Mettre à jour le statut seulement si il a changé
  if (fan.isProfileComplete !== isComplete) {
    fan.isProfileComplete = isComplete;
    await fan.save();
  }

  return isComplete;
};

// Middleware pre-save pour mettre à jour isProfileComplete
fanSchema.pre('save', function (next) {
  (this as any).isProfileComplete = (this as any).checkProfileComplete();
  next();
});

const Fan = mongoose.model<IFan, IFanModel>('Fan', fanSchema);

export default Fan;
export type { IFan };
