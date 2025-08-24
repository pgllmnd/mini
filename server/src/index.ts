import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import questionRoutes from './routes/questions';
import userRoutes from './routes/users';
import tagRoutes from './routes/tags';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/chat', chatRoutes);

// Lightweight healthcheck
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
