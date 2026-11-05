import { io } from 'socket.io-client';

let socketInstance = null;

/**
 * Connect to real-time Socket.IO server with existing session cookie credentials
 */
export function connectSocket() {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.connect();
    return socketInstance;
  }

  // Auto-detect base path or use current origin
  socketInstance = io(window.location.origin, {
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  });

  socketInstance.on('connect', () => {
    // console.log('[Socket] Connected to real-time exchange gateway.');
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('[Socket] Connection notice:', err.message);
  });

  return socketInstance;
}

/**
 * Returns current socket instance if active
 */
export function getSocket() {
  if (!socketInstance) {
    return connectSocket();
  }
  return socketInstance;
}

/**
 * Disconnect socket and clear listeners (used on logout or switching accounts)
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Join specific conversation room
 */
export function joinConversation(conversationId) {
  const socket = getSocket();
  if (socket && conversationId) {
    socket.emit('join_conversation', { conversationId });
  }
}

/**
 * Leave specific conversation room
 */
export function leaveConversation(conversationId) {
  const socket = getSocket();
  if (socket && conversationId) {
    socket.emit('leave_conversation', { conversationId });
  }
}

