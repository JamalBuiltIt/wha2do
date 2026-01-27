import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.js";
import tasksRoutes from "./routes/tasks.js";
import postsRouter from "./routes/posts.js";
import usersRouter from "./routes/users.js";
import blockRoutes from "./routes/blocks.js";
import authMiddleware from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

/* ---------------- SECURITY & CORE MIDDLEWARE ---------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => res.json({ message: "Backend running" }));

/* ---------------- API ROUTES ---------------- */
app.use("/api/auth", authRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);
app.use("/api/blocks", authMiddleware, blockRoutes);
app.use("/uploads", express.static("uploads"));

/* ---------------- HTTP + SOCKET.IO SERVER ---------------- */
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/* 🔐 SOCKET AUTHORIZATION (JWT) */
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = {
      id: decoded.id,
      username: decoded.username,
    };

    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

/* 🔄 SOCKET CONNECTION HANDLER */
io.on("connection", (socket) => {
  console.log(`Socket connected → ${socket.user.username} (ID: ${socket.user.id})`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected → ${socket.user.username}`);
  });
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend + Socket.IO running on http://localhost:${PORT}`);
});
