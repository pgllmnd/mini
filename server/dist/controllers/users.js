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
exports.avatarDebug = exports.testPrisma = exports.recomputeReputation = exports.getUserActivity = exports.updateProfile = exports.getProfile = exports.uploadAvatar = exports.getAllUsers = exports.avatarUploadMiddleware = void 0;
const prisma_1 = require("../lib/prisma");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Reputation constants (kept in sync with questions controller)
const REPUTATION = {
    UP_ANSWER: 10,
    UP_QUESTION: 5,
    ACCEPT_ANSWER: 15,
    ACCEPT_GIVER: 2,
    DOWN_POST: 2,
    DOWN_VOTER: 1,
};
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
        const formattedUsers = users.map((user) => ({
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
    var _a;
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'Missing user identifier' });
        console.log('Looking up user with id:', id);
        let user;
        // Prepare lookup key outside try so fallback code can reuse it if needed
        let lookup = null;
        try {
            // If the identifier looks like an email, prefer lookup by unique email.
            // Otherwise try id (UUID) or username. Using findUnique for unique fields
            // avoids ambiguous queries and is safer with strict schemas.
            if (id.includes('@')) {
                lookup = { email: id };
            }
            else if (isUuidV4(id)) {
                lookup = { id };
            }
            else {
                // username is unique in the Prisma schema
                lookup = { username: id };
            }
            // Log the lookup parameters
            console.log('Looking up user with:', lookup);
            user = yield prisma_1.prisma.user.findUnique({
                where: lookup,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    bio: true,
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
                            votes: { select: { id: true, type: true, createdAt: true, user: { select: { id: true, username: true } } } },
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
                            votes: { select: { id: true, type: true, createdAt: true, user: { select: { id: true, username: true } } } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    comments: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            question: { select: { id: true, title: true } },
                            answer: { select: { id: true, question: { select: { id: true, title: true } } } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
        }
        catch (pErr) {
            console.error('Prisma error in getProfile:', pErr);
            // Prisma P2022 = column does not exist in DB for this model
            if ((pErr === null || pErr === void 0 ? void 0 : pErr.code) === 'P2022') {
                // Try a minimal fallback query that only selects commonly-present columns
                try {
                    console.warn('Attempting minimal fallback query after P2022');
                    const minimal = yield prisma_1.prisma.user.findFirst({
                        where: lookup,
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            createdAt: true,
                            reputation: true,
                            avatar_url: true,
                        },
                    });
                    if (!minimal)
                        return res.status(404).json({ message: 'User not found' });
                    const fallbackReputation = typeof minimal.reputation === 'number' ? minimal.reputation : Number(minimal.reputation || 0);
                    console.warn(`getProfile fallback: user=${minimal.username} id=${minimal.id} reputation=${fallbackReputation}`);
                    return res.json({
                        id: minimal.id,
                        username: minimal.username,
                        email: minimal.email,
                        created_at: minimal.createdAt,
                        reputation: fallbackReputation,
                        avatar_url: minimal.avatar_url,
                        // Without questions/answers/bio available in this fallback
                        questions: [],
                        answers: [],
                    });
                }
                catch (fallbackErr) {
                    console.error('Fallback query failed:', fallbackErr);
                    return res.status(500).json({
                        message: 'Database schema mismatch and fallback failed. Run migrations to sync DB with prisma/schema.prisma.',
                        details: pErr.meta || null,
                    });
                }
            }
            return res.status(500).json({ message: 'Database error', details: pErr === null || pErr === void 0 ? void 0 : pErr.message });
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
        // Ensure reputation is a plain number (Prisma may return JS number but normalize for safety)
        const reputationNumber = typeof user.reputation === 'number' ? user.reputation : Number(user.reputation || 0);
        console.log(`getProfile: user=${user.username} id=${user.id} reputation=${reputationNumber}`);
        return res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            bio: (_a = user.bio) !== null && _a !== void 0 ? _a : null,
            created_at: user.createdAt,
            reputation: reputationNumber,
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
        const { username, avatar_url, bio } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Authentication required' });
        // If username change requested, ensure it's not already taken by another user
        if (username) {
            const existing = yield prisma_1.prisma.user.findUnique({ where: { username } });
            if (existing && existing.id !== userId) {
                return res.status(409).json({ message: 'USERNAME_TAKEN' });
            }
        }
        try {
            const dataToUpdate = {};
            if (typeof username === 'string' && username.trim())
                dataToUpdate.username = username.trim();
            if (typeof avatar_url === 'string')
                dataToUpdate.avatar_url = avatar_url;
            if (typeof bio === 'string')
                dataToUpdate.bio = bio;
            const updatedUser = yield prisma_1.prisma.user.update({
                where: { id: userId },
                data: dataToUpdate,
                select: { id: true, email: true, username: true, avatar_url: true, bio: true },
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
                            votes: { select: { id: true, type: true, createdAt: true, user: { select: { id: true, username: true } } } },
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
                            votes: { select: { id: true, type: true, createdAt: true, user: { select: { id: true, username: true } } } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    comments: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            question: { select: { id: true, title: true } },
                            answer: { select: { id: true, question: { select: { id: true, title: true } } } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    votes: {
                        select: {
                            id: true,
                            type: true,
                            questionId: true,
                            answerId: true,
                            createdAt: true,
                            question: { select: { id: true, title: true } },
                            answer: { select: { id: true, question: { select: { id: true, title: true } } } },
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return ({
                id: q.id,
                title: q.title,
                content: (_a = q.content) !== null && _a !== void 0 ? _a : '',
                created_at: q.createdAt,
                answer_count: (_c = (_b = q.answers) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0,
                upvotes: (_e = (_d = q.votes) === null || _d === void 0 ? void 0 : _d.filter((v) => v.type === 'UP').length) !== null && _e !== void 0 ? _e : 0,
                downvotes: (_g = (_f = q.votes) === null || _f === void 0 ? void 0 : _f.filter((v) => v.type === 'DOWN').length) !== null && _g !== void 0 ? _g : 0,
                votes_detail: (_j = (_h = q.votes) === null || _h === void 0 ? void 0 : _h.map((vt) => ({ id: vt.id, type: vt.type, created_at: vt.createdAt, by: vt.user }))) !== null && _j !== void 0 ? _j : [],
            });
        });
        const formattedAnswers = (userActivity.answers || []).map((a) => {
            var _a, _b, _c, _d, _e, _f, _g;
            return ({
                id: a.id,
                content: (_a = a.content) !== null && _a !== void 0 ? _a : '',
                question_id: a.question.id,
                question_title: a.question.title,
                created_at: a.createdAt,
                is_accepted: a.isAccepted,
                upvotes: (_c = (_b = a.votes) === null || _b === void 0 ? void 0 : _b.filter((v) => v.type === 'UP').length) !== null && _c !== void 0 ? _c : 0,
                downvotes: (_e = (_d = a.votes) === null || _d === void 0 ? void 0 : _d.filter((v) => v.type === 'DOWN').length) !== null && _e !== void 0 ? _e : 0,
                votes_detail: (_g = (_f = a.votes) === null || _f === void 0 ? void 0 : _f.map((vt) => ({ id: vt.id, type: vt.type, created_at: vt.createdAt, by: vt.user }))) !== null && _g !== void 0 ? _g : [],
            });
        });
        const formattedComments = (userActivity.comments || []).map((c) => {
            var _a, _b, _c, _d;
            return ({
                id: c.id,
                content: (_a = c.content) !== null && _a !== void 0 ? _a : '',
                created_at: c.createdAt,
                target_type: c.question ? 'question' : (c.answer ? 'answer' : 'unknown'),
                target_id: c.question ? c.question.id : (c.answer ? c.answer.id : null),
                target_title: c.question ? c.question.title : (c.answer ? (_c = (_b = c.answer.question) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : 'Answer' : 'Comment'),
                link: c.question ? `/questions/${c.question.id}` : (c.answer ? `/questions/${(_d = c.answer.question) === null || _d === void 0 ? void 0 : _d.id}` : '#'),
            });
        });
        // Votes that the user made
        const votes_made = (userActivity.votes || []).map((v) => {
            var _a, _b, _c, _d, _e, _f, _g;
            return ({
                id: v.id,
                type: v.type,
                target_type: v.questionId ? 'question' : (v.answerId ? 'answer' : 'unknown'),
                target_id: (_b = (_a = v.questionId) !== null && _a !== void 0 ? _a : v.answerId) !== null && _b !== void 0 ? _b : null,
                target_title: (_g = (_d = (_c = v.question) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : (_f = (_e = v.answer) === null || _e === void 0 ? void 0 : _e.question) === null || _f === void 0 ? void 0 : _f.title) !== null && _g !== void 0 ? _g : 'Post',
                created_at: v.createdAt,
            });
        });
        // Votes received on user's posts (flatten)
        const votes_received = [];
        (userActivity.questions || []).forEach((q) => {
            (q.votes || []).forEach((vt) => {
                votes_received.push({
                    id: vt.id,
                    type: vt.type,
                    post_type: 'question',
                    post_id: q.id,
                    post_title: q.title,
                    by: vt.user ? { id: vt.user.id, username: vt.user.username } : null,
                    created_at: vt.createdAt,
                });
            });
        });
        (userActivity.answers || []).forEach((a) => {
            (a.votes || []).forEach((vt) => {
                var _a, _b;
                votes_received.push({
                    id: vt.id,
                    type: vt.type,
                    post_type: 'answer',
                    post_id: a.id,
                    post_title: (_b = (_a = a.question) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : 'Answer',
                    by: vt.user ? { id: vt.user.id, username: vt.user.username } : null,
                    created_at: vt.createdAt,
                });
            });
        });
        return res.json({
            questions: formattedQuestions,
            answers: formattedAnswers,
            comments: formattedComments,
            votes_made,
            votes_received,
        });
    }
    catch (err) {
        console.error('Unhandled error in getUserActivity:', err);
        return res.status(500).json({ message: 'Server error', details: err.message });
    }
});
exports.getUserActivity = getUserActivity;
// Recompute reputation for a user from current votes/accepts in DB.
// This is a utility endpoint to fix reputation when past votes were added
// without updating reputation. It follows the same rules used elsewhere:
// UP on answers: +10, UP on questions: +5, DOWN on any post: -2 to post author,
// accepted answer: +15 to answer author, +2 to question author who accepts,
// voter penalty: -1 when a user downvotes an answer (penalty to voter).
const recomputeReputation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'Missing user identifier' });
        // Resolve lookup similar to getProfile: username or id
        const lookup = isUuidV4(id) ? { id } : { username: id };
        const user = yield prisma_1.prisma.user.findUnique({ where: lookup });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const userId = user.id;
        // Votes received on user's answers (exclude self-votes)
        const upAnswers = yield prisma_1.prisma.vote.count({ where: { type: 'UP', answer: { authorId: userId }, NOT: { userId: userId } } });
        const downAnswers = yield prisma_1.prisma.vote.count({ where: { type: 'DOWN', answer: { authorId: userId }, NOT: { userId: userId } } });
        // Votes received on user's questions (exclude self-votes)
        const upQuestions = yield prisma_1.prisma.vote.count({ where: { type: 'UP', question: { authorId: userId }, NOT: { userId: userId } } });
        const downQuestions = yield prisma_1.prisma.vote.count({ where: { type: 'DOWN', question: { authorId: userId }, NOT: { userId: userId } } });
        // Accepted answers authored by user
        const acceptedAnswers = yield prisma_1.prisma.answer.count({ where: { authorId: userId, isAccepted: true } });
        // Accepts given by user (question author accepted an answer authored by someone else)
        const acceptsGiven = yield prisma_1.prisma.answer.count({ where: { isAccepted: true, question: { authorId: userId }, NOT: { authorId: userId } } });
        // Downvotes made by user on answers (voter penalty)
        const downvotesMadeOnAnswers = yield prisma_1.prisma.vote.count({ where: { type: 'DOWN', userId: userId, answerId: { not: null } } });
        const reputation = upAnswers * REPUTATION.UP_ANSWER - downAnswers * REPUTATION.DOWN_POST +
            upQuestions * REPUTATION.UP_QUESTION - downQuestions * REPUTATION.DOWN_POST +
            acceptedAnswers * REPUTATION.ACCEPT_ANSWER + acceptsGiven * REPUTATION.ACCEPT_GIVER -
            downvotesMadeOnAnswers * REPUTATION.DOWN_VOTER;
        // Persist the computed reputation
        yield prisma_1.prisma.user.update({ where: { id: userId }, data: { reputation } });
        return res.json({ id: userId, username: user.username, reputation });
    }
    catch (err) {
        console.error('Error recomputing reputation:', err);
        return res.status(500).json({ message: 'Server error', details: err.message });
    }
});
exports.recomputeReputation = recomputeReputation;
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
