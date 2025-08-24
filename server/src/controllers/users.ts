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
    try {
      user = await prisma.user.findFirst({
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
    } catch (pErr) {
      console.error('Prisma error in getProfile:', pErr);
      return res.status(500).json({ message: 'Database error', details: (pErr as Error).message });
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
    const { username, avatar_url } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { username, avatar_url },
        select: { id: true, email: true, username: true, avatar_url: true },
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
    } catch (pErr) {
      console.error('Prisma error in getUserActivity:', pErr);
      return res.status(500).json({ message: 'Database error', details: (pErr as Error).message });
    }

    if (!userActivity) return res.status(404).json({ message: 'User not found' });

    const formattedQuestions = (userActivity.questions || []).map((q: QuestionRel) => ({
      id: q.id,
      title: q.title,
      content: q.content ?? '',
      created_at: q.createdAt,
      answer_count: q.answers?.length ?? 0,
      upvotes: q.votes?.filter((v) => v.type === 'UP').length ?? 0,
      downvotes: q.votes?.filter((v) => v.type === 'DOWN').length ?? 0,
    }));

    const formattedAnswers = (userActivity.answers || []).map((a: AnswerRel) => ({
      id: a.id,
      content: a.content ?? '',
      question_id: a.question.id,
      question_title: a.question.title,
      created_at: a.createdAt,
      is_accepted: a.isAccepted,
      upvotes: a.votes?.filter((v) => v.type === 'UP').length ?? 0,
      downvotes: a.votes?.filter((v) => v.type === 'DOWN').length ?? 0,
    }));

    return res.json({ questions: formattedQuestions, answers: formattedAnswers });
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
