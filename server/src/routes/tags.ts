import { Router } from 'express';
import { suggestTags, getAllTags } from '../controllers/tags';

const router = Router();

// Get all tags
router.get('/', getAllTags);

// Get tag suggestions for autocomplete
router.get('/suggest', suggestTags);

export default router;
