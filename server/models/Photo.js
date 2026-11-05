import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    data: {
      type: Buffer,
      required: true
    },
    contentType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    },
    size: {
      type: Number,
      required: true
    }
  },
  {
    collection: 'photos',
    timestamps: true
  }
);

export const Photo = mongoose.models.Photo || mongoose.model('Photo', PhotoSchema);
