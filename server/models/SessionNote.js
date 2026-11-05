import mongoose from 'mongoose';

const sessionNoteSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true
    },
    authorId: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorAvatar: {
      type: String,
      default: './avatars/default_avatar.svg'
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    },
    resources: [
      {
        title: { type: String, trim: true, maxlength: 100, default: '' },
        url: { type: String, required: true, trim: true, maxlength: 500 }
      }
    ]
  },
  {
    timestamps: true
  }
);

sessionNoteSchema.index({ sessionId: 1, createdAt: 1 });

export const SessionNote = mongoose.models.SessionNote || mongoose.model('SessionNote', sessionNoteSchema);
export default SessionNote;

