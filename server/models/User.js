import mongoose from 'mongoose';
import crypto from 'node:crypto';

const SkillTeachingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `st-${crypto.randomUUID()}`
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    category: {
      type: String,
      default: 'Programming',
      trim: true
    },
    endorsements: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const SkillLearningSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `sl-${crypto.randomUUID()}`
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `user-${crypto.randomUUID()}`
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
      trim: true,
      index: true
    },
    year: {
      type: String,
      default: '1st Year',
      trim: true
    },
    avatar: {
      type: String,
      default: './avatars/default_avatar.svg'
    },
    bio: {
      type: String,
      default: '',
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true
    },
    skillsTeaching: {
      type: [SkillTeachingSchema],
      default: []
    },
    skillsLearning: {
      type: [SkillLearningSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Compound text index for search across name, department, bio, and skills
UserSchema.index({
  name: 'text',
  department: 'text',
  'skillsTeaching.name': 'text',
  'skillsLearning.name': 'text'
});

export const User = mongoose.model('User', UserSchema);

