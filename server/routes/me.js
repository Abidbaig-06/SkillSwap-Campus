import { Router } from 'express';
import {
  getUserById,
  getUserSkills,
  formatUserProfile,
  updateUserProfile,
  addUserSkill,
  removeUserSkill,
  updateUserSkill,
  deleteUserAccount
} from '../db.js';
import { saveUserPhoto, deleteUserPhoto } from '../services/photoService.js';

const router = Router();

// Middleware ensuring user is authenticated
async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const user = await getUserById(userId);
    if (!user) {
      req.session.destroy(() => {
        res.clearCookie('skillswap_sid', { path: '/' });
        return res.status(401).json({ error: 'User session expired or user deleted.' });
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Error in requireAuth:', err);
    return res.status(500).json({ error: 'Authentication verification failed.' });
  }
}

/**
 * PUT /api/me/photo
 * Uploads, crops, and replaces current user's profile photo.
 * Stores binary in dedicated MongoDB photos collection and links relative photo URL to user.
 */
router.put('/photo', requireAuth, async (req, res) => {
  try {
    if (req.user.isDemo || req.user.is_demo) {
      return res.status(403).json({
        error: 'The demo student profile is read-only to preserve the shared campus walkthrough. Please create your own free account to customize your photo!'
      });
    }

    const { photoData } = req.body;
    if (!photoData) {
      return res.status(400).json({ error: 'Please provide photo data in base64 format.' });
    }

    const { photoUrl } = await saveUserPhoto(req.user._id || req.user.id, photoData);

    const updatedUser = await updateUserProfile(req.user._id || req.user.id, {
      avatar: photoUrl
    });

    const skills = await getUserSkills(updatedUser._id || updatedUser.id);
    const profile = formatUserProfile(updatedUser, skills);

    return res.json({
      user: profile,
      avatar: photoUrl,
      message: 'Profile photo updated successfully.'
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error('[Me Router] Update photo error:', err);
    }
    return res.status(status).json({ error: err.message || 'Failed to update profile photo.' });
  }
});

/**
 * DELETE /api/me/photo
 * Removes custom profile photo from MongoDB and resets user avatar to default silhouette.
 */
router.delete('/photo', requireAuth, async (req, res) => {
  try {
    if (req.user.isDemo || req.user.is_demo) {
      return res.status(403).json({
        error: 'The demo student profile is read-only to preserve the shared campus walkthrough. Please create your own free account to customize your photo!'
      });
    }

    await deleteUserPhoto(req.user._id || req.user.id);

    const updatedUser = await updateUserProfile(req.user._id || req.user.id, {
      avatar: './avatars/default_avatar.svg'
    });

    const skills = await getUserSkills(updatedUser._id || updatedUser.id);
    const profile = formatUserProfile(updatedUser, skills);

    return res.json({
      user: profile,
      avatar: './avatars/default_avatar.svg',
      message: 'Profile photo removed successfully.'
    });
  } catch (err) {
    console.error('[Me Router] Remove photo error:', err);
    return res.status(500).json({ error: 'Failed to remove profile photo.' });
  }
});

/**
 * PATCH /api/me/profile
 * Saves editable profile fields: name, bio, department, year, avatar.
 * Keeps email, password, verification, demo status, and user ID outside this endpoint.
 */
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    if (req.user.isDemo || req.user.is_demo) {
      return res.status(403).json({
        error: 'The demo student profile is read-only to preserve the shared campus walkthrough. Please create your own free account to customize your profile!'
      });
    }

    const { name, bio, department, year, avatar, photoData } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
      }
    }

    let finalAvatar = avatar;
    const rawPhoto = photoData || (typeof avatar === 'string' && avatar.startsWith('data:image/') ? avatar : null);

    if (rawPhoto) {
      const { photoUrl } = await saveUserPhoto(req.user._id || req.user.id, rawPhoto);
      finalAvatar = photoUrl;
    } else if (avatar === './avatars/default_avatar.svg' && req.user.avatar?.startsWith('/api/photos/')) {
      await deleteUserPhoto(req.user._id || req.user.id);
      finalAvatar = './avatars/default_avatar.svg';
    }

    const updatedUser = await updateUserProfile(req.user._id || req.user.id, {
      name,
      bio,
      department,
      year,
      avatar: finalAvatar
    });

    const skills = await getUserSkills(updatedUser._id || updatedUser.id);
    const profile = formatUserProfile(updatedUser, skills);

    return res.json({
      user: profile,
      message: 'Profile information updated successfully.'
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error('[Me Router] Update profile error:', err);
    }
    return res.status(status).json({ error: err.message || 'Failed to update profile.' });
  }
});

/**
 * POST /api/me/skills
 * Adds a new teaching skill or learning goal.
 * Rejects duplicate skill names within the same type.
 */
router.post('/skills', requireAuth, async (req, res) => {
  try {
    if (req.user.isDemo || req.user.is_demo) {
      return res.status(403).json({
        error: 'The demo student profile is read-only to preserve the shared campus walkthrough. Please create your own free account to manage skills!'
      });
    }

    const { type, name, level, category } = req.body;

    if (!type || !['teach', 'learn'].includes(type)) {
      return res.status(400).json({ error: 'Skill type must be either "teach" or "learn".' });
    }

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'Skill name cannot be empty.' });
    }

    const newSkill = await addUserSkill(req.user._id || req.user.id, {
      type,
      name: trimmedName,
      level,
      category
    });

    const updatedUser = await getUserById(req.user._id || req.user.id);
    const skills = await getUserSkills(req.user._id || req.user.id);
    const profile = formatUserProfile(updatedUser, skills);

    return res.status(201).json({
      user: profile,
      skill: newSkill,
      message: `Added "${trimmedName}" to your ${type === 'teach' ? 'teaching' : 'learning'} skills!`
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error('[Me Router] Add skill error:', err);
    }
    return res.status(status).json({ error: err.message || 'Failed to add skill.' });
  }
});

/**
 * PATCH /api/me/skills/:id
 * Updates an existing teaching skill or learning goal.
 * Validates skill ownership, name, level, category and duplicate rules.
 */
router.patch('/skills/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.isDemo || req.user.is_demo) {
      return res.status(403).json({
        error: 'The demo student profile is read-only to preserve the shared campus walkthrough. Please create your own free account to manage skills!'
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Skill ID is required.' });
    }

    const { name, level, category } = req.body;

    const updatedSkill = await updateUserSkill(req.user._id || req.user.id, id, {
      name,
      level,
      category
    });

    const updatedUser = await getUserById(req.user._id || req.user.id);
    const skills = await getUserSkills(req.user._id || req.user.id);
    const profile = formatUserProfile(updatedUser, skills);

    return res.json({
      user: profile,
      skill: updatedSkill,
      message: `Updated "${updatedSkill.name}" successfully.`
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error('[Me Router] Update skill error:', err);
    }
    return res.status(status).json({ error: err.message || 'Failed to update skill.' });
  }
});

/**
 * DELETE /api/me/skills/:id
 * Removes a student's teaching skill or learning goal.
 * Only deletes that student's record; other students' skills are preserved.
 */
router.delete('/skills/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.isDemo || req.user.is_demo) {
      return res.status(403).json({
        error: 'The demo student profile is read-only to preserve the shared campus walkthrough. Please create your own free account to manage skills!'
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Skill ID is required.' });
    }

    const removed = await removeUserSkill(req.user._id || req.user.id, id);

    const updatedUser = await getUserById(req.user._id || req.user.id);
    const skills = await getUserSkills(req.user._id || req.user.id);
    const profile = formatUserProfile(updatedUser, skills);

    return res.json({
      user: profile,
      message: `Removed "${removed.name}" successfully.`
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error('[Me Router] Remove skill error:', err);
    }
    return res.status(status).json({ error: err.message || 'Failed to remove skill.' });
  }
});

/**
 * GET /api/me/profile
 * Returns the current authenticated user's profile
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const freshUser = await getUserById(req.user._id || req.user.id);
    const skills = await getUserSkills(req.user._id || req.user.id);
    const profile = formatUserProfile(freshUser, skills);
    return res.json({ user: profile });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

/**
 * Handler for permanently deleting the current authenticated student account
 */
async function handleDeleteAccountRoute(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    if (req.user.isDemo || req.user.is_demo) {
      return res.status(403).json({
        error: 'The demo student profile is protected and cannot be deleted to preserve the shared campus walkthrough.'
      });
    }

    await deleteUserAccount(userId);

    req.session.destroy((err) => {
      if (err) {
        console.warn('[Me Router] Session destroy warning on account deletion:', err.message);
      }
      res.clearCookie('skillswap_sid', { path: '/' });
      return res.json({
        success: true,
        message: 'Your campus profile and account have been permanently deleted.'
      });
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error('[Me Router] Delete account error:', err);
    }
    return res.status(status).json({
      error: err.message || 'Failed to delete student account.'
    });
  }
}

router.delete('/account', requireAuth, handleDeleteAccountRoute);
router.delete('/', requireAuth, handleDeleteAccountRoute);

export default router;
