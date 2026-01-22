import express from "express";
import { openDb } from "../db.js";
import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all users (for feed / follow suggestions)
router.get("/", authenticate, async (req, res) => {
  try {
    const db = await openDb();

    // Exclude the current user and users who blocked the current user
    const users = await db.all(
      `SELECT id, username, bio, avatar, theme_color
       FROM users
       WHERE id != ?
       AND id NOT IN (
         SELECT blocker_id FROM blocks WHERE blocked_id = ?
       )`,
      [req.user.id, req.user.id]
    );

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET a user profile by ID (public, with block check)
router.get("/:id", authenticate, async (req, res) => {
  const targetUserId = parseInt(req.params.id);
  const viewerId = req.user.id;

  const db = await openDb();

  // 🔒 BLOCK CHECK: targetUser blocked viewer
  const blocked = await db.get(
    `SELECT 1 FROM blocks
     WHERE blocker_id = ? AND blocked_id = ?`,
    [targetUserId, viewerId]
  );

  if (blocked) {
    return res.status(403).json({ message: "You are blocked" });
  }

  const user = await db.get(
    "SELECT id, username, bio, avatar, theme_color FROM users WHERE id = ?",
    [targetUserId]
  );

  res.json(user);
});

// PATCH current user profile (authenticated)
router.patch("/me", authenticate, async (req, res) => {
  try {
    const { username, bio, avatar, theme_color } = req.body;
    const db = await openDb();

    await db.run(
      `UPDATE users
       SET username = COALESCE(?, username),
           bio = COALESCE(?, bio),
           avatar = COALESCE(?, avatar),
           theme_color = COALESCE(?, theme_color)
       WHERE id = ?`,
      [username, bio, avatar, theme_color, req.user.id]
    );

    const updatedUser = await db.get(
      "SELECT id, username, bio, avatar, theme_color FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }


});

router.post("/:id/follow", authenticate, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.id);

    if (followerId === followingId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const db = await openDb();

    // Check if already following
    const existing = await db.get(
      "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );
    if (existing) return res.status(400).json({ message: "Already following" });

    // Insert follow record
    await db.run(
      "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
      [followerId, followingId]
    );

    res.json({  
      following: true,
      followerId,
      followingId 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /users/:id/follow -> unfollow a user
router.delete("/:id/follow", authenticate, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.id);

    const db = await openDb();
    await db.run(
      "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );

    res.json({
      following: false,
      followerId,
      followingId
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /users/me/following -> users I follow
router.get("/me/following", authenticate, async (req, res) => {
  try {
    const db = await openDb();

    const following = await db.all(
      `
      SELECT users.id, users.username, users.avatar
      FROM follows
      JOIN users ON users.id = follows.following_id
      WHERE follows.follower_id = ?
      `,
      [req.user.id]
    );

    res.json(following);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




export default router;
