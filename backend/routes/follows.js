import express from 'express';
import { openDb } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Follow a user
// Follow a user
router.post('/:id/follow', authMiddleware, async (req, res) => {
  const { id: followingId } = req.params;
  const followerId = req.user.id;

  const db = await openDb();

  // Check for block in either direction
  const block = await db.get(
    `SELECT 1 FROM blocks
     WHERE (blocker_id = ? AND blocked_id = ?)
        OR (blocker_id = ? AND blocked_id = ?)`,
    [followerId, followingId, followingId, followerId]
  );

  if (block) {
    return res.status(403).json({ message: 'Noooo blocked' });
  }

  try {
    await db.run(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );
    res.json({ message: 'Followed successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Already following or error' });
  }
});


// Unfollow a user
router.delete('/:id/unfollow', authMiddleware, async (req, res) => {
  const { id: followingId } = req.params;
  const followerId = req.user.id;

  const db = await openDb();
  await db.run(
    'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );

  res.json({ message: 'Unfollowed successfully' });
});

// Get followers for a user
router.get('/:id/followers', async (req, res) => {
  const { id } = req.params;
  const db = await openDb();
  const followers = await db.all(
    `SELECT u.id, u.username FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = ?`,
    [id]
  );
  res.json(followers);
});

// Get following for a user
router.get('/:id/following', async (req, res) => {
  const { id } = req.params;
  const db = await openDb();
  const following = await db.all(
    `SELECT u.id, u.username FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = ?`,
    [id]
  );
  res.json(following);
});

export default router;
