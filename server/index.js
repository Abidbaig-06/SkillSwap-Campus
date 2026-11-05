import http from 'node:http';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { migrateSessions } from './migrate-sessions-collection.js';
import { SESSION_SECRET, PORT, validateConfig } from './config.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import studentsRoutes from './routes/students.js';
import skillsRoutes from './routes/skills.js';
import statsRoutes from './routes/stats.js';
import connectionsRoutes from './routes/connections.js';
import messagesRoutes from './routes/messages.js';
import sessionsRoutes from './routes/sessions.js';
import photosRoutes from './routes/photos.js';
import { initSocket } from './socket.js';

// Validate configuration
validateConfig();

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Re-use active Mongoose client connection for sessions via clientPromise
const clientPromise = (async () => {
  let attempt = 1;
  while (true) {
    try {
      await connectDB(null, 2);
      await migrateSessions();
      return mongoose.connection.getClient();
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.warn(`[SkillSwap Campus] Waiting for Atlas connection (Attempt ${attempt++}): ${err.message}. Retrying in 4s...`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
})();

// Persistent server-side session configuration using connect-mongo (distinct login_sessions collection)
const sessionStore = MongoStore.create({
  clientPromise,
  collectionName: 'login_sessions',
  ttl: 7 * 24 * 60 * 60, // 7 days
  autoRemove: 'native',
  touchAfter: 24 * 3600 // touch session at most once per 24 hours
});

app.use(
  session({
    store: sessionStore,
    name: 'skillswap_sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: null // Session cookie by default (expires on browser close); extended to 7 days when 'Remember me' is selected
    }
  })
);

// Initialize Socket.IO with session store authentication
const io = initSocket(server, sessionStore);

// Health check endpoint (always accessible, reports live connection status and database name)
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'ok' : 'connecting',
    service: 'SkillSwap Campus Backend',
    database: 'MongoDB',
    databaseName: mongoose.connection?.name || 'test',
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    time: new Date().toISOString()
  });
});

// Support both /SkillSwap-Campus/api and /api seamlessly
app.use((req, res, next) => {
  if (req.url.startsWith('/SkillSwap-Campus/api')) {
    req.url = req.url.replace(/^\/SkillSwap-Campus/, '');
  }
  next();
});

// Database readiness guard for API routes (ensures clean 503 JSON if DB is connecting)
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Campus database connection is in progress. Please ensure your IP address is whitelisted in MongoDB Atlas: https://www.mongodb.com/docs/atlas/security-whitelist/'
    });
  }
  next();
});

// Mount API routes
app.use('/api/photos', photosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/sessions', sessionsRoutes);

// 404 handler for unmatched API routes (ensures JSON response instead of HTML)
app.use('/api', (req, res) => {
  return res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Express error handler (guarantees valid JSON on unexpected errors)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }
  console.error('[API Error]', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error.'
  });
});

// Start listening immediately so Vite proxy, WebSockets, and health probes succeed
server.listen(PORT, () => {
  console.log(`[SkillSwap Campus] Express server listening on http://localhost:${PORT}`);
});

clientPromise
  .then(() => {
    console.log('[SkillSwap Campus] Connected to MongoDB Atlas. API services fully operational.');
  })
  .catch((err) => {
    console.error('[SkillSwap Campus] Database connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

export { app, server, io };
export default app;
