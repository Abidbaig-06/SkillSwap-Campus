import { Router } from 'express';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { getIO } from '../socket.js';

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
    console.error('[Messages Auth Middleware] Error:', err);
    return res.status(500).json({ error: 'Authentication verification failed.' });
  }
}

router.use(requireAuth);

function formatTime(date) {
  if (!date) return 'Just now';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getUnreadCount(unreadCounts, userId) {
  if (!unreadCounts) return 0;
  if (typeof unreadCounts.get === 'function') {
    return unreadCounts.get(userId) || 0;
  }
  return unreadCounts[userId] || 0;
}

function setUnreadCount(conv, userId, count) {
  if (!conv.unreadCounts) {
    conv.unreadCounts = new Map();
  }
  if (typeof conv.unreadCounts.set === 'function') {
    conv.unreadCounts.set(userId, count);
  } else {
    conv.unreadCounts[userId] = count;
  }
}

/**
 * Format conversation document for frontend Messages.jsx
 */
function formatConversation(conv, currentUserId, usersMap, messagesList = []) {
  const peerId = (conv.participants || []).find((p) => p !== currentUserId) || currentUserId;
  const isPeerDeleted = !usersMap.has(peerId);
  const peer = usersMap.get(peerId) || {
    name: 'Deleted student',
    department: 'Former student',
    year: '',
    avatar: './avatars/default_avatar.svg',
    isDeleted: true
  };

  const unread = getUnreadCount(conv.unreadCounts, currentUserId);
  const lastTime = formatTime(conv.lastMessage?.createdAt || conv.updatedAt);

  const formattedMessages = messagesList.map((m) => ({
    id: m._id.toString(),
    _id: m._id.toString(),
    conversationId: m.conversationId.toString(),
    sender: m.sender === currentUserId ? 'user' : 'peer',
    senderId: m.sender,
    clientMsgId: m.clientMsgId || null,
    text: m.text,
    time: formatTime(m.createdAt),
    createdAt: m.createdAt,
    status: m.status
  }));

  return {
    id: conv._id.toString(),
    _id: conv._id.toString(),
    studentId: peerId,
    studentName: peer.name,
    peerName: peer.name,
    department: peer.department || 'Former student',
    avatar: peer.avatar || './avatars/default_avatar.svg',
    peerAvatar: peer.avatar || './avatars/default_avatar.svg',
    isDeleted: isPeerDeleted || Boolean(peer.isDeleted),
    status: isPeerDeleted ? 'Offline' : 'Online',
    unread,
    unreadCount: unread,
    lastTime,
    lastMessage: conv.lastMessage?.text || '',
    messages: formattedMessages
  };
}

/**
 * GET /api/messages/conversations
 * List all active conversations for the authenticated student
 */
router.get('/conversations', async (req, res) => {
  try {
    const currentUserId = req.session.userId;

    const rawConvs = await Conversation.find({
      participants: currentUserId
    })
      .sort({ updatedAt: -1 })
      .lean();

    const userIds = new Set();
    rawConvs.forEach((c) => {
      (c.participants || []).forEach((p) => userIds.add(p));
    });

    const users = await User.find(
      { _id: { $in: Array.from(userIds) } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    // Fetch messages for each conversation (up to last 50 per conversation)
    const convIds = rawConvs.map((c) => c._id);
    const messages = await Message.find({
      conversationId: { $in: convIds }
    })
      .sort({ createdAt: 1 })
      .lean();

    const messagesByConv = new Map();
    messages.forEach((m) => {
      const cid = m.conversationId.toString();
      if (!messagesByConv.has(cid)) {
        messagesByConv.set(cid, []);
      }
      messagesByConv.get(cid).push(m);
    });

    const conversations = rawConvs.map((conv) => {
      const convMessages = messagesByConv.get(conv._id.toString()) || [];
      return formatConversation(conv, currentUserId, usersMap, convMessages);
    });

    return res.json({ conversations });
  } catch (err) {
    console.error('[Messages] GET /conversations error:', err);
    return res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

/**
 * GET /api/messages/conversations/:id
 * Retrieve specific conversation with full message history and mark as read
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const conversationId = req.params.id;

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found or access denied.' });
    }

    // Reset unread count for current user
    if (getUnreadCount(conv.unreadCounts, currentUserId) > 0) {
      setUnreadCount(conv, currentUserId, 0);
      await conv.save();
    }

    const users = await User.find(
      { _id: { $in: conv.participants } },
      { name: 1, department: 1, year: 1, avatar: 1 }
    ).lean();

    const usersMap = new Map();
    users.forEach((u) => usersMap.set(u._id.toString(), u));

    const messages = await Message.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    const formatted = formatConversation(conv, currentUserId, usersMap, messages);

    return res.json({ conversation: formatted });
  } catch (err) {
    console.error('[Messages] GET /conversations/:id error:', err);
    return res.status(500).json({ error: 'Failed to retrieve conversation details.' });
  }
});

/**
 * POST /api/messages/conversations/:id/messages
 * Send message in conversation with server-assigned sender, timestamp, and idempotency
 */
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const conversationId = req.params.id;
    const { text, clientMsgId } = req.body;

    const cleanText = (text || '').trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conv) {
      return res.status(403).json({ error: 'Conversation not found or you are not a participant.' });
    }

    // Idempotency: avoid duplicates if clientMsgId was already stored
    let message;
    if (clientMsgId) {
      message = await Message.findOne({ conversationId: conv._id, clientMsgId });
    }

    if (!message) {
      message = await Message.create({
        conversationId: conv._id,
        sender: currentUserId,
        text: cleanText,
        clientMsgId: clientMsgId || null,
        status: 'sent'
      });

      conv.lastMessage = {
        text: cleanText,
        sender: currentUserId,
        createdAt: message.createdAt
      };

      // Increment unread count for the other participant
      const otherParticipant = conv.participants.find((p) => p !== currentUserId);
      if (otherParticipant) {
        const currentCount = getUnreadCount(conv.unreadCounts, otherParticipant);
        setUnreadCount(conv, otherParticipant, currentCount + 1);
      }

      await conv.save();
    }

    const formattedMessage = {
      id: message._id.toString(),
      _id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      sender: 'user',
      senderId: currentUserId,
      clientMsgId: message.clientMsgId || clientMsgId || null,
      text: message.text,
      time: formatTime(message.createdAt),
      createdAt: message.createdAt,
      status: message.status
    };

    // Broadcast over Socket.IO to room participants
    const io = getIO();
    if (io) {
      io.to(`conv:${conversationId}`).emit('message_received', formattedMessage);

      const otherParticipant = conv.participants.find((p) => p !== currentUserId);
      if (otherParticipant) {
        io.to(`user:${otherParticipant}`).emit('conversation_updated', {
          conversationId: conv._id.toString(),
          lastMessage: conv.lastMessage
        });
      }
    }

    return res.status(201).json({ message: formattedMessage });
  } catch (err) {
    console.error('[Messages] POST /conversations/:id/messages error:', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

/**
 * POST /api/messages/start
 * Open or create a conversation with a peer
 */
router.post('/start', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Peer student ID is required.' });
    }

    if (studentId === currentUserId) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself.' });
    }

    const peer = await User.findById(studentId).lean();
    if (!peer) {
      return res.status(404).json({ error: 'Target student not found.' });
    }

    let conv = await Conversation.findOne({
      participants: { $all: [currentUserId, studentId] }
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [currentUserId, studentId],
        lastMessage: {
          text: `Hi ${peer.name.split(' ')[0]}! Excited to connect and swap skills.`,
          sender: currentUserId,
          createdAt: new Date()
        },
        unreadCounts: new Map()
      });

      await Message.create({
        conversationId: conv._id,
        sender: currentUserId,
        text: `Hi ${peer.name.split(' ')[0]}! Excited to connect and swap skills.`,
        status: 'delivered'
      });
    }

    const usersMap = new Map();
    usersMap.set(studentId, peer);

    const messages = await Message.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .lean();

    const formatted = formatConversation(conv, currentUserId, usersMap, messages);

    return res.json({ conversation: formatted });
  } catch (err) {
    console.error('[Messages] POST /start error:', err);
    return res.status(500).json({ error: 'Failed to start conversation.' });
  }
});

export default router;

