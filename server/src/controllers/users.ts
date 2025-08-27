import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Configure multer for file upload
const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Export multer middleware
export const avatarUploadMiddleware = uploadMiddleware.single('avatar');

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (err) {
    console.error('Error getting all users:', err);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

// Upload avatar handler
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Upload request received:', { user: req.user, file: req.file });
    
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('Updating user with avatar URL:', avatarUrl);

    try {
      const updatedUser = await prisma.user.update({
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
    } catch (dbError) {
      console.error('Database error while updating user:', dbError);
      return res.status(500).json({ message: 'Error updating user in database' });
    }
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    return res.status(500).json({ message: 'Server error during upload' });
  }
};

// Helpers for typing the Prisma results
interface QuestionRel {
  id: string;
  title: string;
  content?: string | null;
  createdAt: Date;
  answers: { id: string }[];
  votes: { type: 'UP' | 'DOWN' }[];
}

interface AnswerRel {
  id: string;
  content?: string | null;
  createdAt: Date;
  isAccepted: boolean;
  question: { id: string; title: string };
  votes: { type: 'UP' | 'DOWN' }[];
}

// Utility to detect UUID v4-like strings (keeps existing behavior)
const isUuidV4 = (s?: string) =>
  typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: 'Missing user identifier' });

    console.log('Looking up user with id:', id);
    
    let user;
    // Prepare lookup key outside try so fallback code can reuse it if needed
    let lookup: Record<string, string> | null = null;
    try {
      // If the identifier looks like an email, prefer lookup by unique email.
      // Otherwise try id (UUID) or username. Using findUnique for unique fields
      // avoids ambiguous queries and is safer with strict schemas.
      if (id.includes('@')) {
        lookup = { email: id };
      } else if (isUuidV4(id)) {
        lookup = { id };
      } else {
        // username is unique in the Prisma schema
        lookup = { username: id };
      }

      // Log the lookup parameters
      console.log('Looking up user with:', lookup);

      user = await prisma.user.findUnique({
        where: lookup as any,
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
    } catch (pErr: any) {
      console.error('Prisma error in getProfile:', pErr);
      // Prisma P2022 = column does not exist in DB for this model
      if (pErr?.code === 'P2022') {
        // Try a minimal fallback query that only selects commonly-present columns
        try {
          console.warn('Attempting minimal fallback query after P2022');
          const minimal = await prisma.user.findFirst({
            where: lookup as any,
            select: {
              id: true,
              username: true,
              email: true,
              createdAt: true,
              reputation: true,
              avatar_url: true,
            },
          });

          if (!minimal) return res.status(404).json({ message: 'User not found' });

          return res.json({
            id: minimal.id,
            username: minimal.username,
            email: minimal.email,
            created_at: minimal.createdAt,
            reputation: minimal.reputation,
            avatar_url: minimal.avatar_url,
            // Without questions/answers/bio available in this fallback
            questions: [],
            answers: [],
          });
        } catch (fallbackErr) {
          console.error('Fallback query failed:', fallbackErr);
          return res.status(500).json({
            message: 'Database schema mismatch and fallback failed. Run migrations to sync DB with prisma/schema.prisma.',
            details: pErr.meta || null,
          });
        }
      }
      return res.status(500).json({ message: 'Database error', details: pErr?.message });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    const formattedQuestions = (user.questions || []).map((q: QuestionRel) => ({
      id: q.id,
      title: q.title,
      content: q.content ?? '',
      created_at: q.createdAt,
      answer_count: q.answers?.length ?? 0,
      upvotes: q.votes?.filter((v) => v.type === 'UP').length ?? 0,
      downvotes: q.votes?.filter((v) => v.type === 'DOWN').length ?? 0,
    }));

    const formattedAnswers = (user.answers || []).map((a: AnswerRel) => ({
      id: a.id,
      content: a.content ?? '',
      question_id: a.question.id,
      question_title: a.question.title,
      created_at: a.createdAt,
      is_accepted: a.isAccepted,
      upvotes: a.votes?.filter((v) => v.type === 'UP').length ?? 0,
      downvotes: a.votes?.filter((v) => v.type === 'DOWN').length ?? 0,
    }));

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: (user as any).bio ?? null,
      created_at: user.createdAt,
      reputation: user.reputation,
      avatar_url: user.avatar_url,
      questions: formattedQuestions,
      answers: formattedAnswers,
    });
  } catch (err) {
    console.error('Unhandled error in getProfile:', err);
    return res.status(500).json({ message: 'Server error', details: (err as Error).message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
  const { username, avatar_url, bio } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    // If username change requested, ensure it's not already taken by another user
    if (username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== userId) {
        return res.status(409).json({ message: 'USERNAME_TAKEN' });
      }
    }

    try {
      const dataToUpdate: any = {};
      if (typeof username === 'string' && username.trim()) dataToUpdate.username = username.trim();
      if (typeof avatar_url === 'string') dataToUpdate.avatar_url = avatar_url;
      if (typeof bio === 'string') dataToUpdate.bio = bio;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: { id: true, email: true, username: true, avatar_url: true, bio: true },
      });

      return res.json(updatedUser);
    } catch (pErr) {
      console.error('Prisma error in updateProfile:', pErr);
      return res.status(500).json({ message: 'Database error', details: (pErr as Error).message });
    }
  } catch (err) {
    console.error('Unhandled error in updateProfile:', err);
    return res.status(500).json({ message: 'Server error', details: (err as Error).message });
  }
};

export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Missing user identifier' });

    const lookupBy = isUuidV4(id) ? { id } : { username: id };

    let userActivity;
    try {
      userActivity = await prisma.user.findUnique({
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
    } catch (pErr) {
      console.error('Prisma error in getUserActivity:', pErr);
      return res.status(500).json({ message: 'Database error', details: (pErr as Error).message });
    }

    if (!userActivity) return res.status(404).json({ message: 'User not found' });

    const formattedQuestions = (userActivity.questions || []).map((q: any) => ({
      id: q.id,
      title: q.title,
      content: q.content ?? '',
      created_at: q.createdAt,
      answer_count: q.answers?.length ?? 0,
      upvotes: q.votes?.filter((v: any) => v.type === 'UP').length ?? 0,
      downvotes: q.votes?.filter((v: any) => v.type === 'DOWN').length ?? 0,
      votes_detail: q.votes?.map((vt: any) => ({ id: vt.id, type: vt.type, created_at: vt.createdAt, by: vt.user })) ?? [],
    }));

    const formattedAnswers = (userActivity.answers || []).map((a: any) => ({
      id: a.id,
      content: a.content ?? '',
      question_id: a.question.id,
      question_title: a.question.title,
      created_at: a.createdAt,
      is_accepted: a.isAccepted,
      upvotes: a.votes?.filter((v: any) => v.type === 'UP').length ?? 0,
      downvotes: a.votes?.filter((v: any) => v.type === 'DOWN').length ?? 0,
      votes_detail: a.votes?.map((vt: any) => ({ id: vt.id, type: vt.type, created_at: vt.createdAt, by: vt.user })) ?? [],
    }));

    const formattedComments = (userActivity.comments || []).map((c: any) => ({
      id: c.id,
      content: c.content ?? '',
      created_at: c.createdAt,
      target_type: c.question ? 'question' : (c.answer ? 'answer' : 'unknown'),
      target_id: c.question ? c.question.id : (c.answer ? c.answer.id : null),
      target_title: c.question ? c.question.title : (c.answer ? c.answer.question?.title ?? 'Answer' : 'Comment'),
      link: c.question ? `/questions/${c.question.id}` : (c.answer ? `/questions/${c.answer.question?.id}` : '#'),
    }));

    // Votes that the user made
    const votes_made = (userActivity.votes || []).map((v: any) => ({
      id: v.id,
      type: v.type,
      target_type: v.questionId ? 'question' : (v.answerId ? 'answer' : 'unknown'),
      target_id: v.questionId ?? v.answerId ?? null,
      target_title: v.question?.title ?? v.answer?.question?.title ?? 'Post',
      created_at: v.createdAt,
    }));

    // Votes received on user's posts (flatten)
    const votes_received: any[] = [];
    (userActivity.questions || []).forEach((q: any) => {
      (q.votes || []).forEach((vt: any) => {
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
    (userActivity.answers || []).forEach((a: any) => {
      (a.votes || []).forEach((vt: any) => {
        votes_received.push({
          id: vt.id,
          type: vt.type,
          post_type: 'answer',
          post_id: a.id,
          post_title: a.question?.title ?? 'Answer',
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
  } catch (err) {
    console.error('Unhandled error in getUserActivity:', err);
    return res.status(500).json({ message: 'Server error', details: (err as Error).message });
  }
};

// Temporary: verify Prisma connectivity and simple query
export const testPrisma = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst({ select: { id: true, username: true } });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error('testPrisma error:', err);
    return res.status(500).json({ ok: false, error: (err as Error).message });
  }
};

// Debug handler for avatar upload
export const avatarDebug = async (
  req: AuthRequest & { file?: Express.Multer.File },
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar_url: avatarUrl },
      select: {
        id: true,
        username: true,
        avatar_url: true
      }
    });

    res.json({ message: 'Avatar updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Error updating avatar' });
  }
};

// Note: avatarDebug handler moved above to avoid duplication
