import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDb() {
  const db = await open({
    filename: './database.db',
    driver: sqlite3.Database
  });

  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      title TEXT,
      completed INTEGER DEFAULT 0
    )
  `);

  // 🔧 Add username column if it does not exist
  await db.run(`
    ALTER TABLE users ADD COLUMN username TEXT
  `).catch(() => {});

  return db;
}
