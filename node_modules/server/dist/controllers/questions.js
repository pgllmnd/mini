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
exports.acceptAnswer = exports.vote = exports.addAnswer = exports.createQuestion = exports.getQuestion = exports.getQuestions = exports.addQuestionComment = exports.addAnswerComment = exports.getQuestionComments = exports.getAnswerComments = void 0;
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const crypto_1 = __importDefault(require("crypto"));
var comments_1 = require("./comments");
Object.defineProperty(exports, "getAnswerComments", { enumerable: true, get: function () { return comments_1.getAnswerComments; } });
Object.defineProperty(exports, "getQuestionComments", { enumerable: true, get: function () { return comments_1.getQuestionComments; } });
Object.defineProperty(exports, "addAnswerComment", { enumerable: true, get: function () { return comments_1.addAnswerComment; } });
Object.defineProperty(exports, "addQuestionComment", { enumerable: true, get: function () { return comments_1.addQuestionComment; } });
const getQuestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Accept 'q' (used by the client SearchBar) or 'search' as the keyword param
        const { sort = 'newest' } = req.query;
        const rawSearch = (_a = req.query.q) !== null && _a !== void 0 ? _a : req.query.search;
        let query = `
      SELECT 
        q.*,
        u.username as author_username,
        COUNT(DISTINCT a.id) as answer_count,
        COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'UP') as upvotes,
        COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'DOWN') as downvotes,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM "public"."questions" q
      LEFT JOIN "public"."users" u ON q.author_id = u.id
      LEFT JOIN "public"."answers" a ON q.id = a.question_id
      LEFT JOIN "public"."votes" v ON q.id = v.question_id
      LEFT JOIN "public"."_QuestionToTag" qt ON q.id = qt."A"
      LEFT JOIN "public"."tags" t ON qt."B" = t.id
    `;
        const conditions = [];
        const values = [];
        let valueIndex = 1;
        // Keyword search: split the search string into terms and require each
        // term to appear in either the title OR the content (AND across terms).
        // This provides more accurate keyword matching than a single LIKE with
        // the whole phrase. We keep parameterized values to avoid SQL injection.
        if (rawSearch && typeof rawSearch === 'string' && rawSearch.trim().length > 0) {
            const terms = rawSearch.trim().split(/\s+/);
            for (const term of terms) {
                const idx = valueIndex;
                conditions.push(`(q.title ILIKE $${idx} OR q.content ILIKE $${idx})`);
                values.push(`%${term}%`);
                valueIndex++;
            }
        }
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        query += ` GROUP BY q.id, q.title, q.content, q.created_at, q.updated_at, q.author_id, q.views, u.username`;
        switch (sort) {
            case 'votes':
                query += ` ORDER BY (COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'UP') - 
                           COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'DOWN')) DESC`;
                break;
            case 'answers':
                query += ` ORDER BY answer_count DESC`;
                break;
            case 'newest':
            default:
                query += ` ORDER BY q.created_at DESC`;
        }
        const result = yield database_1.pool.query(query, values);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getQuestions = getQuestions;
const getQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const questionQuery = `
      SELECT 
        q.*,
        u.username as author_username,
        COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'UP') as upvotes,
        COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'DOWN') as downvotes,
        array_agg(CASE WHEN t.name IS NOT NULL THEN t.name END) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM "public"."questions" q
      LEFT JOIN "public"."users" u ON q.author_id = u.id
      LEFT JOIN "public"."votes" v ON q.id = v.question_id
      LEFT JOIN "public"."_QuestionToTag" qt ON q.id = qt."A"
      LEFT JOIN "public"."tags" t ON qt."B" = t.id
      WHERE q.id = $1
      GROUP BY q.id, q.title, q.content, q.created_at, q.updated_at, q.author_id, q.views, u.username
    `;
        const answersQuery = `
      SELECT 
        a.*,
        u.username as author_username,
        COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'UP') as upvotes,
        COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'DOWN') as downvotes
      FROM "public"."answers" a
      LEFT JOIN "public"."users" u ON a.author_id = u.id
      LEFT JOIN "public"."votes" v ON a.id = v.answer_id
      WHERE a.question_id = $1
      GROUP BY a.id, a.content, a.created_at, a.updated_at, a.author_id, a.question_id, a.is_accepted, u.username
      ORDER BY a.is_accepted DESC, 
        (COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'UP') - 
         COUNT(DISTINCT v.id) FILTER (WHERE v.type = 'DOWN')) DESC,
        a.created_at DESC
    `;
        const questionResult = yield database_1.pool.query(questionQuery, [id]);
        const answersResult = yield database_1.pool.query(answersQuery, [id]);
        if (questionResult.rows.length === 0) {
            return res.status(404).json({
                message: `La question avec l'ID ${id} est introuvable. Elle a peut‑être été supprimée.`,
                code: 'QUESTION_NOT_FOUND',
                questionId: id
            });
        }
        res.json(Object.assign(Object.assign({}, questionResult.rows[0]), { answers: answersResult.rows }));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getQuestion = getQuestion;
const createQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const client = yield database_1.pool.connect();
    try {
        const { title, content, tags } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        // Start a transaction
        yield client.query('BEGIN');
        // 1. Create the question
        const questionId = crypto_1.default.randomUUID();
        const questionResult = yield client.query(`INSERT INTO "public"."questions" (
        id,
        title,
        content,
        author_id,
        created_at,
        updated_at,
        views
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0) 
      RETURNING *`, [questionId, title, content, userId]);
        // 2. Process tags
        if (Array.isArray(tags)) {
            for (const tagName of tags) {
                // 2.1 Get or create tag
                const tagResult = yield client.query(`INSERT INTO "public"."tags" (id, name, created_at, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`, [crypto_1.default.randomUUID(), tagName]);
                const tagId = tagResult.rows[0].id;
                // 2.2 Create question-tag relationship
                yield client.query(`INSERT INTO "public"."_QuestionToTag" ("A", "B")
           VALUES ($1, $2)
           ON CONFLICT ("A", "B") DO NOTHING`, [questionId, tagId]);
            }
        }
        yield client.query('COMMIT');
        // Fetch the complete question with tags
        const finalResult = yield client.query(`SELECT q.*, 
        array_agg(CASE WHEN t.name IS NOT NULL THEN t.name END) FILTER (WHERE t.name IS NOT NULL) as tags,
        u.username as author_username
       FROM "public"."questions" q
       LEFT JOIN "public"."users" u ON q.author_id = u.id
       LEFT JOIN "public"."_QuestionToTag" qt ON q.id = qt."A"
       LEFT JOIN "public"."tags" t ON qt."B" = t.id
       WHERE q.id = $1
       GROUP BY q.id, q.title, q.content, q.created_at, q.updated_at, q.author_id, q.views, u.username`, [questionId]);
        res.status(201).json(finalResult.rows[0]);
    }
    catch (err) {
        yield client.query('ROLLBACK');
        console.error('Error creating question:', err);
        res.status(500).json({ message: 'Server error' });
    }
    finally {
        client.release();
    }
});
exports.createQuestion = createQuestion;
const addAnswer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { id: questionId } = req.params;
        const { content } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const answerId = crypto_1.default.randomUUID();
        const result = yield database_1.pool.query('INSERT INTO "public"."answers" (id, content, author_id, question_id, created_at, updated_at, is_accepted) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false) RETURNING *', [answerId, content, userId, questionId]);
        const row = result.rows[0];
        // Normalize DB snake_case timestamps to camelCase for frontend
        const response = Object.assign(Object.assign({}, row), { createdAt: (_b = row.created_at) !== null && _b !== void 0 ? _b : row.createdAt, updatedAt: (_c = row.updated_at) !== null && _c !== void 0 ? _c : row.updatedAt });
        res.status(201).json(response);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.addAnswer = addAnswer;
const vote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { voteType, targetType, targetId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Validate vote type
        const normalizedVoteType = voteType.toUpperCase();
        if (normalizedVoteType !== 'UP' && normalizedVoteType !== 'DOWN') {
            return res.status(400).json({ message: 'Invalid vote type. Must be UP or DOWN.' });
        }
        // Validate target type
        if (targetType !== 'question' && targetType !== 'answer') {
            return res.status(400).json({ message: 'Invalid target type. Must be question or answer.' });
        }
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        // Check if vote already exists
        let existingVoteQuery;
        if (targetType === 'question') {
            existingVoteQuery = yield database_1.pool.query('SELECT * FROM "public"."votes" WHERE user_id = $1 AND question_id = $2 AND answer_id IS NULL', [userId, targetId]);
        }
        else {
            existingVoteQuery = yield database_1.pool.query('SELECT * FROM "public"."votes" WHERE user_id = $1 AND answer_id = $2', [userId, targetId]);
        }
        if (existingVoteQuery.rows.length > 0) {
            if (existingVoteQuery.rows[0].type === normalizedVoteType) {
                // Remove vote if same type
                yield database_1.pool.query('DELETE FROM "public"."votes" WHERE id = $1', [existingVoteQuery.rows[0].id]);
            }
            else {
                // Update vote if different type
                yield database_1.pool.query('UPDATE "public"."votes" SET type = $1 WHERE id = $2', [normalizedVoteType, existingVoteQuery.rows[0].id]);
            }
        }
        else {
            // Create new vote
            const voteId = crypto_1.default.randomUUID();
            if (targetType === 'question') {
                yield database_1.pool.query('INSERT INTO "public"."votes" (id, type, question_id, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [voteId, normalizedVoteType, targetId, userId]);
            }
            else {
                yield database_1.pool.query('INSERT INTO "public"."votes" (id, type, answer_id, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [voteId, normalizedVoteType, targetId, userId]);
            }
        }
        res.json({ message: 'Vote recorded successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.vote = vote;
const acceptAnswer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { questionId, answerId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Check if user is question author
        const question = yield database_1.pool.query('SELECT author_id FROM "public"."questions" WHERE id = $1', [questionId]);
        if (question.rows[0].author_id !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        // Remove any previously accepted answer
        yield database_1.pool.query('UPDATE "public"."answers" SET is_accepted = false WHERE question_id = $1', [questionId]);
        // Accept the new answer
        yield database_1.pool.query('UPDATE "public"."answers" SET is_accepted = true WHERE id = $1', [answerId]);
        res.json({ message: 'Answer accepted successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.acceptAnswer = acceptAnswer;
