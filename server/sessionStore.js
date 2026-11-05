import session from 'express-session';

/**
 * Custom persistent SQLite session store for express-session
 * using Node.js built-in node:sqlite DatabaseSync.
 */
export class SQLiteSessionStore extends session.Store {
  constructor(db) {
    super();
    this.db = db;

    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expired INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions (expired);
    `);

    this.cleanupStmt = this.db.prepare('DELETE FROM sessions WHERE expired < ?');
    this.getStmt = this.db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expired > ?');
    this.setStmt = this.db.prepare(`
      INSERT INTO sessions (sid, sess, expired)
      VALUES (?, ?, ?)
      ON CONFLICT(sid) DO UPDATE SET
        sess = excluded.sess,
        expired = excluded.expired
    `);
    this.destroyStmt = this.db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.touchStmt = this.db.prepare('UPDATE sessions SET expired = ? WHERE sid = ?');

    // Periodically remove expired sessions every 15 minutes
    this.timer = setInterval(() => {
      try {
        this.cleanupStmt.run(Date.now());
      } catch (err) {
        console.error('[SessionStore] Session cleanup error:', err);
      }
    }, 15 * 60 * 1000);
    this.timer.unref();
  }

  get(sid, callback) {
    try {
      const row = this.getStmt.get(sid, Date.now());
      if (!row) {
        return callback(null, null);
      }
      const data = JSON.parse(row.sess);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const maxAge = sessionData?.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expired = Date.now() + maxAge;
      const sessStr = JSON.stringify(sessionData);
      this.setStmt.run(sid, sessStr, expired);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      this.destroyStmt.run(sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid, sessionData, callback) {
    try {
      const maxAge = sessionData?.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expired = Date.now() + maxAge;
      this.touchStmt.run(expired, sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

