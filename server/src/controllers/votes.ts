import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createNotification } from './notifications';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const vote = async (req: AuthRequest, res: Response) => {
  try {
    const { voteType, targetType, targetId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    let questionId: string;
    let authorId: string;
    let title: string;
    let voterUsername: string;

    // Get voter's username
    const voter = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!voter) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    voterUsername = voter.username;

    // Handle voting based on target type
    if (targetType === 'question') {
      const question = await prisma.question.findUnique({
        where: { id: targetId },
        include: {
          author: true,
          votes: {
            where: { userId }
          }
        }
      });

      if (!question) {
        return res.status(404).json({ message: 'Question non trouvée' });
      }

      // Don't allow voting on own content
      if (question.authorId === userId) {
        return res.status(400).json({ message: 'Vous ne pouvez pas voter sur votre propre question' });
      }

      // Check if user already voted
      const existingVote = question.votes[0];
      
      if (existingVote) {
        if (existingVote.type === voteType) {
          return res.status(400).json({ message: 'Vote déjà enregistré' });
        }
        // Remove existing vote
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
      }

      // Create new vote
      await prisma.vote.create({
        data: {
          type: voteType,
          user: { connect: { id: userId } },
          question: { connect: { id: targetId } }
        }
      });

      // Create notification for question author
      await createNotification(
        question.authorId,
        userId,
        question.id,
        'VOTE',
        `${voterUsername} a ${voteType === 'UP' ? 'upvoté' : 'downvoté'} votre question "${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}"`,
      );

    } else if (targetType === 'answer') {
      const answer = await prisma.answer.findUnique({
        where: { id: targetId },
        include: {
          author: true,
          question: true,
          votes: {
            where: { userId }
          }
        }
      });

      if (!answer) {
        return res.status(404).json({ message: 'Réponse non trouvée' });
      }

      // Don't allow voting on own content
      if (answer.authorId === userId) {
        return res.status(400).json({ message: 'Vous ne pouvez pas voter sur votre propre réponse' });
      }

      // Check if user already voted
      const existingVote = answer.votes[0];
      
      if (existingVote) {
        if (existingVote.type === voteType) {
          return res.status(400).json({ message: 'Vote déjà enregistré' });
        }
        // Remove existing vote
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
      }

      // Create new vote
      await prisma.vote.create({
        data: {
          type: voteType,
          user: { connect: { id: userId } },
          answer: { connect: { id: targetId } }
        }
      });

      // Create notification for answer author
      await createNotification(
        answer.authorId,
        userId,
        answer.questionId,
        'VOTE',
        `${voterUsername} a ${voteType === 'UP' ? 'upvoté' : 'downvoté'} votre réponse à la question "${answer.question.title.substring(0, 50)}${answer.question.title.length > 50 ? '...' : ''}"`,
      );
    }

    res.json({ message: 'Vote enregistré avec succès' });
  } catch (error) {
    console.error('Error handling vote:', error);
    res.status(500).json({ message: 'Erreur lors du vote' });
  }
};
