import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    },
    clientMsgId: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    }
  },
  {
    timestamps: true
  }
);

// Enforce idempotency: prevent duplicate message saves when client retries
messageSchema.index(
  { conversationId: 1, clientMsgId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMsgId: { $type: 'string' } }
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;

