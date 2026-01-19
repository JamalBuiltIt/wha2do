import express from 'express';
import { openDb } from '../db.js';
import  authenticate  from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all posts (already existing)
router.get('/', async (req, res) => {
  try {
    const db = await openDb();
    const posts = await db.all(`
      SELECT posts.id, posts.content, posts.user_id, posts.created_at, users.username
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new post (already existing)
router.post('/', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) return res.status(400).json({ message: 'Content is required' });

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO posts (content, user_id) VALUES (?, ?)',
      [content, userId]
    );

    res.json({
      id: result.lastID,
      content,
      user_id: userId,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: GET all users
router.get('/users', async (req, res) => {
  try {
    const db = await openDb();
    const users = await db.all('SELECT id, username FROM users');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: GET posts for a specific user
router.get('/user/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await openDb();
    const posts = await db.all(
      'SELECT id, content, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );

    // Also get username
    const user = await db.get('SELECT username FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
