import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  getUserByEmail,
  getUserById,
  getUserSkills,
  createUser,
  formatUserProfile,
  resetDemoStudent
} from '../db.js';
import { saveUserPhoto } from '../services/photoService.js';
import { validateAndParsePhoto } from '../utils/photoValidator.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/signup
 * Create new student account, profile, teaching skills, and learning goals
 */
router.post('/signup', async (req, res) => {
  try {
    const {
      fullName,
      name,
      email,
      password,
      department,
      year,
      avatar,
      photoData,
      bio,
      skillsTeach,
      skillsLearn,
      skillsTeaching,
      skillsLearning,
      teachingSkills,
      learningSkills
    } = req.body;

    const studentName = (fullName || name || '').trim();
    if (!studentName || studentName.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (minimum 2 characters).' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Please enter your college email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email format (e.g. name@campus.edu).' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate email
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in instead.' });
    }

    // Validate photoData upfront if provided
    const rawPhotoData = photoData || (typeof avatar === 'string' && avatar.startsWith('data:image/') ? avatar : null);
    if (rawPhotoData) {
      // Will throw with specific status/message if format, magic bytes, or size are invalid
      validateAndParsePhoto(rawPhotoData);
    }

    // Unify skills arrays from signup wizard and API requests
    const teachingList = Array.isArray(skillsTeaching) && skillsTeaching.length > 0
      ? skillsTeaching
      : (Array.isArray(teachingSkills) && teachingSkills.length > 0
        ? teachingSkills
        : (Array.isArray(skillsTeach) ? skillsTeach : []));

    const learningList = Array.isArray(skillsLearning) && skillsLearning.length > 0
      ? skillsLearning
      : (Array.isArray(learningSkills) && learningSkills.length > 0
        ? learningSkills
        : (Array.isArray(skillsLearn) ? skillsLearn : []));

    // Hash password securely
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Initial avatar reference
    const initialAvatar = rawPhotoData ? './avatars/default_avatar.svg' : (avatar || './avatars/default_avatar.svg');

    // Save account & profile in MongoDB
    const { user, skills } = await createUser({
      email: normalizedEmail,
      passwordHash,
      name: studentName,
      department: (department || 'Computer Science & Engineering').trim(),
      year: (year || '1st Year').trim(),
      avatar: initialAvatar,
      bio: (bio || '').trim(),
      isVerified: false,
      isDemo: false,
      skillsTeaching: teachingList,
      skillsLearning: learningList
    });

    // If photo data was provided, persist to dedicated photos collection and update user avatar URL
    if (rawPhotoData) {
      try {
        const { photoUrl } = await saveUserPhoto(user._id, rawPhotoData);
        user.avatar = photoUrl;
        await user.save();
      } catch (photoErr) {
        console.error('[Auth] Failed to persist signup photo:', photoErr);
        // User is still created with default silhouette fallback
      }
    }

    // Establish authenticated session
    req.session.userId = user.id || user._id;
    const shouldRemember = Boolean(req.body.rememberMe === true || req.body.rememberMe === 'true');
    if (shouldRemember) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days persistent
    } else {
      req.session.cookie.maxAge = null;
      req.session.cookie.expires = false; // Session cookie only
    }
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('[Auth] Session save error on signup:', saveErr);
        return res.status(500).json({ error: 'Failed to establish session after registration.' });
      }

      const profile = formatUserProfile(user, skills);
      return res.status(201).json({ user: profile });
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during signup.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate student with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash || user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Regenerate session to prevent fixation
    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error('[Auth] Session regenerate error:', regenErr);
        return res.status(500).json({ error: 'Failed to initialize session.' });
      }

      const uid = user.id || user._id;
      req.session.userId = uid;

      const shouldRemember = Boolean(rememberMe === true || rememberMe === 'true');
      if (shouldRemember) {
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days persistent cookie
      } else {
        req.session.cookie.maxAge = null;
        req.session.cookie.expires = false; // Browser session only (clears when browser closes)
      }

      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error('[Auth] Session save error on login:', saveErr);
          return res.status(500).json({ error: 'Failed to save session.' });
        }

        if (user.isDemo || user.is_demo) {
          await resetDemoStudent();
        }

        const currentUserObj = await getUserById(uid);
        const skills = await getUserSkills(uid);
        const profile = formatUserProfile(currentUserObj, skills);
        return res.json({ user: profile });
      });
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
});

/**
 * GET /api/auth/me
 * Restore authenticated session and return current student profile
 */
router.get('/me', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated', user: null });
    }

    const user = await getUserById(userId);
    if (!user) {
      req.session.destroy(() => {
        res.clearCookie('skillswap_sid', { path: '/' });
        return res.status(401).json({ error: 'User session expired or user deleted', user: null });
      });
      return;
    }

    const skills = await getUserSkills(user._id || user.id);
    const profile = formatUserProfile(user, skills);
    return res.json({ user: profile });
  } catch (err) {
    console.error('[Auth] Session me error:', err);
    return res.status(500).json({ error: 'Failed to verify session status.' });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate server session and clear session cookie
 */
router.post('/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('[Auth] Logout error:', err);
        return res.status(500).json({ error: 'Failed to log out.' });
      }
      res.clearCookie('skillswap_sid', { path: '/' });
      return res.json({ message: 'Logged out successfully.' });
    });
  } catch (err) {
    console.error('[Auth] Logout catch error:', err);
    return res.status(500).json({ error: 'Failed to process logout.' });
  }
});

export default router;
