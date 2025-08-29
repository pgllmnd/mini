import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Vote sur une réponse
export const voteAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { answerId } = req.params;
    const { voteType } = req.body; // 'up' ou 'down'
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Vérifier si l'utilisateur a déjà voté
    const existingVote = await prisma.vote.findFirst({
      where: {
        answerId,
        userId
      }
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Annuler le vote si même type
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
        return res.json({ message: 'Vote removed' });
      } else {
        // Changer le type de vote
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType }
        });
        return res.json({ message: 'Vote updated' });
      }
    }

    // Créer un nouveau vote
    await prisma.vote.create({
      data: {
        type: voteType,
        answer: { connect: { id: answerId } },
        user: { connect: { id: userId } }
      }
    });

    res.json({ message: 'Vote added' });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Error processing vote' });
  }
};

// Accepter une réponse
export const acceptAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Vérifier la réponse et la question
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true
      }
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Vérifier si l'utilisateur est l'auteur de la question
    if (answer.question.authorId !== userId) {
      return res.status(403).json({ message: 'Only question author can accept answers' });
    }

    // Retirer l'acceptation de toute autre réponse
    await prisma.answer.updateMany({
      where: {
        questionId: answer.questionId
      },
      data: {
        isAccepted: false
      }
    });

    // Accepter la réponse
    await prisma.answer.update({
      where: { id: answerId },
      data: {
        isAccepted: true
      }
    });

    // Donner des points de réputation à l'auteur de la réponse
    await prisma.user.update({
      where: { id: answer.authorId },
      data: {
        reputation: {
          increment: 15 // Points pour réponse acceptée
        }
      }
    });

    res.json({ message: 'Answer accepted' });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ message: 'Error accepting answer' });
  }
};
