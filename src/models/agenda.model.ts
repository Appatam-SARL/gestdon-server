import mongoose, { Document, Schema } from 'mongoose';

export interface IAgenda extends Document {
  title: string;
  start: Date;
  end: Date;
  ownerId: mongoose.Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AgendaSchema: Schema = new Schema<IAgenda>(
  {
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
    },
    start: {
      type: Date,
      required: [true, 'La date de début est requise'],
    },
    end: {
      type: Date,
      required: [true, 'La date de fin est requise'],
    },
    ownerId: {
      type: String,
      required: [true, "L'identifiant du propriétaire est requis"],
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Validation pour s'assurer que la date de fin est après la date de début
AgendaSchema.pre('save', function (next) {
  const agenda = this as unknown as IAgenda;
  if (agenda.start > agenda.end) {
    next(new Error('La date de fin doit être après la date de début'));
  }
  next();
});

export default mongoose.model<IAgenda>('Agenda', AgendaSchema);
