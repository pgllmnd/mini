import { Router } from 'express';
import { body } from 'express-validator';
import * as questionController from '../controllers/questions';
import { auth } from '../middleware/auth';

const router = Router();

// Get all questions with optional filters
router.get('/', questionController.getQuestions);

// Get a specific question
router.get('/:id', questionController.getQuestion);

// Create a question
router.post('/',
  auth,
  [
    body('title').notEmpty(),
    body('content').notEmpty(),
    body('tags').isArray()
  ],
  questionController.createQuestion
);

// Add an answer to a question
router.post('/:id/answers',
  auth,
  [
    body('content').notEmpty()
  ],
  questionController.addAnswer
);

// Vote on a question or answer
router.post('/:id/vote',
  auth,
  [
    body('voteType').isIn(['up', 'down']),
    body('targetType').isIn(['question', 'answer']),
    body('targetId').isNumeric()
  ],
  questionController.vote
);

// Mark answer as accepted
router.patch('/:questionId/answers/:answerId/accept',
  auth,
  questionController.acceptAnswer
);

// Get comments for an answer
router.get('/:questionId/answers/:answerId/comments',
  questionController.getAnswerComments
);

// Add comment to an answer
router.post('/:questionId/answers/:answerId/comments',
  auth,
  [
    body('content').notEmpty().trim()
  ],
  questionController.addAnswerComment
);

// Get comments for a question
router.get('/:questionId/comments',
  questionController.getQuestionComments
);

// Add comment to a question
router.post('/:questionId/comments',
  auth,
  [
    body('content').notEmpty().trim()
  ],
  questionController.addQuestionComment
);

export default router;
