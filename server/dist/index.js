"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const questions_1 = __importDefault(require("./routes/questions"));
const users_1 = __importDefault(require("./routes/users"));
const tags_1 = __importDefault(require("./routes/tags"));
const chat_1 = __importDefault(require("./routes/chat"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS configuration: allow localhost during dev and the frontend origin in PROD
const allowedOrigins = [];
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
    }
    catch (e) {
        // ignore invalid URL
    }
}
// Always allow localhost for local dev (including various ports)
allowedOrigins.push('http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000');
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like curl, mobile apps)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy: origin not allowed'));
    }
}));
// Log allowed origins so we can verify config on startup
console.log('CORS allowed origins:', allowedOrigins);
// Middleware
app.use(express_1.default.json());
// Import cache control middleware
const cacheControl_1 = require("./middleware/cacheControl");
// Apply cache control to all routes
app.use(cacheControl_1.setCacheControl);
// Serve uploaded files with cache control
app.use('/uploads', express_1.default.static('uploads', {
    maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days cache
    etag: true
}));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/questions', questions_1.default);
app.use('/api/users', users_1.default);
app.use('/api/tags', tags_1.default);
app.use('/api/chat', chat_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
