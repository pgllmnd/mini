import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { pool } from '../config/database';
import crypto from 'crypto';
export { 
  getAnswerComments,
  getQuestionComments,
  addAnswerComment,
  addQuestionComment
} from './comments';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Centralized reputation values — change here to tune site rules
const REPUTATION = {
  UP_ANSWER: 10,      // +10 when an answer is upvoted
  UP_QUESTION: 5,     // +5 when a question is upvoted
  ACCEPT_ANSWER: 15,  // +15 when an answer is accepted
  ACCEPT_GIVER: 2,    // +2 when the question author accepts an answer
  DOWN_POST: 2,       // -2 to post author when downvoted
  DOWN_VOTER: 1       // -1 penalty to voter when they downvote an answer
};

export const getQuestions = async (req: Request, res: Response) => {
  try {
    // Accept 'q' (used by the client SearchBar) or 'search' as the keyword param
    const { sort = 'newest' } = req.query;
    const rawSearch = (req.query as any).q ?? (req.query as any).search;
    // Persist initial request info for debugging
    try {
      const fs = await import('fs');
      fs.mkdirSync('tmp', { recursive: true });
      const startLine = `--- getQuestions request at ${new Date().toISOString()} ---\nSORT: ${String(sort)}\nRAW_SEARCH: ${String(rawSearch)}\n\n`;
      fs.appendFileSync('tmp/sql_error.log', startLine);
    } catch (_e) {
      // ignore file logging errors
    }
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

    const conditions: string[] = [];
    const values: any[] = [];
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

    // Persist the final SQL and parameter values
    try {
      const fs = await import('fs');
      const logLine = `--- getQuestions SQL at ${new Date().toISOString()} ---\nQUERY:\n${query}\nVALUES:${JSON.stringify(values)}\n\n`;
      fs.appendFileSync('tmp/sql_error.log', logLine);
    } catch (_e) {
      // ignore file logging errors
    }
    try {
      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (sqlErr: any) {
      // Persist SQL error for debugging
      try {
        const fs = await import('fs');
        const errLine = `--- SQL ERROR at ${new Date().toISOString()} ---\nERROR: ${String(sqlErr)}\nQUERY:\n${query}\nVALUES:${JSON.stringify(values)}\n\n`;
        fs.appendFileSync('tmp/sql_error.log', errLine);
      } catch (_e) {}
      console.error('SQL Error in getQuestions:', sqlErr);
      // If DB is unreachable, return an empty list (friendly fallback for local dev)
      if (String(sqlErr).includes('SSL/TLS required') || String(sqlErr).includes('ECONNRESET') || String(sqlErr).includes('connect')) {
        return res.json([]);
      }
      // In development, return the SQL error message to help debugging
      if (process.env.NODE_ENV !== 'production') {
        return res.status(500).json({ message: String(sqlErr) });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getQuestion = async (req: Request, res: Response) => {
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

    const questionResult = await pool.query(questionQuery, [id]);
    const answersResult = await pool.query(answersQuery, [id]);

    if (questionResult.rows.length === 0) {
      return res.status(404).json({
        message: `La question avec l'ID ${id} est introuvable. Elle a peut‑être été supprimée.`,
        code: 'QUESTION_NOT_FOUND',
        questionId: id
      });
    }

    res.json({
      ...questionResult.rows[0],
      answers: answersResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const client = await pool.connect();
  
  try {
    const { title, content, tags } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Start a transaction
    await client.query('BEGIN');

    // 1. Create the question
    const questionId = crypto.randomUUID();
    const questionResult = await client.query(
      `INSERT INTO "public"."questions" (
        id,
        title,
        content,
        author_id,
        created_at,
        updated_at,
        views
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0) 
      RETURNING *`,
      [questionId, title, content, userId]
    );

    // 2. Process tags
    if (Array.isArray(tags)) {
      for (const tagName of tags) {
        // 2.1 Get or create tag
        const tagResult = await client.query(
          `INSERT INTO "public"."tags" (id, name, created_at, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [crypto.randomUUID(), tagName]
        );

        const tagId = tagResult.rows[0].id;

        // 2.2 Create question-tag relationship
        await client.query(
          `INSERT INTO "public"."_QuestionToTag" ("A", "B")
           VALUES ($1, $2)
           ON CONFLICT ("A", "B") DO NOTHING`,
          [questionId, tagId]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch the complete question with tags
    const finalResult = await client.query(
      `SELECT q.*, 
        array_agg(CASE WHEN t.name IS NOT NULL THEN t.name END) FILTER (WHERE t.name IS NOT NULL) as tags,
        u.username as author_username
       FROM "public"."questions" q
       LEFT JOIN "public"."users" u ON q.author_id = u.id
       LEFT JOIN "public"."_QuestionToTag" qt ON q.id = qt."A"
       LEFT JOIN "public"."tags" t ON qt."B" = t.id
       WHERE q.id = $1
       GROUP BY q.id, q.title, q.content, q.created_at, q.updated_at, q.author_id, q.views, u.username`,
      [questionId]
    );

    res.status(201).json(finalResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating question:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const addAnswer = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id: questionId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    const answerId = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO "public"."answers" (id, content, author_id, question_id, created_at, updated_at, is_accepted) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false) RETURNING *',
      [answerId, content, userId, questionId]
    );

    const row = result.rows[0];
    // Normalize DB snake_case timestamps to camelCase for frontend
    const response = {
      ...row,
      createdAt: row.created_at ?? row.createdAt,
      updatedAt: row.updated_at ?? row.updatedAt,
      // keep existing snake_case for compatibility but provide camelCase
    };

    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const vote = async (req: AuthRequest, res: Response) => {
  try {
    const { voteType, targetType, targetId } = req.body;
    const userId = req.user?.id;

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

    // We'll perform vote insert/update/delete and corresponding reputation updates inside a transaction
    await pool.query('BEGIN');

    // helper to adjust reputation safely
    const adjustReputation = async (uid: string, delta: number) => {
      if (!uid) return;
      await pool.query('UPDATE "public"."users" SET reputation = reputation + $1 WHERE id = $2', [delta, uid]);
    };

    // get existing vote (if any)
    let existingVoteResult;
    if (targetType === 'question') {
      existingVoteResult = await pool.query('SELECT * FROM "public"."votes" WHERE user_id = $1 AND question_id = $2 AND answer_id IS NULL', [userId, targetId]);
    } else {
      existingVoteResult = await pool.query('SELECT * FROM "public"."votes" WHERE user_id = $1 AND answer_id = $2', [userId, targetId]);
    }

    // fetch target author id
    let targetAuthorId: string | null = null;
    if (targetType === 'question') {
      const qRes = await pool.query('SELECT author_id FROM "public"."questions" WHERE id = $1', [targetId]);
      targetAuthorId = qRes.rows[0] ? qRes.rows[0].author_id : null;
    } else {
      const aRes = await pool.query('SELECT author_id, question_id FROM "public"."answers" WHERE id = $1', [targetId]);
      targetAuthorId = aRes.rows[0] ? aRes.rows[0].author_id : null;
    }

    const voterId = userId as string;

    // reputation rules (from user):
    // UP on answer: +10 to answer author
    // UP on question: +5 to question author
    // DOWN on any post: -2 to post author
    // Voter penalty: -1 when user downvotes an answer

    const applyVoteEffect = async (vt: string, tType: string, tAuthor: string | null, voter: string | null, sign = 1) => {
      // sign = 1 apply; sign = -1 revert
      if (!tAuthor) return;
      if (tAuthor === voter) return; // don't change reputation for self-votes

        if (vt === 'UP') {
          if (tType === 'answer') await adjustReputation(tAuthor, REPUTATION.UP_ANSWER * sign);
          else await adjustReputation(tAuthor, REPUTATION.UP_QUESTION * sign);
        } else if (vt === 'DOWN') {
          await adjustReputation(tAuthor, -REPUTATION.DOWN_POST * sign);
          // voter penalty for downvoting answers only
          if (tType === 'answer' && voter) {
            await adjustReputation(voter, -REPUTATION.DOWN_VOTER * sign);
          }
        }
    };

    if (existingVoteResult.rows.length > 0) {
      const existing = existingVoteResult.rows[0];
      const existingType = existing.type;
      if (existingType === normalizedVoteType) {
        // remove vote -> revert its effect
        // delete vote
        await pool.query('DELETE FROM "public"."votes" WHERE id = $1', [existing.id]);
        await applyVoteEffect(existingType, targetType, targetAuthorId, voterId, -1);
      } else {
        // switch vote type: revert old, apply new, and update row
        await pool.query('UPDATE "public"."votes" SET type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [normalizedVoteType, existing.id]);
        await applyVoteEffect(existingType, targetType, targetAuthorId, voterId, -1);
        await applyVoteEffect(normalizedVoteType, targetType, targetAuthorId, voterId, 1);
      }
    } else {
      // create new vote and apply effect
      const voteId = crypto.randomUUID();
      if (targetType === 'question') {
        await pool.query('INSERT INTO "public"."votes" (id, type, question_id, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [voteId, normalizedVoteType, targetId, userId]);
      } else {
        await pool.query('INSERT INTO "public"."votes" (id, type, answer_id, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [voteId, normalizedVoteType, targetId, userId]);
      }
      await applyVoteEffect(normalizedVoteType, targetType, targetAuthorId, voterId, 1);
    }

    await pool.query('COMMIT');
    res.json({ message: 'Vote recorded successfully' });
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch (_) {}
    console.error('vote handler error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const acceptAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId, answerId } = req.params;
    const userId = req.user?.id;

    // Check if user is question author
    const question = await pool.query(
      'SELECT author_id FROM "public"."questions" WHERE id = $1',
      [questionId]
    );

    if (question.rows[0].author_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // We'll perform acceptance and reputation updates in a transaction
    await pool.query('BEGIN');

    // find existing accepted answer (if any)
    const prevRes = await pool.query('SELECT id, author_id FROM "public"."answers" WHERE question_id = $1 AND is_accepted = true', [questionId]);
    const prev = prevRes.rows[0];

    // if there's a previous accepted and it's the same as the requested, nothing to do
    if (prev && prev.id === answerId) {
      await pool.query('COMMIT');
      return res.json({ message: 'Answer already accepted' });
    }

    // unset previous accepted and revert reputation if needed
    if (prev) {
      await pool.query('UPDATE "public"."answers" SET is_accepted = false WHERE id = $1', [prev.id]);
      // revert ACCEPT_ANSWER from previous answer author (if different from question author)
      if (prev.author_id && prev.author_id !== userId) {
        await pool.query('UPDATE "public"."users" SET reputation = reputation - $1 WHERE id = $2', [REPUTATION.ACCEPT_ANSWER, prev.author_id]);
      }
    }

    // accept new answer
    await pool.query('UPDATE "public"."answers" SET is_accepted = true WHERE id = $1', [answerId]);

    // give +15 to answer author (unless self-accept)
    const aRes = await pool.query('SELECT author_id FROM "public"."answers" WHERE id = $1', [answerId]);
    const answerAuthor = aRes.rows[0] ? aRes.rows[0].author_id : null;
    if (answerAuthor && answerAuthor !== userId) {
      await pool.query('UPDATE "public"."users" SET reputation = reputation + $1 WHERE id = $2', [REPUTATION.ACCEPT_ANSWER, answerAuthor]);
    }

    // if there was no previous accepted answer, reward the question author +2 for accepting
    if (!prev) {
      await pool.query('UPDATE "public"."users" SET reputation = reputation + $1 WHERE id = $2', [REPUTATION.ACCEPT_GIVER, userId]);
    }

    await pool.query('COMMIT');
    res.json({ message: 'Answer accepted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};