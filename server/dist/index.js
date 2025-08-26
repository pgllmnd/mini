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
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve uploaded files
app.use('/uploads', express_1.default.static('uploads'));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/questions', questions_1.default);
app.use('/api/users', users_1.default);
app.use('/api/tags', tags_1.default);
app.use('/api/chat', chat_1.default);
// Lightweight healthcheck
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
