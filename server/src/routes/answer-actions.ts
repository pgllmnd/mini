import { Router } from 'express';
import { voteAnswer, acceptAnswer } from '../controllers/answer-actions';
import { auth } from '../middleware/auth';

const router = Router();

// Route pour voter sur une réponse
router.post('/answers/:answerId/vote', auth, voteAnswer);

// Route pour accepter une réponse
router.post('/answers/:answerId/accept', auth, acceptAnswer);

export default router;
