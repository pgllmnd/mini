"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarDebug = exports.testPrisma = exports.getUserActivity = exports.updateProfile = exports.getProfile = exports.uploadAvatar = exports.getAllUsers = exports.avatarUploadMiddleware = void 0;
const prisma_1 = require("../lib/prisma");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure multer for file upload
const avatarsDir = path_1.default.join(process.cwd(), 'uploads', 'avatars');
if (!fs_1.default.existsSync(avatarsDir)) {
    fs_1.default.mkdirSync(avatarsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, avatarsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    }
});
// File filter to only allow image files
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed!'));
    }
};
const uploadMiddleware = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
// Export multer middleware
exports.avatarUploadMiddleware = uploadMiddleware.single('avatar');
// Get all users
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                reputation: true,
                _count: {
                    select: {
                        questions: true,
                        answers: true,
                    },
                },
            },
        });
        // Format response
        const formattedUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            reputation: user.reputation,
            questionCount: user._count.questions,
            answerCount: user._count.answers,
        }));
        res.json(formattedUsers);
    }
    catch (err) {
        console.error('Error getting all users:', err);
        res.status(500).json({ error: 'Error fetching users' });
    }
});
exports.getAllUsers = getAllUsers;
// Upload avatar handler
const uploadAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('Upload request received:', { user: req.user, file: req.file });
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        console.log('Updating user with avatar URL:', avatarUrl);
        try {
            const updatedUser = yield prisma_1.prisma.user.update({
                where: { id: req.user.id },
                data: { avatar_url: avatarUrl },
                select: {
                    id: true,
                    username: true,
                    avatar_url: true
                }
            });
            console.log('User updated successfully:', updatedUser);
            return res.json({
                message: 'Avatar updated successfully',
                avatarUrl,
                user: updatedUser
            });
        }
        catch (dbError) {
            console.error('Database error while updating user:', dbError);
            return res.status(500).json({ message: 'Error updating user in database' });
        }
    }
    catch (error) {
        console.error('Error in uploadAvatar:', error);
        return res.status(500).json({ message: 'Server error during upload' });
    }
});
exports.uploadAvatar = uploadAvatar;
// Utility to detect UUID v4-like strings (keeps existing behavior)
const isUuidV4 = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'Missing user identifier' });
        console.log('Looking up user with id:', id);
        let user;
        try {
            user = yield prisma_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { id },
                        { username: id }
                    ]
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    createdAt: true,
                    reputation: true,
                    avatar_url: true,
                    questions: {
                        select: {
                            id: true,
                            title: true,
                            content: true,
                            createdAt: true,
                            answers: { select: { id: true } },
                            votes: { select: { type: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    answers: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            isAccepted: true,
                            question: { select: { id: true, title: true } },
                            votes: { select: { type: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
        }
        catch (pErr) {
            console.error('Prisma error in getProfile:', pErr);
            return res.status(500).json({ message: 'Database error', details: pErr.message });
        }
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const formattedQuestions = (user.questions || []).map((q) => {
            var _a, _b, _c, _d, _e, _f, _g;
            return ({
                id: q.id,
                title: q.title,
                content: (_a = q.content) !== null && _a !== void 0 ? _a : '',
                created_at: q.createdAt,
                answer_count: (_c = (_b = q.answers) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0,
                upvotes: (_e = (_d = q.votes) === null || _d === void 0 ? void 0 : _d.filter((v) => v.type === 'UP').length) !== null && _e !== void 0 ? _e : 0,
                downvotes: (_g = (_f = q.votes) === null || _f === void 0 ? void 0 : _f.filter((v) => v.type === 'DOWN').length) !== null && _g !== void 0 ? _g : 0,
            });
        });
        const formattedAnswers = (user.answers || []).map((a) => {
            var _a, _b, _c, _d, _e;
            return ({
                id: a.id,
                content: (_a = a.content) !== null && _a !== void 0 ? _a : '',
                question_id: a.question.id,
                question_title: a.question.title,
                created_at: a.createdAt,
                is_accepted: a.isAccepted,
                upvotes: (_c = (_b = a.votes) === null || _b === void 0 ? void 0 : _b.filter((v) => v.type === 'UP').length) !== null && _c !== void 0 ? _c : 0,
                downvotes: (_e = (_d = a.votes) === null || _d === void 0 ? void 0 : _d.filter((v) => v.type === 'DOWN').length) !== null && _e !== void 0 ? _e : 0,
            });
        });
        return res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.createdAt,
            reputation: user.reputation,
            avatar_url: user.avatar_url,
            questions: formattedQuestions,
            answers: formattedAnswers,
        });
    }
    catch (err) {
        console.error('Unhandled error in getProfile:', err);
        return res.status(500).json({ message: 'Server error', details: err.message });
    }
});
exports.getProfile = getProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username, avatar_url } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Authentication required' });
        try {
            const updatedUser = yield prisma_1.prisma.user.update({
                where: { id: userId },
                data: { username, avatar_url },
                select: { id: true, email: true, username: true, avatar_url: true },
            });
            return res.json(updatedUser);
        }
        catch (pErr) {
            console.error('Prisma error in updateProfile:', pErr);
            return res.status(500).json({ message: 'Database error', details: pErr.message });
        }
    }
    catch (err) {
        console.error('Unhandled error in updateProfile:', err);
        return res.status(500).json({ message: 'Server error', details: err.message });
    }
});
exports.updateProfile = updateProfile;
const getUserActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'Missing user identifier' });
        const lookupBy = isUuidV4(id) ? { id } : { username: id };
        let userActivity;
        try {
            userActivity = yield prisma_1.prisma.user.findUnique({
                where: lookupBy,
                select: {
                    questions: {
                        select: {
                            id: true,
                            title: true,
                            content: true,
                            createdAt: true,
                            answers: { select: { id: true } },
                            votes: { select: { type: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    answers: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            isAccepted: true,
                            question: { select: { id: true, title: true } },
                            votes: { select: { type: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
        }
        catch (pErr) {
            console.error('Prisma error in getUserActivity:', pErr);
            return res.status(500).json({ message: 'Database error', details: pErr.message });
        }
        if (!userActivity)
            return res.status(404).json({ message: 'User not found' });
        const formattedQuestions = (userActivity.questions || []).map((q) => {
            var _a, _b, _c, _d, _e, _f, _g;
            return ({
                id: q.id,
                title: q.title,
                content: (_a = q.content) !== null && _a !== void 0 ? _a : '',
                created_at: q.createdAt,
                answer_count: (_c = (_b = q.answers) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0,
                upvotes: (_e = (_d = q.votes) === null || _d === void 0 ? void 0 : _d.filter((v) => v.type === 'UP').length) !== null && _e !== void 0 ? _e : 0,
                downvotes: (_g = (_f = q.votes) === null || _f === void 0 ? void 0 : _f.filter((v) => v.type === 'DOWN').length) !== null && _g !== void 0 ? _g : 0,
            });
        });
        const formattedAnswers = (userActivity.answers || []).map((a) => {
            var _a, _b, _c, _d, _e;
            return ({
                id: a.id,
                content: (_a = a.content) !== null && _a !== void 0 ? _a : '',
                question_id: a.question.id,
                question_title: a.question.title,
                created_at: a.createdAt,
                is_accepted: a.isAccepted,
                upvotes: (_c = (_b = a.votes) === null || _b === void 0 ? void 0 : _b.filter((v) => v.type === 'UP').length) !== null && _c !== void 0 ? _c : 0,
                downvotes: (_e = (_d = a.votes) === null || _d === void 0 ? void 0 : _d.filter((v) => v.type === 'DOWN').length) !== null && _e !== void 0 ? _e : 0,
            });
        });
        return res.json({ questions: formattedQuestions, answers: formattedAnswers });
    }
    catch (err) {
        console.error('Unhandled error in getUserActivity:', err);
        return res.status(500).json({ message: 'Server error', details: err.message });
    }
});
exports.getUserActivity = getUserActivity;
// Temporary: verify Prisma connectivity and simple query
const testPrisma = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findFirst({ select: { id: true, username: true } });
        return res.json({ ok: true, user });
    }
    catch (err) {
        console.error('testPrisma error:', err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});
exports.testPrisma = testPrisma;
// Debug handler for avatar upload
const avatarDebug = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: { avatar_url: avatarUrl },
            select: {
                id: true,
                username: true,
                avatar_url: true
            }
        });
        res.json({ message: 'Avatar updated successfully', user: updatedUser });
    }
    catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ message: 'Error updating avatar' });
    }
});
exports.avatarDebug = avatarDebug;
// Note: avatarDebug handler moved above to avoid duplication
