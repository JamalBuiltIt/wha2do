import express from 'express';
import { openDb } from '../db.js';
import  authMiddleware  from '../middleware/authMiddleware.js';

const router = express.Router();

// Block a user
router.post('/:id', authMiddleware, async (req, res) => {
  const blockedId = parseInt(req.params.id);
  const blockerId = req.user.id;

  if (blockedId === blockerId) {
    return res.status(400).json({ message: 'You cannot block yourself' });
  }

  const db = await openDb();

  try {
    // Insert block
    await db.run(
      'INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)',
      [blockerId, blockedId]
    );

    // Remove any follow relationship in either direction
    await db.run(
      `DELETE FROM follows
       WHERE (follower_id = ? AND following_id = ?)
          OR (follower_id = ? AND following_id = ?)`,
      [blockerId, blockedId, blockedId, blockerId]
    );

    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to block user' });
  }
});

// Unblock a user
router.delete('/:id', authMiddleware, async (req, res) => {
  const blockedId = parseInt(req.params.id);
  const blockerId = req.user.id;

  const db = await openDb();
  await db.run(
    'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
    [blockerId, blockedId]
  );

  res.json({ message: 'User unblocked' });
});

export default router;
