import express from "express";
import { openDb } from "../db.js";
import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================
   CURRENT USER (ME) ROUTES
   MUST COME FIRST
   ============================ */

// PATCH /users/me -> update own profile
router.patch("/me", authenticate, async (req, res) => {
  try {
    const { username, bio, avatar, theme_color } = req.body;
    const db = await openDb();

    await db.run(
      `
      UPDATE users
      SET username = COALESCE(?, username),
          bio = COALESCE(?, bio),
          avatar = COALESCE(?, avatar),
          theme_color = COALESCE(?, theme_color)
      WHERE id = ?
      `,
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

/* ============================
   COLLECTION ROUTES
   ============================ */

// GET /users -> all users except self + blockers
router.get("/", authenticate, async (req, res) => {
  try {
    const db = await openDb();

    const users = await db.all(
      `
      SELECT id, username, bio, avatar, theme_color
      FROM users
      WHERE id != ?
      AND id NOT IN (
        SELECT blocker_id FROM blocks WHERE blocked_id = ?
      )
      `,
      [req.user.id, req.user.id]
    );

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   FOLLOW / UNFOLLOW
   ============================ */

// POST /users/:id/follow
router.post("/:id/follow", authenticate, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = Number(req.params.id);

    if (!Number.isInteger(followingId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (followerId === followingId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const db = await openDb();

    const existing = await db.get(
      "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );

    if (existing) {
      return res.status(409).json({ message: "Already following" });
    }

    await db.run(
      "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
      [followerId, followingId]
    );

    res.json({
      following: true,
      followerId,
      followingId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /users/:id/follow
router.delete("/:id/follow", authenticate, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = Number(req.params.id);

    if (!Number.isInteger(followingId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const db = await openDb();

    await db.run(
      "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );

    res.json({
      following: false,
      followerId,
      followingId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   PUBLIC USER PROFILE (LAST)
   ============================ */

// GET a user profile by ID (public, with block check + posts + follow info)
router.get("/:id", authenticate, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const viewerId = req.user.id;

    const db = await openDb();

    // BLOCK CHECK
    const blocked = await db.get(
      `SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?`,
      [targetUserId, viewerId]
    );
    if (blocked) return res.status(403).json({ message: "You are blocked" });

    // Get user
    const user = await db.get(
      `SELECT id, username, bio, avatar, theme_color FROM users WHERE id = ?`,
      [targetUserId]
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get user's posts
    const posts = await db.all(
      `SELECT id, content, created_at 
       FROM posts 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [targetUserId]
    );

    // Get follow status
    const follow = await db.get(
      `SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?`,
      [viewerId, targetUserId]
    );

    res.json({ 
      user,
      posts,
      isFollowing: !!follow 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

    // UPDATE logged-in user's profile
router.patch("/me", authenticate, async (req, res) => {
  try {
    const { bio, avatar, theme_color } = req.body;
    const userId = req.user.id;
    const db = await openDb();

    await db.run(
      `UPDATE users 
       SET bio = COALESCE(?, bio),
           avatar = COALESCE(?, avatar),
           theme_color = COALESCE(?, theme_color)
       WHERE id = ?`,
      [bio, avatar, theme_color, userId]
    );

    const updatedUser = await db.get(
      `SELECT id, username, bio, avatar, theme_color FROM users WHERE id = ?`,
      [userId]
    );

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Profile update failed" });
  }
});


export default router;
