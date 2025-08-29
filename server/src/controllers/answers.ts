import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { createNotification } from './notifications';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const addAnswer = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get question details including author
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        author: true
      }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Create the answer
    const answer = await prisma.answer.create({
      data: {
        content,
        author: { connect: { id: userId } },
        question: { connect: { id: questionId } }
      },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    });

    // Create notification for question author
    if (question.authorId !== userId) {
      await createNotification(
        question.authorId, // userId (recipient)
        userId, // actionById (answerer)
        questionId,
        'ANSWER',
        `${answer.author.username} a répondu à votre question "${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}"`,
      );
    }

    res.status(201).json(answer);
  } catch (error) {
    console.error('Error adding answer:', error);
    res.status(500).json({ message: 'Error adding answer' });
  }
};
