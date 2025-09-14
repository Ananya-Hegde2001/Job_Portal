import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbFile = process.env.DB_FILE || './data/jobportal.db';
const absolute = path.isAbsolute(dbFile) ? dbFile : path.join(process.cwd(), dbFile);

fs.mkdirSync(path.dirname(absolute), { recursive: true });

export const db = new Database(absolute);

db.pragma('journal_mode = WAL');

db.exec('PRAGMA foreign_keys = ON;');

export default db;
