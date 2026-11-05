import { Router } from 'express';
import { Connection } from '../models/Connection.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import {
  notifyConnectionRequest,
  notifyConnectionAccepted,
  notifyConnectionDeclined,
  notifyConnectionCancelled
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
    console.error('[Connections Auth Middleware] Error:', err);
    return res.status(500).json({ error: 'Authentication verification failed.' });
  }
}

router.use(requireAuth);

/**
 * Format raw Connection document for frontend components (ConnectionCard, Connections page)
 */
function formatConnection(conn, currentUserId, usersMap) {
  const isSender = conn.sender === currentUserId;
  const peerId = isSender ? conn.recipient : conn.sender;
  const isPeerDeleted = !usersMap.has(peerId);
  const peer = usersMap.get(peerId) || {
    name: 'Deleted student',
    department: 'Former student',
    year: '',
    avatar: './avatars/default_avatar.svg',
    isDeleted: true
  };

  let type = 'Pending';
  let status = conn.status;

  if (conn.status === 'accepted') {
    type = 'Teaching';
    status = 'active';
  } else if (conn.status === 'pending') {
    type = isSender ? 'Outgoing' : 'Incoming';
    status = isSender ? 'pending_outgoing' : 'pending_incoming';
  } else if (conn.status === 'declined') {
    type = 'Declined';
    status = 'declined';
  } else if (conn.status === 'cancelled') {
    type = 'Cancelled';
    status = 'cancelled';
  }

  const offeredName = conn.offeredSkill?.name || 'Skill';
  const requestedName = conn.requestedSkill?.name || 'Skill';

  return {
    id: conn._id.toString(),
    _id: conn._id.toString(),
    studentId: peerId,
    name: peer.name || 'Deleted student',
    studentName: peer.name || 'Deleted student',
    department: peer.department || 'Former student',
    year: peer.year || '',
    avatar: peer.avatar || './avatars/default_avatar.svg',
    isDeleted: isPeerDeleted || Boolean(peer.isDeleted),
    sharedSkill: `${offeredName} ⇄ ${requestedName}`,
    offeredSkill: conn.offeredSkill,
    requestedSkill: conn.requestedSkill,
    type,
    status,
    rawStatus: conn.status,
    isIncoming: !isSender && conn.status === 'pending',
    isOutgoing: isSender && conn.status === 'pending',
    note: conn.proposalText || '',
    createdAt: conn.createdAt,
    updatedAt: conn.updatedAt
  };
}

/**
 * GET /api/connections
 * Returns all connections for the authenticated user (incoming and outgoing)
 */
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.session.userId;

    const rawConnections = await Connection.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Collect all unique user IDs to populate in batch
    const userIds = new Set();
    rawConnections.forEach((c) => {
      userIds.add(c.sender);
      userIds.add(c.recipient);
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }, {
      name: 1,
      department: 1,
      year: 1,
      avatar: 1
    }).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const connections = rawConnections.map((c) =>
      formatConnection(c, currentUserId, usersMap)
    );

    return res.json({ connections });
  } catch (err) {
    console.error('[Connections] GET / error:', err);
    return res.status(500).json({ error: 'Failed to retrieve campus connections.' });
  }
});

/**
 * POST /api/connections
 * Sends a swap connection request to a peer
 */
router.post('/', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { studentId, recipientId, offeredSkill, targetSkill, requestedSkill, note } = req.body;

    const targetRecipientId = recipientId || studentId;
    if (!targetRecipientId) {
      return res.status(400).json({ error: 'Recipient student ID is required.' });
    }

    if (targetRecipientId === currentUserId) {
      return res.status(400).json({ error: 'You cannot send a connection request to yourself.' });
    }

    // Verify recipient exists
    const recipient = await User.findById(targetRecipientId).lean();
    if (!recipient) {
      return res.status(404).json({ error: 'Target student not found.' });
    }

    // Verify current user
    const currentUser = await User.findById(currentUserId).lean();
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user profile not found.' });
    }

    const offerSkillName = (typeof offeredSkill === 'string' ? offeredSkill : offeredSkill?.name || '').trim();
    const reqSkillName = (typeof (targetSkill || requestedSkill) === 'string'
      ? (targetSkill || requestedSkill)
      : (targetSkill || requestedSkill)?.name || '').trim();

    if (!offerSkillName) {
      return res.status(400).json({ error: 'Please select a skill you can share in return.' });
    }

    if (!reqSkillName) {
      return res.status(400).json({ error: 'Please select a skill you would like to learn.' });
    }

    // Check skill ownership
    const userTeachSkill = (currentUser.skillsTeaching || []).find(
      (s) => s.name.toLowerCase() === offerSkillName.toLowerCase()
    );
    if (!userTeachSkill) {
      return res.status(400).json({
        error: `You do not have "${offerSkillName}" listed in your teaching skills.`
      });
    }

    // Check if duplicate pending request already exists
    const existingPending = await Connection.findOne({
      $or: [
        { sender: currentUserId, recipient: targetRecipientId, status: 'pending' },
        { sender: targetRecipientId, recipient: currentUserId, status: 'pending' }
      ]
    });

    if (existingPending) {
      if (existingPending.sender === currentUserId) {
        return res.status(409).json({
          error: 'You already have a pending connection request with this student.'
        });
      } else {
        return res.status(409).json({
          error: 'This student has already sent you a connection request. Please check your incoming requests!'
        });
      }
    }

    const recipientTeachSkill = (recipient.skillsTeaching || []).find(
      (s) => s.name.toLowerCase() === reqSkillName.toLowerCase()
    );

    const newConnection = await Connection.create({
      sender: currentUserId,
      recipient: targetRecipientId,
      offeredSkill: {
        id: userTeachSkill._id || userTeachSkill.id,
        name: userTeachSkill.name,
        level: userTeachSkill.level || 'Intermediate',
        category: userTeachSkill.category || 'General'
      },
      requestedSkill: {
        id: recipientTeachSkill?._id || recipientTeachSkill?.id,
        name: reqSkillName,
        level: recipientTeachSkill?.level || 'Intermediate',
        category: recipientTeachSkill?.category || 'General'
      },
      proposalText: (note || '').trim(),
      status: 'pending'
    });

    const usersMap = new Map();
    usersMap.set(currentUser._id.toString(), currentUser);
    usersMap.set(recipient._id.toString(), recipient);

    const formattedForSender = formatConnection(newConnection, currentUserId, usersMap);
    const formattedForRecipient = formatConnection(newConnection, targetRecipientId, usersMap);

    // Real-time notification to recipient via Socket.IO
    notifyConnectionRequest(targetRecipientId, formattedForRecipient);

    return res.status(201).json({ connection: formattedForSender });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'A pending connection request between you and this student is already in progress.'
      });
    }
    console.error('[Connections] POST / error:', err);
    return res.status(500).json({ error: 'Failed to send connection request.' });
  }
});

/**
 * PATCH /api/connections/:id/accept
 * Recipient accepts incoming connection request
 */
router.patch('/:id/accept', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const connectionId = req.params.id;

    // Atomically accept only if status is currently pending and current user is recipient
    const connection = await Connection.findOneAndUpdate(
      { _id: connectionId, recipient: currentUserId, status: 'pending' },
      { status: 'accepted' },
      { returnDocument: 'after' }
    );

    if (!connection) {
      return res.status(404).json({
        error: 'Pending connection request not found or you are not authorized to accept it.'
      });
    }

    // Automatically find or create a shared Conversation between both participants
    let conversation = await Conversation.findOne({
      participants: { $all: [connection.sender, connection.recipient] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        connectionId: connection._id,
        participants: [connection.sender, connection.recipient],
        lastMessage: {
          text: connection.proposalText || 'Connection accepted! Start sharing skills.',
          sender: connection.sender,
          createdAt: new Date()
        },
        unreadCounts: new Map()
      });

      // Save initial dialogue message
      await Message.create({
        conversationId: conversation._id,
        sender: connection.sender,
        text: connection.proposalText || 'Connection accepted! Start sharing skills.',
        status: 'delivered'
      });
    }

    const users = await User.find(
      { _id: { $in: [connection.sender, connection.recipient] } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const formattedForRecipient = formatConnection(connection, currentUserId, usersMap);
    const formattedForSender = formatConnection(connection, connection.sender, usersMap);

    // Notify sender in real time
    notifyConnectionAccepted(connection.sender, {
      connection: formattedForSender,
      conversationId: conversation._id.toString()
    });

    return res.json({
      connection: formattedForRecipient,
      conversationId: conversation._id.toString()
    });
  } catch (err) {
    console.error('[Connections] PATCH /:id/accept error:', err);
    return res.status(500).json({ error: 'Failed to accept connection request.' });
  }
});

/**
 * PATCH /api/connections/:id/decline
 * Recipient declines incoming connection request
 */
router.patch('/:id/decline', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const connectionId = req.params.id;

    // Atomically decline only if pending and current user is recipient
    const connection = await Connection.findOneAndUpdate(
      { _id: connectionId, recipient: currentUserId, status: 'pending' },
      { status: 'declined' },
      { returnDocument: 'after' }
    );

    if (!connection) {
      return res.status(404).json({
        error: 'Pending connection request not found or already handled.'
      });
    }

    // Notify sender in real time
    notifyConnectionDeclined(connection.sender, connection._id.toString());

    return res.json({
      success: true,
      connectionId: connection._id.toString(),
      status: 'declined'
    });
  } catch (err) {
    console.error('[Connections] PATCH /:id/decline error:', err);
    return res.status(500).json({ error: 'Failed to decline connection request.' });
  }
});

/**
 * PATCH /api/connections/:id/cancel
 * Sender cancels their own outgoing pending request
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const connectionId = req.params.id;

    const connection = await Connection.findOneAndUpdate(
      { _id: connectionId, sender: currentUserId, status: 'pending' },
      { status: 'cancelled' },
      { returnDocument: 'after' }
    );

    if (!connection) {
      return res.status(404).json({
        error: 'Pending connection request not found or already handled.'
      });
    }

    notifyConnectionCancelled(connection.recipient, connection._id.toString());

    return res.json({
      success: true,
      connectionId: connection._id.toString(),
      status: 'cancelled'
    });
  } catch (err) {
    console.error('[Connections] PATCH /:id/cancel error:', err);
    return res.status(500).json({ error: 'Failed to cancel connection request.' });
  }
});

export default router;
