import mongoose, { Date, Document, Schema } from 'mongoose';

interface IComment extends Document {
  post: Schema.Types.ObjectId;
  author: Schema.Types.Mixed;
  authorType: 'Contributor' | 'Fan';
  content: String;
  likes: [
    {
      user: Schema.Types.Mixed;
      createdAt: Date;
    }
  ];
  replies: Schema.Types.ObjectId[];
  parentComment: Schema.Types.ObjectId;
  mentions: Schema.Types.ObjectId;
  isEdited: Boolean;
  editedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Le commentaire doit être associé à un post'],
    },
    author: {
      type: Schema.Types.Mixed,
      refPath: 'authorType',
      required: [true, "L'auteur du commentaire est requis"],
    },
    authorType: {
      type: String,
      enum: ['Contributor', 'Fan'],
      required: [true, "Le type d'auteur est requis"],
      default: 'Contributor',
    },
    content: {
      type: String,
      required: [true, 'Le commentaire doit contenir du contenu'],
      minlength: [1, 'Le commentaire doit contenir au moins un caractère'],
      trim: true,
    },
    likes: [
      {
        user: {
          type: Schema.Types.Mixed,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    mentions: [
      {
        type: Schema.Types.Mixed,
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
