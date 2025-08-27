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

// CORS configuration: allow localhost during dev and the frontend origin in PROD
const allowedOrigins: string[] = [];
if (process.env.VERCEL_URL) {
  // Vercel provides VERCEL_URL like "my-app.vercel.app" (no protocol)
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
// Support explicit frontend URL env var (Render deployments)
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.FRONTEND_ORIGIN) {
  allowedOrigins.push(process.env.FRONTEND_ORIGIN);
}
if (process.env.VITE_API_URL) {
  // If provided, extract origin (strip /api)
  try {
    const url = new URL(process.env.VITE_API_URL);
    allowedOrigins.push(url.origin);
  } catch (e) {
    // ignore invalid URL
  }
}
// Always allow localhost for local dev (including various ports)
allowedOrigins.push('http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'));
  }
}));
// Log allowed origins so we can verify config on startup
console.log('CORS allowed origins:', allowedOrigins);
// Middleware
app.use(express.json());

// Import cache control middleware
import { setCacheControl } from './middleware/cacheControl';

// Apply cache control to all routes
app.use(setCacheControl);

// Serve uploaded files with cache control
app.use('/uploads', express.static('uploads', {
  maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days cache
  etag: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
