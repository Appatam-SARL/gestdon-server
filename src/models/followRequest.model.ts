import mongoose, { Schema } from 'mongoose';

const followRequestSchema = new Schema(
  {
    requester: {
      type: Schema.Types.Mixed,
      required: [
        true,
        "L'utilisateur qui demande un suivi doit être renseigné",
      ],
    },
    recipient: {
      type: Schema.Types.Mixed,
      required: [true, "L'utilisateur qui reçoit le suivi doit être renseigné"],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

const FollowRequest = mongoose.model('FollowRequest', followRequestSchema);

export default FollowRequest;
