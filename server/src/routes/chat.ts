import { Router } from 'express';
import { chatProxy } from '../controllers/chat';

const router = Router();

// POST /api/chat
router.post('/', chatProxy);

export default router;
