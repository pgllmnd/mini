import { Router } from 'express';
import * as userController from '../controllers/users';
import { auth } from '../middleware/auth';

const router = Router();

// Get all users
router.get('/', userController.getAllUsers);

// Get user profile
router.get('/:id', userController.getProfile);

// Recompute reputation from votes/accepts (admin/dev utility)
router.post('/:id/recompute-reputation', userController.recomputeReputation);
// Alternative path to avoid parameter routing precedence issues
router.post('/recompute-reputation/:id', userController.recomputeReputation);

// Upload avatar (auth -> multer -> handler)
router.post('/avatar', auth, userController.avatarUploadMiddleware, userController.uploadAvatar as any);
// Temporary test route (no auth) to validate upload flow during development
// Test/debug routes should still require auth in non-dev environments
router.post('/avatar/test', auth, userController.avatarUploadMiddleware, userController.uploadAvatar as any);
router.post('/avatar/debug', auth, userController.avatarUploadMiddleware, userController.avatarDebug as any);

// Temporary Prisma connectivity test
router.get('/_test/prisma', userController.testPrisma);

// Update user profile
router.patch('/profile',
  auth,
  userController.updateProfile
);

// Get user activity
router.get('/:id/activity', userController.getUserActivity);

export default router;
