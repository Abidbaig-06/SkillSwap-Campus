import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      required: true,
      index: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    skillName: {
      type: String,
      required: true,
      trim: true
    },
    teacher: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    learner: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    learningObjectives: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 360,
      default: 60
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    status: {
      type: String,
      enum: ['proposed', 'confirmed', 'declined', 'cancelled', 'completed'],
      default: 'proposed',
      index: true
    },
    proposedBy: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    rescheduleProposal: {
      startTime: { type: Date },
      endTime: { type: Date },
      durationMinutes: { type: Number },
      proposedBy: { type: String, ref: 'User' },
      reason: { type: String, trim: true, maxlength: 500 },
      createdAt: { type: Date }
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    cancelledBy: {
      type: String,
      ref: 'User'
    },
    completedBy: [
      {
        type: String,
        ref: 'User'
      }
    ],
    completedAt: {
      type: Date
    },
    clientRequestId: {
      type: String,
      index: true
    },
    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Indexes for conflict checks and efficient queries
sessionSchema.index({ teacher: 1, startTime: 1, endTime: 1, status: 1 });
sessionSchema.index({ learner: 1, startTime: 1, endTime: 1, status: 1 });
sessionSchema.index({ connectionId: 1, status: 1 });
sessionSchema.index(
  { connectionId: 1, clientRequestId: 1 },
  { unique: true, partialFilterExpression: { clientRequestId: { $type: 'string' } } }
);

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema, 'learning_sessions');
export default Session;

