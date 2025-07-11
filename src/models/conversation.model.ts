import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: Schema.Types.ObjectId;
  content: string;
  readBy: Schema.Types.ObjectId[];
  createdAt: Date;
}
export interface IConversation extends Document {
  participants: {
    firstName: string;
    lastName: string;
    email: string;
  }[];
  subject?: string;
  messages: IMessage[];
  lastMessageAt: Date;
  isActive: boolean;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  content: {
    type: String,
    required: true,
  },
  readBy: [
    {
      type: Schema.Types.ObjectId,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        firstName: {
          type: String,
          required: true,
        },
        lastName: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
      },
    ],
    subject: {
      type: String,
    },
    messages: [messageSchema],
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'PENDING'],
      default: 'OPEN',
    },
  },
  {
    timestamps: true,
  }
);

// Indexation pour des recherches efficaces
conversationSchema.index({ participants: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'messages.content': 'text' });

export const Conversation = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema
);
