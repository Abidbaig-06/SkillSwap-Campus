import { Router } from 'express';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { formatSession } from './sessions.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

/**
 * GET /api/stats/campus
 * Truthful counts calculated strictly from MongoDB records.
 */
router.get('/campus', async (req, res) => {
  try {
    const [realStudentsCount, demoStudentsCount, distinctDepartments, usersWithSkills] = await Promise.all([
      User.countDocuments({ isDemo: false }),
      User.countDocuments({ isDemo: true }),
      User.distinct('department'),
      User.find({}, { skillsTeaching: 1 })
    ]);

    // Calculate unique teaching skills
    const uniqueSkills = new Set();
    for (const u of usersWithSkills) {
      for (const st of u.skillsTeaching || []) {
        if (st.name) uniqueSkills.add(st.name.trim().toLowerCase());
      }
    }

    const payload = {
      realStudentsCount,
      demoStudentsCount,
      totalStudentsCount: realStudentsCount + demoStudentsCount,
      skillsOfferedCount: uniqueSkills.size,
      departmentsCount: distinctDepartments.filter(Boolean).length,
      departments: distinctDepartments.filter(Boolean)
    };

    return res.json({
      stats: payload,
      ...payload
    });
  } catch (err) {
    console.error('[Stats Router] Error calculating campus stats:', err);
    return res.status(500).json({ error: 'Failed to retrieve campus statistics.' });
  }
});

/**
 * GET /api/stats/personal
 * Truthful personal statistics and upcoming confirmed sessions for authenticated user.
 */
router.get('/personal', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const [completedSessions, upcomingRawSessions, pendingCount] = await Promise.all([
      Session.find({
        status: 'completed',
        $or: [{ teacher: userId }, { learner: userId }]
      }).lean(),
      Session.find({
        status: 'confirmed',
        endTime: { $gte: new Date() },
        $or: [{ teacher: userId }, { learner: userId }]
      })
        .sort({ startTime: 1 })
        .limit(5)
        .lean(),
      Session.countDocuments({
        status: 'proposed',
        $or: [{ teacher: userId }, { learner: userId }],
        proposedBy: { $ne: userId }
      })
    ]);

    // Format upcoming sessions
    const participantIds = new Set();
    upcomingRawSessions.forEach((s) => {
      participantIds.add(s.teacher);
      participantIds.add(s.learner);
    });

    const participants = await User.find(
      { _id: { $in: Array.from(participantIds) } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    participants.forEach((p) => usersMap.set(p._id.toString(), p));

    const upcomingSessions = upcomingRawSessions.map((s) =>
      formatSession(s, userId, usersMap)
    );

    // Calculate hours from completed sessions
    let teachingMinutes = 0;
    let learningMinutes = 0;

    for (const s of completedSessions) {
      const dur = Number(s.durationMinutes) || 0;
      if (s.teacher === userId) {
        teachingMinutes += dur;
      }
      if (s.learner === userId) {
        learningMinutes += dur;
      }
    }

    const teachingHours = Math.round((teachingMinutes / 60) * 10) / 10;
    const learningHours = Math.round((learningMinutes / 60) * 10) / 10;
    const totalExchangeHours = Math.round(((teachingMinutes + learningMinutes) / 60) * 10) / 10;

    const stats = {
      skillsShared: (user.skillsTeaching || []).length,
      skillsLearning: (user.skillsLearning || []).length,
      completedSessionsCount: completedSessions.length,
      teachingHours,
      learningHours,
      totalExchangeHours,
      pendingSessionsCount: pendingCount,
      upcomingSessionsCount: upcomingSessions.length
    };

    return res.json({
      stats,
      upcomingSessions
    });
  } catch (err) {
    console.error('[Stats Router] Error calculating personal stats:', err);
    return res.status(500).json({ error: 'Failed to retrieve personal statistics.' });
  }
});

export default router;
