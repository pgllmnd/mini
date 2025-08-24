import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Get tag suggestions for autocomplete
export const suggestTags = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: String(q),
          mode: 'insensitive',
        },
      },
      take: 5,
      orderBy: {
        name: 'asc',
      },
    });

    res.json(tags);
  } catch (error) {
    console.error('Error suggesting tags:', error);
    res.status(500).json({ message: 'Error fetching tag suggestions' });
  }
};

// Get all tags with question counts
export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    // Format response
    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      questionCount: tag._count.questions,
    }));

    res.json(formattedTags);
  } catch (err) {
    console.error('Error getting all tags:', err);
    res.status(500).json({ error: 'Error fetching tags' });
  }
};
