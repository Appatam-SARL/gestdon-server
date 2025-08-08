import mongoose, { Document, Schema } from 'mongoose';

export interface IPosts extends Document {
  author: mongoose.Types.ObjectId;
  content: {
    text: string;
    images: string[];
    videos: string[];
  };
  likes: [
    {
      user: mongoose.Types.ObjectId;
      createdAt: Date;
    }
  ];
  comments: [mongoose.Types.ObjectId];
  shares: [
    {
      user: mongoose.Types.ObjectId;
      createdAt: Date;
    }
  ];
  visibility: string;
  isEdited: boolean;
  editedAt: Date;
  hashtags: string[];
  mentions: string[];
}

const postSchema = new Schema<IPosts>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'Contributor',
      required: [true, "L'auteur du post est requis"],
    },
    content: {
      text: {
        type: String,
        required: [true, 'Le contenu du post est requis'],
      },
      images: [
        {
          fileId: String,
          fileUrl: String,
        },
      ],
      videos: [
        {
          fileId: String,
          fileUrl: String,
          thumbnail: String,
        },
      ],
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
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    shares: [
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
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    hashtags: [String],
    mentions: [
      {
        type: Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Méthodes du schéma Post
postSchema.methods.getLikesCount = function () {
  return this.likes.length;
};

postSchema.methods.getCommentsCount = function () {
  return this.comments.length;
};

postSchema.methods.getSharesCount = function () {
  return this.shares.length;
};

const Post = mongoose.model('Post', postSchema);

export default Post;
