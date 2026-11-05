import mongoose from 'mongoose';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Connection } from './models/Connection.js';
import { deleteUserPhoto } from './services/photoService.js';
import { disconnectUserSockets } from './socket.js';
import { MONGODB_URI } from './config.js';

export const mongooseInstance = mongoose;

export const MONGO_OPTIONS = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  family: 4,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000
};

/**
 * Connect to MongoDB database with automatic retry
 */
export async function connectDB(customUri = null, maxRetries = 6) {
  const uri = customUri || MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required to connect to the database.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(uri, MONGO_OPTIONS);
      console.log('[Database] Connected to MongoDB successfully.');
      return mongoose.connection;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.min(attempt * 2000, 6000);
        console.warn(`[Database] Connection attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB.');
  }
}

/**
 * Cleanly formats user object for frontend client
 */
export function formatUserProfile(user, skillsOverride = null) {
  if (!user) return null;

  const userObj = user.toObject ? user.toObject() : user;
  const userId = userObj.id || userObj._id;

  let skillsTeaching = [];
  let skillsLearning = [];

  if (Array.isArray(skillsOverride)) {
    skillsTeaching = skillsOverride
      .filter((s) => s.type === 'teach')
      .map((s) => ({
        id: s.id || s._id,
        _id: s._id || s.id,
        name: s.name,
        level: s.level || 'Intermediate',
        category: s.category || 'Programming',
        endorsements: s.endorsements || 0
      }));

    skillsLearning = skillsOverride
      .filter((s) => s.type === 'learn')
      .map((s) => ({
        id: s.id || s._id,
        _id: s._id || s.id,
        name: s.name,
        level: s.level || 'Beginner',
        category: s.category || 'General'
      }));
  } else {
    skillsTeaching = (userObj.skillsTeaching || []).map((s) => ({
      id: s.id || s._id,
      _id: s._id || s.id,
      name: s.name,
      level: s.level || 'Intermediate',
      category: s.category || 'Programming',
      endorsements: s.endorsements || 0
    }));

    skillsLearning = (userObj.skillsLearning || []).map((s) => ({
      id: s.id || s._id,
      _id: s._id || s.id,
      name: s.name,
      level: s.level || 'Beginner',
      category: s.category || 'General'
    }));
  }

  const isDemo = Boolean(userObj.isDemo);

  return {
    id: userId,
    _id: userId,
    name: userObj.name,
    email: userObj.email,
    department: userObj.department || 'Computer Science & Engineering',
    year: userObj.year || '1st Year',
    avatar: userObj.avatar || './avatars/default_avatar.svg',
    bio: userObj.bio || '',
    isVerified: Boolean(userObj.isVerified),
    isDemo: isDemo,
    skillsTeaching,
    skillsLearning,
    stats: {
      skillsTeachingCount: skillsTeaching.length,
      skillsLearningCount: skillsLearning.length,
      connectionsCount: 0,
      sessionsCount: 0,
      reputation: 5.0,
      reviewsCount: 0,
      hoursCompleted: 0,
      weeklyGoalMet: 0,
      weeklyGoalTotal: 4
    }
  };
}

export async function getUserByEmail(email) {
  if (!email) return null;
  return await User.findOne({ email: email.trim().toLowerCase() });
}

export async function getUserById(id) {
  if (!id) return null;
  return await User.findById(id);
}

export async function getUserSkills(userId) {
  const user = await getUserById(userId);
  if (!user) return [];

  const teaching = (user.skillsTeaching || []).map((s) => ({
    id: s._id || s.id,
    _id: s._id || s.id,
    type: 'teach',
    name: s.name,
    level: s.level,
    category: s.category,
    endorsements: s.endorsements || 0
  }));

  const learning = (user.skillsLearning || []).map((s) => ({
    id: s._id || s.id,
    _id: s._id || s.id,
    type: 'learn',
    name: s.name,
    level: s.level,
    category: s.category,
    endorsements: 0
  }));

  return [...teaching, ...learning];
}

export async function createUser({
  id = `user-${crypto.randomUUID()}`,
  email,
  passwordHash,
  name,
  department = 'Computer Science & Engineering',
  year = '1st Year',
  avatar = './avatars/default_avatar.svg',
  bio = '',
  isVerified = false,
  isDemo = false,
  skillsTeaching = [],
  skillsLearning = []
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const formattedTeaching = skillsTeaching.map((s) => {
    const sName = typeof s === 'string' ? s.trim() : (s.name || '').trim();
    const sLevel = typeof s === 'object' && s.level ? s.level : 'Intermediate';
    const sCategory = typeof s === 'object' && s.category ? s.category : 'Programming';
    const sId = typeof s === 'object' && (s.id || s._id) ? (s.id || s._id) : `st-${crypto.randomUUID()}`;
    return {
      _id: sId,
      name: sName,
      level: sLevel,
      category: sCategory,
      endorsements: typeof s === 'object' && s.endorsements ? s.endorsements : 0
    };
  }).filter((s) => s.name);

  const formattedLearning = skillsLearning.map((s) => {
    const sName = typeof s === 'string' ? s.trim() : (s.name || '').trim();
    const sLevel = typeof s === 'object' && s.level ? s.level : 'Beginner';
    const sCategory = typeof s === 'object' && s.category ? s.category : 'General';
    const sId = typeof s === 'object' && (s.id || s._id) ? (s.id || s._id) : `sl-${crypto.randomUUID()}`;
    return {
      _id: sId,
      name: sName,
      level: sLevel,
      category: sCategory
    };
  }).filter((s) => s.name);

  const user = new User({
    _id: id,
    email: normalizedEmail,
    passwordHash,
    name: name.trim(),
    department: department.trim(),
    year: year.trim(),
    avatar,
    bio: bio.trim(),
    isVerified: Boolean(isVerified),
    isDemo: Boolean(isDemo),
    skillsTeaching: formattedTeaching,
    skillsLearning: formattedLearning
  });

  await user.save();
  return { user, skills: await getUserSkills(user._id) };
}

export async function updateUserProfile(userId, { name, bio, department, year, avatar }) {
  if (!userId) throw new Error('User ID is required');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (trimmedName.length < 2) {
      const err = new Error('Name must be at least 2 characters long.');
      err.status = 400;
      throw err;
    }
    user.name = trimmedName;
  }

  if (bio !== undefined) user.bio = String(bio).trim();
  if (department !== undefined) user.department = String(department).trim();
  if (year !== undefined) user.year = String(year).trim();
  if (avatar !== undefined) user.avatar = String(avatar).trim();

  await user.save();
  return user;
}

export async function addUserSkill(userId, { type, name, level, category }) {
  if (!userId) throw new Error('User ID is required');
  if (!type || !['teach', 'learn'].includes(type)) {
    const err = new Error('Skill type must be either "teach" or "learn".');
    err.status = 400;
    throw err;
  }

  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    const err = new Error('Skill name cannot be empty.');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const targetArray = type === 'teach' ? user.skillsTeaching : user.skillsLearning;

  // Case-insensitive duplicate check
  const duplicate = targetArray.some(
    (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (duplicate) {
    const listLabel = type === 'teach' ? 'teaching skills' : 'learning goals';
    const err = new Error(`You have already added "${trimmedName}" to your ${listLabel}.`);
    err.status = 409;
    throw err;
  }

  const prefix = type === 'teach' ? 'st' : 'sl';
  const newId = `${prefix}-${crypto.randomUUID()}`;
  const newSkill = {
    _id: newId,
    id: newId,
    name: trimmedName,
    level: level || (type === 'teach' ? 'Intermediate' : 'Beginner'),
    category: category || (type === 'teach' ? 'Programming' : 'General'),
    endorsements: 0
  };

  targetArray.push(newSkill);
  await user.save();

  return { ...newSkill, id: newSkill._id, _id: newSkill._id, type };
}

export async function removeUserSkill(userId, skillId) {
  if (!userId) throw new Error('User ID is required');
  if (!skillId) {
    const err = new Error('Skill ID is required.');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const cleanSkillId = String(skillId).trim();

  const teachIndex = user.skillsTeaching.findIndex(
    (s) => s._id === cleanSkillId || s.id === cleanSkillId || (s.name && s.name.toLowerCase() === cleanSkillId.toLowerCase())
  );
  if (teachIndex !== -1) {
    const removed = user.skillsTeaching[teachIndex];
    user.skillsTeaching.splice(teachIndex, 1);
    await user.save();
    const removedObj = removed.toObject ? removed.toObject() : removed;
    return {
      ...removedObj,
      id: removedObj._id || removedObj.id,
      _id: removedObj._id || removedObj.id,
      type: 'teach'
    };
  }

  const learnIndex = user.skillsLearning.findIndex(
    (s) => s._id === cleanSkillId || s.id === cleanSkillId || (s.name && s.name.toLowerCase() === cleanSkillId.toLowerCase())
  );
  if (learnIndex !== -1) {
    const removed = user.skillsLearning[learnIndex];
    user.skillsLearning.splice(learnIndex, 1);
    await user.save();
    const removedObj = removed.toObject ? removed.toObject() : removed;
    return {
      ...removedObj,
      id: removedObj._id || removedObj.id,
      _id: removedObj._id || removedObj.id,
      type: 'learn'
    };
  }

  const err = new Error('Skill not found or does not belong to your profile.');
  err.status = 404;
  throw err;
}

export async function updateUserSkill(userId, skillId, { name, level, category }) {
  if (!userId) throw new Error('User ID is required');
  if (!skillId) {
    const err = new Error('Skill ID is required.');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const cleanSkillId = String(skillId).trim();

  let skill = null;
  let type = null;
  let targetArray = null;

  let index = user.skillsTeaching.findIndex(
    (s) => s._id === cleanSkillId || s.id === cleanSkillId || (s.name && s.name.toLowerCase() === cleanSkillId.toLowerCase())
  );

  if (index !== -1) {
    skill = user.skillsTeaching[index];
    type = 'teach';
    targetArray = user.skillsTeaching;
  } else {
    index = user.skillsLearning.findIndex(
      (s) => s._id === cleanSkillId || s.id === cleanSkillId || (s.name && s.name.toLowerCase() === cleanSkillId.toLowerCase())
    );
    if (index !== -1) {
      skill = user.skillsLearning[index];
      type = 'learn';
      targetArray = user.skillsLearning;
    }
  }

  if (!skill) {
    const err = new Error('Skill not found or does not belong to your profile.');
    err.status = 404;
    throw err;
  }

  // Duplicate check within the same list if name is changed
  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
      const err = new Error('Skill name cannot be empty.');
      err.status = 400;
      throw err;
    }

    const duplicate = targetArray.some(
      (s, idx) => idx !== index && s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      const listLabel = type === 'teach' ? 'teaching skills' : 'learning goals';
      const err = new Error(`You already have a skill named "${trimmedName}" in your ${listLabel}.`);
      err.status = 409;
      throw err;
    }
    skill.name = trimmedName;
  }

  if (level !== undefined) {
    const trimmedLevel = String(level).trim();
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(trimmedLevel)) {
      const err = new Error('Proficiency level must be Beginner, Intermediate, or Advanced.');
      err.status = 400;
      throw err;
    }
    skill.level = trimmedLevel;
  }

  if (category !== undefined) {
    const trimmedCategory = String(category).trim();
    if (trimmedCategory) {
      skill.category = trimmedCategory;
    }
  }

  await user.save();

  const skillObj = skill.toObject ? skill.toObject() : skill;
  return {
    ...skillObj,
    id: skillObj._id || skillObj.id,
    _id: skillObj._id || skillObj.id,
    type
  };
}

export async function resetDemoStudent() {
  const demoId = 'demo-ram';
  const demoEmail = 'ram@campus.edu';
  const demoPasswordHash = bcrypt.hashSync('demopassword', 10);

  const ramTeach = [
    { _id: 'st-demo-javascript', name: 'JavaScript', level: 'Intermediate', category: 'Programming', endorsements: 18 },
    { _id: 'st-demo-react', name: 'React', level: 'Intermediate', category: 'Programming', endorsements: 15 },
    { _id: 'st-demo-git-github', name: 'Git & GitHub', level: 'Advanced', category: 'Programming', endorsements: 22 }
  ];

  const ramLearn = [
    { _id: 'sl-demo-python', name: 'Python', level: 'Beginner', category: 'Programming' },
    { _id: 'sl-demo-machine-learning', name: 'Machine Learning', level: 'Beginner', category: 'Programming' },
    { _id: 'sl-demo-ui-ux-design', name: 'UI/UX Design', level: 'Beginner', category: 'Design' }
  ];

  await User.findOneAndUpdate(
    { _id: demoId },
    {
      _id: demoId,
      email: demoEmail,
      passwordHash: demoPasswordHash,
      name: 'Ram',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      bio: 'Interested in web development, problem solving and building practical projects.',
      isVerified: true,
      isDemo: true,
      skillsTeaching: ramTeach,
      skillsLearning: ramLearn
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  console.log('[Database] Seeded/reset canonical demo student Ram');
}

/**
 * Permanently deletes a student account, associated photos, pending connection requests,
 * and clears all active login sessions in connect-mongo.
 * Protects demo accounts (isDemo: true) by throwing 403 Forbidden.
 */
export async function deleteUserAccount(userId) {
  if (!userId) {
    const err = new Error('User ID is required.');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('Student account not found.');
    err.status = 404;
    throw err;
  }

  if (user.isDemo || user.is_demo) {
    const err = new Error('The demo student profile is protected and cannot be deleted to preserve the campus walkthrough.');
    err.status = 403;
    throw err;
  }

  const normalizedUserId = String(userId);

  // 1. Delete custom user photo if exists
  try {
    await deleteUserPhoto(normalizedUserId);
  } catch (photoErr) {
    console.warn('[db] Error deleting user photo:', photoErr.message);
  }

  // 2. Remove pending connection requests sent by or sent to this user
  try {
    await Connection.deleteMany({
      $or: [{ sender: normalizedUserId }, { recipient: normalizedUserId }],
      status: 'pending'
    });
  } catch (connErr) {
    console.warn('[db] Error clearing pending connections for user:', connErr.message);
  }

  // 3. Clear all active sessions for this user from login_sessions collection
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const loginSessionsCol = mongoose.connection.collection('login_sessions');
      await loginSessionsCol.deleteMany({
        $or: [
          { 'session.userId': normalizedUserId },
          { session: { $regex: `"userId":"${normalizedUserId}"` } }
        ]
      });
    }
  } catch (sessErr) {
    console.warn('[db] Error deleting login sessions for user:', sessErr.message);
  }

  // 4. Disconnect all active Socket.IO connections for this user
  try {
    disconnectUserSockets(normalizedUserId);
  } catch (sockErr) {
    console.warn('[db] Error disconnecting user sockets:', sockErr.message);
  }

  // 5. Permanently delete user document from MongoDB
  await User.findByIdAndDelete(normalizedUserId);

  console.log(`[Database] Permanently deleted student account ${normalizedUserId} (${user.email})`);
  return { success: true, deletedUserId: normalizedUserId };
}
