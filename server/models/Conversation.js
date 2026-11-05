import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      index: true
    },
    participants: [
      {
        type: String,
        ref: 'User',
        required: true,
        index: true
      }
    ],
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: String, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: () => new Map()
    }
  },
  {
    timestamps: true
  }
);

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export default Conversation;
