import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: Schema.Types.ObjectId;
  senderType: 'USER' | 'PARTNER' | 'DRIVER' | 'ADMIN';
  content: string;
  attachments?: string[];
  readBy: Schema.Types.ObjectId[];
  createdAt: Date;
}

export type ConversationType = 'GENERAL' | 'PRODUCT' | 'SUPPORT' | 'CLAIM';

export interface IConversation extends Document {
  participants: {
    id: Schema.Types.ObjectId;
    type: 'USER' | 'PARTNER' | 'DRIVER' | 'ADMIN';
  }[];
  type: ConversationType;
  order?: Schema.Types.ObjectId;
  product?: Schema.Types.ObjectId;
  claim?: Schema.Types.ObjectId;
  subject?: string;
  messages: IMessage[];
  lastMessageAt: Date;
  isActive: boolean;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType',
  },
  senderType: {
    type: String,
    required: true,
    enum: ['USER', 'PARTNER', 'DRIVER', 'ADMIN'],
  },
  content: {
    type: String,
    required: true,
  },
  attachments: [
    {
      type: String,
    },
  ],
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
        id: {
          type: Schema.Types.ObjectId,
          required: true,
          refPath: 'participants.type',
        },
        type: {
          type: String,
          required: true,
          enum: ['USER', 'PARTNER', 'DRIVER', 'ADMIN'],
        },
      },
    ],
    type: {
      type: String,
      enum: ['GENERAL', 'PRODUCT', 'SUPPORT', 'CLAIM'],
      default: 'GENERAL',
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    claim: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
    },
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
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexation pour des recherches efficaces
conversationSchema.index({ participants: 1 });
conversationSchema.index({ order: 1 });
conversationSchema.index({ product: 1 });
conversationSchema.index({ claim: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'messages.content': 'text' });
conversationSchema.index({ tags: 1 });

export const Conversation = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema
);
