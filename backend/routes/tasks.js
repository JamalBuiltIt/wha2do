import express from "express";
import { openDb } from "../db.js";
import  authenticate  from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all tasks for the logged-in user
router.get("/", authenticate, async (req, res) => {
  try {
    const db = await openDb();
    const tasks = await db.all("SELECT * FROM tasks WHERE userId = ?", [req.user.id]);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST a new task
router.post("/", authenticate, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const db = await openDb();
    const result = await db.run(
      "INSERT INTO tasks (userId, title) VALUES (?, ?)",
      [req.user.id, title]
    );

    res.json({
      id: result.lastID,
      userId: req.user.id,
      title,
      completed: 0,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /tasks/:id -> update task (completed or title)
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    const db = await openDb();

    await db.run(
      "UPDATE tasks SET title = COALESCE(?, title), completed = COALESCE(?, completed) WHERE id = ? AND userId = ?",
      [title, completed, id, req.user.id]
    );

    const updated = await db.get("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a task
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await openDb();
    await db.run("DELETE FROM tasks WHERE id = ? AND userId = ?", [id, req.user.id]);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
