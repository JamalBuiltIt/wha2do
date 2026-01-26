import express from "express";
import { openDb } from "../db.js";
import authenticate from "../middleware/authMiddleware.js";
import { io } from "../index.js";

const router = express.Router();

/* GET all posts */
router.get("/", async (req, res) => {
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
    res.status(500).json({ message: "Server error" });
  }
});

/* CREATE post + LIVE BROADCAST */
router.post("/", authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content?.trim())
      return res.status(400).json({ message: "Content required" });

    const db = await openDb();
    const result = await db.run(
      "INSERT INTO posts (content, user_id) VALUES (?, ?)",
      [content, userId]
    );

    const newPost = await db.get(
      `SELECT posts.id, posts.content, posts.user_id, posts.created_at, users.username
       FROM posts
       JOIN users ON posts.user_id = users.id
       WHERE posts.id = ?`,
      [result.lastID]
    );

    io.emit("new_post", newPost); // 🔥 realtime

    res.json(newPost);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
