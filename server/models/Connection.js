import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    recipient: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    offeredSkill: {
      id: { type: String },
      name: { type: String, required: true },
      level: { type: String, default: 'Intermediate' },
      category: { type: String, default: 'Programming' }
    },
    requestedSkill: {
      id: { type: String },
      name: { type: String, required: true },
      level: { type: String, default: 'Intermediate' },
      category: { type: String, default: 'Programming' }
    },
    proposalText: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate pending requests between the same sender and recipient atomically
connectionSchema.index(
  { sender: 1, recipient: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

connectionSchema.index({ sender: 1, status: 1 });
connectionSchema.index({ recipient: 1, status: 1 });

export const Connection = mongoose.models.Connection || mongoose.model('Connection', connectionSchema);
export default Connection;

