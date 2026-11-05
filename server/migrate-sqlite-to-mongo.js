import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { connectDB, disconnectDB } from './db.js';
import { User } from './models/User.js';
import { backupSQLite } from './backup-sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const sqliteDbPath = path.join(dataDir, 'skillswap.db');

export async function migrateSQLiteToMongo({ dryRun = false, dbPath = sqliteDbPath } = {}) {
  console.log('====================================================');
  console.log('SkillSwap Campus — SQLite to MongoDB Data Migration');
  console.log(`Mode: ${dryRun ? 'DRY RUN (Read-Only Validation)' : 'REAL MIGRATION'}`);
  console.log('====================================================\n');

  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database not found at: ${dbPath}`);
  }

  // Backup SQLite database before migration
  if (!dryRun) {
    console.log('[Step 1/5] Creating consistent SQLite backup...');
    backupSQLite();
  } else {
    console.log('[Step 1/5] Dry run: verified SQLite database exists at:', dbPath);
  }

  // Read SQLite tables
  console.log('[Step 2/5] Reading accounts and skills from SQLite...');
  const sqliteDb = new DatabaseSync(dbPath);
  const sqliteUsers = sqliteDb.prepare('SELECT * FROM users ORDER BY created_at ASC').all();
  const sqliteSkills = sqliteDb.prepare('SELECT * FROM user_skills').all();

  console.log(`  Found ${sqliteUsers.length} user accounts and ${sqliteSkills.length} skill entries in SQLite.`);

  // Connect to MongoDB
  console.log('[Step 3/5] Connecting to MongoDB...');
  await connectDB();

  // Prepare migration records
  const recordsToMigrate = sqliteUsers.map((u) => {
    const userSkills = sqliteSkills.filter((s) => s.user_id === u.id);
    const skillsTeaching = userSkills
      .filter((s) => s.type === 'teach')
      .map((s) => ({
        _id: s.id,
        name: s.name,
        level: s.level || 'Intermediate',
        category: s.category || 'Programming',
        endorsements: s.endorsements || 0
      }));

    const skillsLearning = userSkills
      .filter((s) => s.type === 'learn')
      .map((s) => ({
        _id: s.id,
        name: s.name,
        level: s.level || 'Beginner',
        category: s.category || 'General'
      }));

    return {
      _id: u.id,
      email: u.email.toLowerCase().trim(),
      passwordHash: u.password_hash,
      name: u.name,
      department: u.department || 'Computer Science & Engineering',
      year: u.year || '1st Year',
      avatar: u.avatar || './avatars/default_avatar.svg',
      bio: u.bio || '',
      isVerified: Boolean(u.is_verified),
      isDemo: Boolean(u.is_demo),
      skillsTeaching,
      skillsLearning,
      createdAt: u.created_at ? new Date(u.created_at) : new Date(),
      updatedAt: u.updated_at ? new Date(u.updated_at) : new Date()
    };
  });

  // Check for conflicts in MongoDB
  console.log('[Step 4/5] Checking for conflicts with existing MongoDB records...');
  const conflicts = [];
  const existingUsers = [];

  for (const record of recordsToMigrate) {
    const existing = await User.findOne({
      $or: [{ _id: record._id }, { email: record.email }]
    });

    if (existing) {
      if (existing._id === record._id && existing.email === record.email) {
        existingUsers.push(record);
      } else {
        conflicts.push({
          incoming: { id: record._id, email: record.email, name: record.name },
          existing: { id: existing._id, email: existing.email, name: existing.name }
        });
      }
    }
  }

  if (conflicts.length > 0) {
    console.error('[Migration Error] Detected conflicting records in MongoDB:');
    for (const c of conflicts) {
      console.error(`  Conflict: Incoming [${c.incoming.id} / ${c.incoming.email}] matches existing [${c.existing.id} / ${c.existing.email}]`);
    }
    throw new Error('Migration stopped: Conflicting records detected in MongoDB.');
  }

  console.log(`  Summary: ${recordsToMigrate.length} total SQLite accounts.`);
  console.log(`  - ${existingUsers.length} already exist identically in MongoDB.`);
  console.log(`  - ${recordsToMigrate.length - existingUsers.length} new records to import.`);
  console.log(`  - 0 conflicts detected.`);

  for (const r of recordsToMigrate) {
    console.log(`    * [${r.isDemo ? 'DEMO' : 'REAL'}] ${r.name} (${r.email}) — ${r.skillsTeaching.length} teach, ${r.skillsLearning.length} learn`);
  }

  if (dryRun) {
    console.log('\n[Dry Run Completed] All records are valid and ready for migration. No changes were made to MongoDB.');
    return { dryRun: true, count: recordsToMigrate.length };
  }

  // Execute Real Migration
  console.log('\n[Step 5/5] Importing records into MongoDB...');
  let importedCount = 0;
  for (const record of recordsToMigrate) {
    const existing = await User.findById(record._id);
    if (!existing) {
      await User.create(record);
      importedCount++;
      console.log(`  [Imported] ${record.name} (${record.email}) [ID: ${record._id}]`);
    } else {
      console.log(`  [Skipped - Already Exists] ${record.name} (${record.email})`);
    }
  }

  // Verification
  const totalInMongo = await User.countDocuments();
  console.log(`\n[Verification] MongoDB total user count: ${totalInMongo}`);
  for (const record of recordsToMigrate) {
    const verified = await User.findById(record._id);
    if (!verified) {
      throw new Error(`Verification failed: user ${record._id} not found in MongoDB after migration.`);
    }
  }

  console.log('✓ All SQLite records successfully verified in MongoDB.');
  console.log('NOTICE: SQLite sessions have been reset. Existing users will need to log in again with their password.\n');

  return { dryRun: false, importedCount, totalInMongo };
}

// Direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateSQLiteToMongo({ dryRun: isDryRun })
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Migration failed:', err.message);
      await disconnectDB();
      process.exit(1);
    });
}

