import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');

const app = express();
const server = http.createServer(app);

// Trust Render reverse proxy before session middleware (enables secure HTTPS cookies over Render's proxy)
app.set('trust proxy', 1);

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

// Unified API Router mounted at both /api and /SkillSwap-Campus/api
const apiRouter = express.Router();

// Health check endpoint (always accessible, reports live connection status and database name)
apiRouter.get('/health', (req, res) => {
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

// Database readiness guard for API routes (ensures clean 503 JSON if DB is connecting)
apiRouter.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Campus database connection is in progress. Please ensure your IP address is whitelisted in MongoDB Atlas: https://www.mongodb.com/docs/atlas/security-whitelist/'
    });
  }
  next();
});

// Mount API resource routes
apiRouter.use('/photos', photosRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/me', meRoutes);
apiRouter.use('/students', studentsRoutes);
apiRouter.use('/skills', skillsRoutes);
apiRouter.use('/stats', statsRoutes);
apiRouter.use('/connections', connectionsRoutes);
apiRouter.use('/messages', messagesRoutes);
apiRouter.use('/sessions', sessionsRoutes);

// 404 handler for unmatched API routes (ensures JSON response instead of HTML)
apiRouter.use((req, res) => {
  return res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Mount unified API router at both /api and /SkillSwap-Campus/api
app.use('/api', apiRouter);
app.use('/SkillSwap-Campus/api', apiRouter);

// Production static file serving & SPA fallback
// Redirect root / to /SkillSwap-Campus/
app.get('/', (req, res) => {
  res.redirect(302, '/SkillSwap-Campus/');
});

// Favicon shortcut
app.get('/favicon.svg', (req, res) => {
  const favPath = path.join(distPath, 'favicon.svg');
  if (fs.existsSync(favPath)) {
    return res.sendFile(favPath);
  }
  res.status(404).end();
});

// Serve static assets from the built Vite dist directory at /SkillSwap-Campus/
app.use(
  '/SkillSwap-Campus',
  express.static(distPath, {
    index: 'index.html',
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
  })
);

// SPA fallback for /SkillSwap-Campus/ and any subpaths (e.g. /SkillSwap-Campus/discover)
app.get(/^\/SkillSwap-Campus(?:\/.*)?$/, (req, res, next) => {
  if (req.originalUrl.startsWith('/SkillSwap-Campus/api') || req.originalUrl.startsWith('/api')) {
    return next();
  }
  // If a request has a file extension (e.g. missing .js, .css, .png), return 404 instead of index.html
  if (path.extname(req.path)) {
    return res.status(404).send('Asset not found');
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send('SkillSwap Campus dist not found. Please run npm run build.');
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
