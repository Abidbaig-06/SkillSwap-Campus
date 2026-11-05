import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

// Load environment variables from root .env
dotenv.config({ path: envPath });

// Auto-generate SESSION_SECRET if missing in development
if (!process.env.SESSION_SECRET) {
  const generatedSecret = crypto.randomBytes(32).toString('hex');
  process.env.SESSION_SECRET = generatedSecret;

  try {
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (/SESSION_SECRET\s*=/i.test(envContent)) {
      envContent = envContent.replace(/SESSION_SECRET\s*=.*$/m, `SESSION_SECRET=${generatedSecret}`);
    } else {
      envContent = envContent ? `${envContent.trimEnd()}\nSESSION_SECRET=${generatedSecret}\n` : `SESSION_SECRET=${generatedSecret}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('[Config] Generated development SESSION_SECRET and saved privately to .env');
  } catch (err) {
    console.warn('[Config] Could not write SESSION_SECRET to .env (using in-memory secret):', err.message);
  }
}

export const MONGODB_URI = process.env.MONGODB_URI;
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const PORT = process.env.PORT || 3001;
export const NODE_ENV = process.env.NODE_ENV || 'development';

export function validateConfig() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Please configure MONGODB_URI in your root .env file.');
  }
  if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not set.');
  }
}

