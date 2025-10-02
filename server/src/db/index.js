import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// Resolve DB file relative to the server directory (stable even if scripts run from repo root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..', '..'); // .../server
const dbFile = process.env.DB_FILE || 'data/jobportal.db';
const absolute = path.isAbsolute(dbFile) ? dbFile : path.join(serverRoot, dbFile);

fs.mkdirSync(path.dirname(absolute), { recursive: true });

export const db = new Database(absolute);
if (!process.env.SILENT_DB_PATH_LOG) {
	console.log('[DB] Using database file:', absolute);
}

db.pragma('journal_mode = WAL');

db.exec('PRAGMA foreign_keys = ON;');

export default db;
