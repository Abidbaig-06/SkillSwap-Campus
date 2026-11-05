import { Server } from 'socket.io';
import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { SESSION_SECRET } from './config.js';
import { Conversation } from './models/Conversation.js';
import { Message } from './models/Message.js';

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

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export function initSocket(httpServer, sessionStore) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    },
    serveClient: false
  });

  ioInstance = io;

  // Socket.IO authentication middleware using Express session store
  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.request.headers.cookie;
      if (!rawCookie) {
        return next(); // Unauthenticated guest
      }

      const parsedCookies = cookie.parse(rawCookie);
      const rawSessionCookie = parsedCookies['skillswap_sid'];
      if (!rawSessionCookie) {
        return next();
      }

      // Unsign session cookie (Express cookieParser prepends 's:')
      const unsignedSid = cookieParser.signedCookie(rawSessionCookie, SESSION_SECRET);
      if (!unsignedSid) {
        return next();
      }

      sessionStore.get(unsignedSid, (err, sess) => {
        if (err || !sess || !sess.userId) {
          socket.userId = null;
          return next();
        }

        socket.sessionId = unsignedSid;
        socket.userId = sess.userId;
        next();
      });
    } catch (err) {
      console.warn('[Socket.IO] Auth middleware error:', err.message);
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Join a conversation room (authorized only if participant)
    socket.on('join_conversation', async (data, callback) => {
      try {
        const conversationId = typeof data === 'string' ? data : data?.conversationId;
        if (!socket.userId) {
          if (callback) callback({ error: 'Authentication required' });
          return;
        }

        const conv = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        }).lean();

        if (!conv) {
          if (callback) callback({ error: 'Access denied: not a participant of this conversation.' });
          return;
        }

        socket.join(`conv:${conversationId}`);
        if (callback) callback({ success: true, conversationId });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // Leave a conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Real-time message sending over Socket
    socket.on('send_message', async ({ conversationId, text, clientMsgId }, callback) => {
      try {
        if (!socket.userId) {
          if (callback) callback({ error: 'Authentication required' });
          return;
        }

        const cleanText = (text || '').trim();
        if (!cleanText) {
          if (callback) callback({ error: 'Message text cannot be empty.' });
          return;
        }

        const conv = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (!conv) {
          if (callback) callback({ error: 'Conversation not found or access denied.' });
          return;
        }

        // Idempotency: check if already saved with clientMsgId
        let message;
        if (clientMsgId) {
          message = await Message.findOne({ conversationId, clientMsgId });
        }

        if (!message) {
          message = await Message.create({
            conversationId,
            sender: socket.userId,
            text: cleanText,
            clientMsgId: clientMsgId || null,
            status: 'sent'
          });

          // Update conversation's lastMessage
          conv.lastMessage = {
            text: cleanText,
            sender: socket.userId,
            createdAt: message.createdAt
          };

          // Increment unread count for the other participant
          const otherParticipant = conv.participants.find((p) => p !== socket.userId);
          if (otherParticipant) {
            const currentCount = getUnreadCount(conv.unreadCounts, otherParticipant);
            setUnreadCount(conv, otherParticipant, currentCount + 1);
          }

          await conv.save();
        }

        const payload = {
          id: message._id.toString(),
          conversationId: message.conversationId.toString(),
          senderId: message.sender,
          text: message.text,
          clientMsgId: message.clientMsgId,
          status: message.status,
          createdAt: message.createdAt
        };

        // Broadcast to all clients in this conversation room
        io.to(`conv:${conversationId}`).emit('message_received', payload);

        // Also notify other participant's personal room for badge / toast
        const otherParticipant = conv.participants.find((p) => p !== socket.userId);
        if (otherParticipant) {
          io.to(`user:${otherParticipant}`).emit('conversation_updated', {
            conversationId: conv._id.toString(),
            lastMessage: conv.lastMessage
          });
        }

        if (callback) callback({ success: true, message: payload });
      } catch (err) {
        console.error('[Socket.IO] send_message error:', err);
        if (callback) callback({ error: err.message });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      if (socket.userId) {
        socket.to(`conv:${conversationId}`).emit('peer_typing', {
          conversationId,
          userId: socket.userId,
          typing: true
        });
      }
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (socket.userId) {
        socket.to(`conv:${conversationId}`).emit('peer_typing', {
          conversationId,
          userId: socket.userId,
          typing: false
        });
      }
    });

    socket.on('disconnect', () => {
      // Automatic cleanup handled by socket.io
    });
  });

  return io;
}

// Notification helpers callable from REST route handlers
export function notifyConnectionRequest(recipientId, connection) {
  if (!ioInstance) return;
  ioInstance.to(`user:${recipientId}`).emit('new_connection_request', connection);
}

export function notifyConnectionAccepted(senderId, data) {
  if (!ioInstance) return;
  ioInstance.to(`user:${senderId}`).emit('connection_accepted', data);
}

export function notifyConnectionDeclined(senderId, connectionId) {
  if (!ioInstance) return;
  ioInstance.to(`user:${senderId}`).emit('connection_declined', { connectionId });
}

export function notifyConnectionCancelled(recipientId, connectionId) {
  if (!ioInstance) return;
  ioInstance.to(`user:${recipientId}`).emit('connection_cancelled', { connectionId });
}

export function notifySessionProposed(partnerId, session) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_proposed', session);
}

export function notifySessionConfirmed(partnerId, session) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_confirmed', session);
}

export function notifySessionDeclined(partnerId, session) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_declined', session);
}

export function notifySessionCancelled(partnerId, session) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_cancelled', session);
}

export function notifySessionRescheduled(partnerId, session) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_rescheduled', session);
}

export function notifySessionCompleted(partnerId, session) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_completed', session);
}

export function notifySessionNoteAdded(partnerId, data) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_note_added', data);
}

export function notifySessionNoteUpdated(partnerId, data) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_note_updated', data);
}

export function notifySessionNoteDeleted(partnerId, data) {
  if (!ioInstance) return;
  ioInstance.to(`user:${partnerId}`).emit('session_note_deleted', data);
}

/**
 * Disconnects all active Socket.IO connections for a deleted or logged-out user
 */
export function disconnectUserSockets(userId) {
  if (!ioInstance || !userId) return;
  const room = `user:${userId}`;
  ioInstance.in(room).disconnectSockets(true);
}
