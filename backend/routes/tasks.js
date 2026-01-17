import express from 'express';
import { openDb } from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/* 🔒 Apply middleware to ALL routes */
router.use(authMiddleware);

/* 🔧 Ensure table exists AND has correct schema */
async function ensureTasksTable(db) {
  const columns = await db.all(`PRAGMA table_info(tasks)`);

  const hasUserId = columns.some(col => col.name === 'user_id');

  if (!columns.length) {
    // Table does not exist — create it correctly
    await db.run(`
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        user_id INTEGER
      )
    `);
  } 
  else if (!hasUserId) {
    // Table exists but is missing user_id — migrate it
    await db.run(`ALTER TABLE tasks ADD COLUMN user_id INTEGER`);
  }
}

/* Get all tasks for the logged-in user */
router.get('/', async (req, res) => {
  try {
    const db = await openDb();
    await ensureTasksTable(db);

    const tasks = await db.all(
      `SELECT * FROM tasks WHERE user_id = ?`,
      [req.user.id]
    );

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

export default router;
