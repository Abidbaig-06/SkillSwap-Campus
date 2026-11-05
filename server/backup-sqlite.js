import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const backupDir = path.join(dataDir, 'backups');
const dbPath = path.join(dataDir, 'skillswap.db');

export function backupSQLite() {
  if (!fs.existsSync(dbPath)) {
    console.log('[Backup] SQLite database not found at:', dbPath);
    return null;
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    console.log('[Backup] SQLite WAL mode checkpoint completed.');
  } catch (err) {
    console.warn('[Backup] Checkpoint warning (continuing with file copy):', err.message);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampedBackup = path.join(backupDir, `skillswap_backup_${timestamp}.db`);
  const canonicalBackup = path.join(backupDir, 'skillswap_pre_mongo_backup.db');

  fs.copyFileSync(dbPath, timestampedBackup);
  fs.copyFileSync(dbPath, canonicalBackup);

  console.log('[Backup] Created timestamped backup:', timestampedBackup);
  console.log('[Backup] Created canonical backup:', canonicalBackup);

  return { timestampedBackup, canonicalBackup };
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  backupSQLite();
}

