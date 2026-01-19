import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';
import dotenv from 'dotenv';
import postsRouter from './routes/posts.js';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/posts', postsRouter);

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));
