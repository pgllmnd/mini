/// <reference types="node" />
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import questionRoutes from './routes/questions';
import answerActionsRoutes from './routes/answer-actions';
import userRoutes from './routes/users';
import tagRoutes from './routes/tags';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();

// When running behind a proxy (Render, Vercel, etc.) trust the proxy so
// secure cookies and client IPs work as expected.
app.set('trust proxy', 1);

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
      console.warn('Invalid VITE_API_URL, ignoring:', e instanceof Error ? e.message : e);
    }
}
// Always allow localhost for local dev (including various ports)
allowedOrigins.push('http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000');

app.use(cors({
  origin: (origin: any, callback: any) => {
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
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days cache
  etag: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
// Expose /api/answers/:answerId/accept and /api/answers/:answerId/vote
app.use('/api', answerActionsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/chat', chatRoutes);

// Debug route: list registered routes (only in dev)
  if (process.env.NODE_ENV !== 'production') {
  app.get('/__routes', (_req: any, res: any) => {
    try {
      // Extract readable routes from app stack
      // @ts-ignore - internal Express structure
      const routes = app._router.stack
        .filter((r: any) => r.route)
        .map((r: any) => {
          const methods = Object.keys(r.route.methods).join(',');
          return `${methods.toUpperCase()} ${r.route.path}`;
        });
      res.json({ routes });
    } catch (e) {
      console.error('Unable to list routes', e);
      res.status(500).json({ error: 'Unable to list routes' });
    }
  });
}

const PORT = parseInt(process.env.PORT || '5000', 10);

app.get('/health', (_req: any, res: any) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (env=${process.env.NODE_ENV || 'development'})`);
});
