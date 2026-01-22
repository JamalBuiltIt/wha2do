import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';
import postsRouter from './routes/posts.js';
import usersRouter from './routes/users.js';
import blockRoutes from './routes/blocks.js';
import  authMiddleware from './middleware/authMiddleware.js';

dotenv.config();

const app = express();

// Middleware - must come BEFORE routes
app.use(cors());
app.use(express.json());

// Test route (optional)
app.get('/', (req, res) => res.json({ message: 'Backend running' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/blocks', authMiddleware, blockRoutes); // protect blocks with auth

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`)
);
