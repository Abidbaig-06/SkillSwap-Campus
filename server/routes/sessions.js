import { Router } from 'express';
import { Session } from '../models/Session.js';
import { SessionNote } from '../models/SessionNote.js';
import { Connection } from '../models/Connection.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';
import {
  notifySessionProposed,
  notifySessionConfirmed,
  notifySessionDeclined,
  notifySessionCancelled,
  notifySessionRescheduled,
  notifySessionCompleted,
  notifySessionNoteAdded,
  notifySessionNoteUpdated,
  notifySessionNoteDeleted
} from '../socket.js';

const router = Router();

// Middleware: ensure authenticated and user exists in MongoDB
async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      req.session.destroy(() => {
        res.clearCookie('skillswap_sid', { path: '/' });
        return res.status(401).json({ error: 'User session expired or account deleted.' });
      });
      return;
    }

    next();
  } catch (err) {
    console.error('[Sessions Auth Middleware] Error:', err);
    return res.status(500).json({ error: 'Authentication verification failed.' });
  }
}

router.use(requireAuth);

/**
 * Validates safe HTTP/HTTPS URL
 */
function isValidSafeUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks for overlapping confirmed bookings for a student
 * [sA, eA] overlaps with [sB, eB] if sA < eB && eA > sB
 */
async function checkBookingConflict(studentId, startTime, endTime, excludeSessionId = null) {
  const query = {
    $or: [{ teacher: studentId }, { learner: studentId }],
    status: 'confirmed',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }
  const conflict = await Session.findOne(query).lean();
  return conflict;
}

/**
 * Cleanly format Session document for client with populated user details
 */
export function formatSession(session, currentUserId, usersMap) {
  const teacherUser = usersMap.get(session.teacher) || {
    name: 'Deleted student',
    department: 'Former student',
    year: '',
    avatar: './avatars/default_avatar.svg',
    isDeleted: true
  };

  const learnerUser = usersMap.get(session.learner) || {
    name: 'Deleted student',
    department: 'Former student',
    year: '',
    avatar: './avatars/default_avatar.svg',
    isDeleted: true
  };

  const isTeacher = session.teacher === currentUserId;
  const isLearner = session.learner === currentUserId;
  const partnerId = isTeacher ? session.learner : session.teacher;
  const partner = isTeacher ? learnerUser : teacherUser;
  const myRole = isTeacher ? 'teacher' : (isLearner ? 'learner' : 'observer');

  const completedByList = Array.isArray(session.completedBy) ? session.completedBy : [];
  const hasConfirmedCompletion = completedByList.includes(currentUserId);
  const partnerConfirmedCompletion = completedByList.includes(partnerId);

  return {
    id: session._id.toString(),
    _id: session._id.toString(),
    connectionId: session.connectionId?.toString(),
    conversationId: session.conversationId?.toString(),
    title: session.title,
    skillName: session.skillName,
    teacher: {
      id: session.teacher,
      name: teacherUser.name,
      department: teacherUser.department || 'Former student',
      year: teacherUser.year || '',
      avatar: teacherUser.avatar || './avatars/default_avatar.svg',
      isDeleted: !usersMap.has(session.teacher) || Boolean(teacherUser.isDeleted)
    },
    learner: {
      id: session.learner,
      name: learnerUser.name,
      department: learnerUser.department || 'Former student',
      year: learnerUser.year || '',
      avatar: learnerUser.avatar || './avatars/default_avatar.svg',
      isDeleted: !usersMap.has(session.learner) || Boolean(learnerUser.isDeleted)
    },
    partner: {
      id: partnerId,
      name: partner.name,
      department: partner.department || 'Former student',
      year: partner.year || '',
      avatar: partner.avatar || './avatars/default_avatar.svg',
      isDeleted: !usersMap.has(partnerId) || Boolean(partner.isDeleted)
    },
    myRole,
    learningObjectives: session.learningObjectives || '',
    startTime: session.startTime,
    endTime: session.endTime,
    durationMinutes: session.durationMinutes,
    timezone: session.timezone || 'UTC',
    status: session.status,
    proposedBy: session.proposedBy,
    isMyProposal: session.proposedBy === currentUserId,
    rescheduleProposal: session.rescheduleProposal?.startTime ? {
      startTime: session.rescheduleProposal.startTime,
      endTime: session.rescheduleProposal.endTime,
      durationMinutes: session.rescheduleProposal.durationMinutes,
      proposedBy: session.rescheduleProposal.proposedBy,
      isMyReschedule: session.rescheduleProposal.proposedBy === currentUserId,
      reason: session.rescheduleProposal.reason || '',
      createdAt: session.rescheduleProposal.createdAt
    } : null,
    cancellationReason: session.cancellationReason || '',
    cancelledBy: session.cancelledBy || null,
    completedBy: completedByList,
    hasConfirmedCompletion,
    partnerConfirmedCompletion,
    bothCompleted: session.status === 'completed',
    completedAt: session.completedAt || null,
    version: session.version || 1,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

/**
 * GET /api/sessions
 * List all sessions for the authenticated student (upcoming, pending, completed, cancelled)
 */
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { status, connectionId } = req.query;

    const query = {
      $or: [{ teacher: currentUserId }, { learner: currentUserId }]
    };

    if (connectionId) {
      query.connectionId = connectionId;
    }

    if (status) {
      if (status === 'upcoming') {
        query.status = 'confirmed';
        query.endTime = { $gte: new Date() };
      } else if (status === 'pending') {
        query.status = 'proposed';
      } else if (status === 'completed') {
        query.status = 'completed';
      } else if (status === 'cancelled') {
        query.status = { $in: ['cancelled', 'declined'] };
      } else {
        query.status = status;
      }
    }

    const rawSessions = await Session.find(query)
      .sort({ startTime: 1 })
      .lean();

    const userIds = new Set();
    rawSessions.forEach((s) => {
      userIds.add(s.teacher);
      userIds.add(s.learner);
    });

    const users = await User.find(
      { _id: { $in: Array.from(userIds) } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formattedSessions = rawSessions.map((s) =>
      formatSession(s, currentUserId, usersMap)
    );

    return res.json({ sessions: formattedSessions });
  } catch (err) {
    console.error('[Sessions Router] GET / error:', err);
    return res.status(500).json({ error: 'Failed to retrieve learning sessions.' });
  }
});

/**
 * GET /api/sessions/:id
 * Retrieve a single session with complete details
 */
router.get('/:id', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const session = await Session.findById(req.params.id).lean();

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: you are not a participant in this session.' });
    }

    const users = await User.find(
      { _id: { $in: [session.teacher, session.learner] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    return res.json({ session: formatSession(session, currentUserId, usersMap) });
  } catch (err) {
    console.error('[Sessions Router] GET /:id error:', err);
    return res.status(500).json({ error: 'Failed to retrieve session details.' });
  }
});

/**
 * POST /api/sessions
 * Propose a new peer learning session
 */
router.post('/', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const {
      connectionId,
      title,
      skillName,
      teacherId: rawTeacherId,
      learnerId: rawLearnerId,
      teacher,
      learner,
      startTime,
      durationMinutes = 60,
      learningObjectives,
      timezone = 'UTC',
      clientRequestId
    } = req.body;

    const teacherId = (rawTeacherId || teacher)?.toString();
    const learnerId = (rawLearnerId || learner)?.toString();

    // Validate inputs
    const cleanTitle = (title || '').trim();
    if (!cleanTitle || cleanTitle.length < 2) {
      return res.status(400).json({ error: 'Please enter a session title (minimum 2 characters).' });
    }

    const cleanSkill = (skillName || '').trim();
    if (!cleanSkill) {
      return res.status(400).json({ error: 'Skill name is required.' });
    }

    if (!connectionId) {
      return res.status(400).json({ error: 'Connection ID is required.' });
    }

    const connection = await Connection.findById(connectionId).lean();
    if (!connection) {
      return res.status(404).json({ error: 'Accepted connection not found.' });
    }

    if (connection.status !== 'accepted') {
      return res.status(400).json({ error: 'Sessions can only be scheduled for accepted connections.' });
    }

    // Verify participants belong to this connection
    const connParticipants = [connection.sender, connection.recipient];
    if (!connParticipants.includes(teacherId) || !connParticipants.includes(learnerId)) {
      return res.status(400).json({ error: 'Teacher and learner must both be participants of this connection.' });
    }

    if (teacherId === learnerId) {
      return res.status(400).json({ error: 'Teacher and learner cannot be the same person.' });
    }

    if (currentUserId !== teacherId && currentUserId !== learnerId) {
      return res.status(403).json({ error: 'You must be either the teacher or learner in this session.' });
    }

    // Validate start time
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Please provide a valid start date and time.' });
    }

    if (start.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Session start time must be in the future.' });
    }

    // Validate duration
    const parsedDuration = parseInt(durationMinutes, 10);
    if (isNaN(parsedDuration) || parsedDuration < 15 || parsedDuration > 360) {
      return res.status(400).json({ error: 'Duration must be between 15 and 360 minutes.' });
    }

    const end = new Date(start.getTime() + parsedDuration * 60000);

    // Idempotency: check if already proposed with this clientRequestId
    if (clientRequestId) {
      const existingReq = await Session.findOne({ connectionId, clientRequestId }).lean();
      if (existingReq) {
        const users = await User.find(
          { _id: { $in: [existingReq.teacher, existingReq.learner] } },
          { name: 1, department: 1, year: 1, avatar: 1 }
        ).lean();
        const usersMap = new Map();
        users.forEach((u) => usersMap.set(u._id.toString(), u));
        return res.status(200).json({ session: formatSession(existingReq, currentUserId, usersMap) });
      }
    }

    // Check conflict against existing confirmed bookings for either participant
    const teacherConflict = await checkBookingConflict(teacherId, start, end);
    if (teacherConflict) {
      return res.status(409).json({
        error: `Teacher already has a confirmed session booked during this time interval.`
      });
    }

    const learnerConflict = await checkBookingConflict(learnerId, start, end);
    if (learnerConflict) {
      return res.status(409).json({
        error: `Learner already has a confirmed session booked during this time interval.`
      });
    }

    // Find linked conversation if exists
    const conversation = await Conversation.findOne({
      participants: { $all: connParticipants }
    }).lean();

    const newSession = await Session.create({
      connectionId: connection._id,
      conversationId: conversation?._id || null,
      title: cleanTitle,
      skillName: cleanSkill,
      teacher: teacherId,
      learner: learnerId,
      learningObjectives: (learningObjectives || '').trim(),
      startTime: start,
      durationMinutes: parsedDuration,
      endTime: end,
      timezone: timezone || 'UTC',
      status: 'proposed',
      proposedBy: currentUserId,
      clientRequestId: clientRequestId || null,
      version: 1
    });

    const users = await User.find(
      { _id: { $in: [teacherId, learnerId] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formatted = formatSession(newSession, currentUserId, usersMap);
    const partnerId = currentUserId === teacherId ? learnerId : teacherId;
    const formattedForPartner = formatSession(newSession, partnerId, usersMap);

    // Notify partner in real time
    notifySessionProposed(partnerId, formattedForPartner);

    return res.status(201).json({ session: formatted });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A session request with this identifier is already in progress.' });
    }
    console.error('[Sessions Router] POST / error:', err);
    return res.status(500).json({ error: 'Failed to propose session.' });
  }
});

/**
 * PATCH /api/sessions/:id/accept
 * Partner accepts proposed session. Strict validation: sender cannot accept own proposal.
 */
router.patch('/:id/accept', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;
    const expectedVersion = req.body?.version;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: you are not a participant in this session.' });
    }

    if (session.proposedBy === currentUserId) {
      return res.status(403).json({ error: 'You cannot accept your own proposed session. Awaiting partner response.' });
    }

    if (session.status !== 'proposed') {
      return res.status(400).json({ error: `Cannot accept session with status "${session.status}".` });
    }

    // Check conflict again at time of acceptance
    const teacherConflict = await checkBookingConflict(session.teacher, session.startTime, session.endTime, session._id);
    if (teacherConflict) {
      return res.status(409).json({ error: 'Cannot accept: Teacher has a conflicting confirmed session at this time.' });
    }

    const learnerConflict = await checkBookingConflict(session.learner, session.startTime, session.endTime, session._id);
    if (learnerConflict) {
      return res.status(409).json({ error: 'Cannot accept: Learner has a conflicting confirmed session at this time.' });
    }

    // Atomic update with version check to prevent concurrent race conditions
    const query = {
      _id: sessionId,
      status: 'proposed',
      proposedBy: { $ne: currentUserId }
    };
    if (expectedVersion !== undefined && expectedVersion !== null) {
      query.version = expectedVersion;
    }

    const updatedSession = await Session.findOneAndUpdate(
      query,
      { status: 'confirmed', $inc: { version: 1 } },
      { new: true, returnDocument: 'after' }
    );

    if (!updatedSession) {
      return res.status(409).json({ error: 'Session state has changed or version is stale. Please refresh.' });
    }

    const users = await User.find(
      { _id: { $in: [updatedSession.teacher, updatedSession.learner] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formatted = formatSession(updatedSession, currentUserId, usersMap);
    const partnerId = currentUserId === updatedSession.teacher ? updatedSession.learner : updatedSession.teacher;
    const formattedForPartner = formatSession(updatedSession, partnerId, usersMap);

    notifySessionConfirmed(partnerId, formattedForPartner);

    return res.json({ session: formatted });
  } catch (err) {
    console.error('[Sessions Router] PATCH /:id/accept error:', err);
    return res.status(500).json({ error: 'Failed to accept session.' });
  }
});

/**
 * PATCH /api/sessions/:id/decline
 * Partner declines proposed session
 */
router.patch('/:id/decline', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: not a participant.' });
    }

    if (session.proposedBy === currentUserId) {
      return res.status(403).json({ error: 'You cannot decline your own proposed session; use cancel instead.' });
    }

    if (session.status !== 'proposed') {
      return res.status(400).json({ error: `Cannot decline session with status "${session.status}".` });
    }

    const expectedVersion = req.body?.version;
    const query = {
      _id: sessionId,
      status: 'proposed',
      proposedBy: { $ne: currentUserId }
    };
    if (expectedVersion !== undefined && expectedVersion !== null) {
      query.version = expectedVersion;
    }

    const updatedSession = await Session.findOneAndUpdate(
      query,
      { status: 'declined', $inc: { version: 1 } },
      { new: true, returnDocument: 'after' }
    );

    if (!updatedSession) {
      return res.status(409).json({ error: 'Session state has changed. Please refresh.' });
    }

    const users = await User.find(
      { _id: { $in: [updatedSession.teacher, updatedSession.learner] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formatted = formatSession(updatedSession, currentUserId, usersMap);
    const partnerId = currentUserId === updatedSession.teacher ? updatedSession.learner : updatedSession.teacher;
    const formattedForPartner = formatSession(updatedSession, partnerId, usersMap);

    notifySessionDeclined(partnerId, formattedForPartner);

    return res.json({ session: formatted });
  } catch (err) {
    console.error('[Sessions Router] PATCH /:id/decline error:', err);
    return res.status(500).json({ error: 'Failed to decline session.' });
  }
});

/**
 * PATCH /api/sessions/:id/cancel
 * Either participant can cancel proposed or confirmed session
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;
    const { reason, version } = req.body || {};

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: not a participant.' });
    }

    if (session.status !== 'proposed' && session.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot cancel session with status "${session.status}".` });
    }

    const query = {
      _id: sessionId,
      status: { $in: ['proposed', 'confirmed'] }
    };
    if (version !== undefined && version !== null) {
      query.version = version;
    }

    const updatedSession = await Session.findOneAndUpdate(
      query,
      {
        status: 'cancelled',
        cancelledBy: currentUserId,
        cancellationReason: (reason || '').trim(),
        $inc: { version: 1 }
      },
      { new: true, returnDocument: 'after' }
    );

    if (!updatedSession) {
      return res.status(409).json({ error: 'Session state has changed or version is stale.' });
    }

    const users = await User.find(
      { _id: { $in: [updatedSession.teacher, updatedSession.learner] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formatted = formatSession(updatedSession, currentUserId, usersMap);
    const partnerId = currentUserId === updatedSession.teacher ? updatedSession.learner : updatedSession.teacher;
    const formattedForPartner = formatSession(updatedSession, partnerId, usersMap);

    notifySessionCancelled(partnerId, formattedForPartner);

    return res.json({ session: formatted });
  } catch (err) {
    console.error('[Sessions Router] PATCH /:id/cancel error:', err);
    return res.status(500).json({ error: 'Failed to cancel session.' });
  }
});

/**
 * POST /api/sessions/:id/reschedule
 * Propose rescheduling a session. Keeps current confirmed time until partner accepts.
 */
router.post('/:id/reschedule', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;
    const { startTime, durationMinutes, reason, version } = req.body || {};

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: not a participant.' });
    }

    if (session.status !== 'confirmed' && session.status !== 'proposed') {
      return res.status(400).json({ error: `Cannot reschedule session with status "${session.status}".` });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Please provide a valid new start date and time.' });
    }

    if (start.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'New start time must be in the future.' });
    }

    const parsedDuration = parseInt(durationMinutes || session.durationMinutes, 10);
    if (isNaN(parsedDuration) || parsedDuration < 15 || parsedDuration > 360) {
      return res.status(400).json({ error: 'Duration must be between 15 and 360 minutes.' });
    }

    const end = new Date(start.getTime() + parsedDuration * 60000);

    // Check potential conflicts for new proposal
    const teacherConflict = await checkBookingConflict(session.teacher, start, end, session._id);
    if (teacherConflict) {
      return res.status(409).json({ error: 'Teacher has a confirmed conflicting booking at the proposed new time.' });
    }

    const learnerConflict = await checkBookingConflict(session.learner, start, end, session._id);
    if (learnerConflict) {
      return res.status(409).json({ error: 'Learner has a confirmed conflicting booking at the proposed new time.' });
    }

    const query = { _id: sessionId };
    if (version) query.version = version;

    const updatedSession = await Session.findOneAndUpdate(
      query,
      {
        rescheduleProposal: {
          startTime: start,
          endTime: end,
          durationMinutes: parsedDuration,
          proposedBy: currentUserId,
          reason: (reason || '').trim(),
          createdAt: new Date()
        },
        $inc: { version: 1 }
      },
      { returnDocument: 'after' }
    );

    if (!updatedSession) {
      return res.status(409).json({ error: 'Version conflict or session modified by partner. Please refresh.' });
    }

    const users = await User.find(
      { _id: { $in: [updatedSession.teacher, updatedSession.learner] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formatted = formatSession(updatedSession, currentUserId, usersMap);
    const partnerId = currentUserId === updatedSession.teacher ? updatedSession.learner : updatedSession.teacher;
    const formattedForPartner = formatSession(updatedSession, partnerId, usersMap);

    notifySessionRescheduled(partnerId, formattedForPartner);

    return res.json({ session: formatted });
  } catch (err) {
    console.error('[Sessions Router] POST /:id/reschedule error:', err);
    return res.status(500).json({ error: 'Failed to propose reschedule.' });
  }
});

/**
 * PATCH /api/sessions/:id/reschedule/accept
 * Partner accepts reschedule proposal; new time becomes active
 */
router.patch('/:id/reschedule/accept', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session || !session.rescheduleProposal?.startTime) {
      return res.status(404).json({ error: 'No active reschedule proposal found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: not a participant.' });
    }

    if (session.rescheduleProposal.proposedBy === currentUserId) {
      return res.status(403).json({ error: 'You cannot accept your own reschedule proposal.' });
    }

    const newStart = session.rescheduleProposal.startTime;
    const newEnd = session.rescheduleProposal.endTime;
    const newDuration = session.rescheduleProposal.durationMinutes;

    // Check conflicts at acceptance time
    const teacherConflict = await checkBookingConflict(session.teacher, newStart, newEnd, session._id);
    if (teacherConflict) {
      return res.status(409).json({ error: 'Cannot accept: Teacher has a conflicting confirmed session at this time.' });
    }

    const learnerConflict = await checkBookingConflict(session.learner, newStart, newEnd, session._id);
    if (learnerConflict) {
      return res.status(409).json({ error: 'Cannot accept: Learner has a conflicting confirmed session at this time.' });
    }

    const updatedSession = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        'rescheduleProposal.proposedBy': { $ne: currentUserId }
      },
      {
        startTime: newStart,
        endTime: newEnd,
        durationMinutes: newDuration,
        status: 'confirmed',
        rescheduleProposal: null,
        $inc: { version: 1 }
      },
      { new: true, returnDocument: 'after' }
    );

    if (!updatedSession) {
      return res.status(409).json({ error: 'Session state changed or proposal cleared.' });
    }

    const users = await User.find(
      { _id: { $in: [updatedSession.teacher, updatedSession.learner] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formatted = formatSession(updatedSession, currentUserId, usersMap);
    const partnerId = currentUserId === updatedSession.teacher ? updatedSession.learner : updatedSession.teacher;
    const formattedForPartner = formatSession(updatedSession, partnerId, usersMap);

    notifySessionConfirmed(partnerId, formattedForPartner);

    return res.json({ session: formatted });
  } catch (err) {
    console.error('[Sessions Router] PATCH /:id/reschedule/accept error:', err);
    return res.status(500).json({ error: 'Failed to accept reschedule proposal.' });
  }
});

/**
 * PATCH /api/sessions/:id/reschedule/decline
 * Partner declines reschedule proposal; previous confirmed time is preserved
 */
router.patch('/:id/reschedule/decline', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session || !session.rescheduleProposal?.startTime) {
      return res.status(404).json({ error: 'No active reschedule proposal found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: not a participant.' });
    }

    if (session.rescheduleProposal.proposedBy === currentUserId) {
      return res.status(403).json({ error: 'You cannot decline your own reschedule proposal; use cancel instead.' });
    }

    const updatedSession = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        'rescheduleProposal.proposedBy': { $ne: currentUserId }
      },
      {
        rescheduleProposal: null,
        $inc: { version: 1 }
      },
      { new: true, returnDocument: 'after' }
    );

    if (!updatedSession) {
      return res.status(409).json({ error: 'Session state changed.' });
    }

    const users = await User.find(
      { _id: { $in: [updatedSession.teacher, updatedSession.learner] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formatted = formatSession(updatedSession, currentUserId, usersMap);
    const partnerId = currentUserId === updatedSession.teacher ? updatedSession.learner : updatedSession.teacher;
    const formattedForPartner = formatSession(updatedSession, partnerId, usersMap);

    notifySessionConfirmed(partnerId, formattedForPartner);

    return res.json({ session: formatted });
  } catch (err) {
    console.error('[Sessions Router] PATCH /:id/reschedule/decline error:', err);
    return res.status(500).json({ error: 'Failed to decline reschedule proposal.' });
  }
});

/**
 * POST /api/sessions/:id/complete
 * Confirm lesson occurred. Completed only when both participants confirm.
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: not a participant.' });
    }

    if (session.status !== 'confirmed' && session.status !== 'completed') {
      return res.status(400).json({ error: `Cannot complete a session with status "${session.status}".` });
    }

    // Completion allowed once session start time has arrived
    if (Date.now() < new Date(session.startTime).getTime()) {
      return res.status(400).json({
        error: 'Lesson can only be confirmed complete once its scheduled time has arrived.'
      });
    }

    // Add current user to completedBy atomically
    const partnerId = currentUserId === session.teacher ? session.learner : session.teacher;
    const isPartnerAlreadyConfirmed = (session.completedBy || []).includes(partnerId);

    const updateOps = {
      $addToSet: { completedBy: currentUserId }
    };

    if (isPartnerAlreadyConfirmed) {
      updateOps.$set = {
        status: 'completed',
        completedAt: new Date()
      };
      updateOps.$inc = { version: 1 };
    }

    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      updateOps,
      { new: true, returnDocument: 'after' }
    );

    const users = await User.find(
      { _id: { $in: [updatedSession.teacher, updatedSession.learner] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formatted = formatSession(updatedSession, currentUserId, usersMap);
    const formattedForPartner = formatSession(updatedSession, partnerId, usersMap);

    notifySessionCompleted(partnerId, formattedForPartner);

    return res.json({ session: formatted });
  } catch (err) {
    console.error('[Sessions Router] POST /:id/complete error:', err);
    return res.status(500).json({ error: 'Failed to record session completion.' });
  }
});

/**
 * GET /api/sessions/:id/notes
 * Retrieve all notes for a session (participants only)
 */
router.get('/:id/notes', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: not a participant.' });
    }

    const notes = await SessionNote.find({ sessionId }).sort({ createdAt: 1 }).lean();

    const formattedNotes = notes.map((n) => ({
      id: n._id.toString(),
      _id: n._id.toString(),
      sessionId: n.sessionId.toString(),
      authorId: n.authorId,
      authorName: n.authorName,
      authorAvatar: n.authorAvatar,
      isMyNote: n.authorId === currentUserId,
      text: n.text,
      resources: n.resources || [],
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    }));

    return res.json({ notes: formattedNotes });
  } catch (err) {
    console.error('[Sessions Router] GET /:id/notes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve session notes.' });
  }
});

/**
 * POST /api/sessions/:id/notes
 * Post a note with optional resource links (participants only)
 */
router.post('/:id/notes', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const sessionId = req.params.id;
    const { text, resources } = req.body || {};

    const cleanText = (text || '').trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'Note text cannot be empty.' });
    }

    const session = await Session.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher !== currentUserId && session.learner !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: not a participant.' });
    }

    // Validate resource URLs safely
    const cleanResources = [];
    if (Array.isArray(resources)) {
      for (const r of resources) {
        const urlStr = (r.url || '').trim();
        if (urlStr) {
          if (!isValidSafeUrl(urlStr)) {
            return res.status(400).json({
              error: `Invalid resource URL: "${urlStr}". Must be a valid http:// or https:// web link.`
            });
          }
          cleanResources.push({
            title: (r.title || '').trim(),
            url: urlStr
          });
        }
      }
    }

    const currentUser = await User.findById(currentUserId).lean();

    const newNote = await SessionNote.create({
      sessionId,
      authorId: currentUserId,
      authorName: currentUser?.name || 'Peer',
      authorAvatar: currentUser?.avatar || './avatars/default_avatar.svg',
      text: cleanText,
      resources: cleanResources
    });

    const formatted = {
      id: newNote._id.toString(),
      _id: newNote._id.toString(),
      sessionId: newNote.sessionId.toString(),
      authorId: newNote.authorId,
      authorName: newNote.authorName,
      authorAvatar: newNote.authorAvatar,
      isMyNote: true,
      text: newNote.text,
      resources: newNote.resources || [],
      createdAt: newNote.createdAt,
      updatedAt: newNote.updatedAt
    };

    const partnerId = currentUserId === session.teacher ? session.learner : session.teacher;
    notifySessionNoteAdded(partnerId, { sessionId, note: { ...formatted, isMyNote: false } });

    return res.status(201).json({ note: formatted });
  } catch (err) {
    console.error('[Sessions Router] POST /:id/notes error:', err);
    return res.status(500).json({ error: 'Failed to create session note.' });
  }
});

/**
 * PATCH /api/sessions/:id/notes/:noteId
 * Edit a note (author only)
 */
router.patch('/:id/notes/:noteId', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { id: sessionId, noteId } = req.params;
    const { text, resources } = req.body || {};

    const note = await SessionNote.findById(noteId);
    if (!note || note.sessionId.toString() !== sessionId) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    if (note.authorId !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: only the note author can edit this note.' });
    }

    if (text !== undefined) {
      const cleanText = text.trim();
      if (!cleanText) {
        return res.status(400).json({ error: 'Note text cannot be empty.' });
      }
      note.text = cleanText;
    }

    if (Array.isArray(resources)) {
      const cleanResources = [];
      for (const r of resources) {
        const urlStr = (r.url || '').trim();
        if (urlStr) {
          if (!isValidSafeUrl(urlStr)) {
            return res.status(400).json({
              error: `Invalid resource URL: "${urlStr}". Must be a valid http:// or https:// web link.`
            });
          }
          cleanResources.push({
            title: (r.title || '').trim(),
            url: urlStr
          });
        }
      }
      note.resources = cleanResources;
    }

    await note.save();

    const formatted = {
      id: note._id.toString(),
      _id: note._id.toString(),
      sessionId: note.sessionId.toString(),
      authorId: note.authorId,
      authorName: note.authorName,
      authorAvatar: note.authorAvatar,
      isMyNote: true,
      text: note.text,
      resources: note.resources || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };

    const session = await Session.findById(sessionId).lean();
    if (session) {
      const partnerId = currentUserId === session.teacher ? session.learner : session.teacher;
      notifySessionNoteUpdated(partnerId, { sessionId, note: { ...formatted, isMyNote: false } });
    }

    return res.json({ note: formatted });
  } catch (err) {
    console.error('[Sessions Router] PATCH note error:', err);
    return res.status(500).json({ error: 'Failed to update note.' });
  }
});

/**
 * DELETE /api/sessions/:id/notes/:noteId
 * Delete a note (author only)
 */
router.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { id: sessionId, noteId } = req.params;

    const note = await SessionNote.findById(noteId);
    if (!note || note.sessionId.toString() !== sessionId) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    if (note.authorId !== currentUserId) {
      return res.status(403).json({ error: 'Access denied: only the note author can delete this note.' });
    }

    await SessionNote.findByIdAndDelete(noteId);

    const session = await Session.findById(sessionId).lean();
    if (session) {
      const partnerId = currentUserId === session.teacher ? session.learner : session.teacher;
      notifySessionNoteDeleted(partnerId, { sessionId, noteId });
    }

    return res.json({ success: true, noteId });
  } catch (err) {
    console.error('[Sessions Router] DELETE note error:', err);
    return res.status(500).json({ error: 'Failed to delete note.' });
  }
});

export default router;

