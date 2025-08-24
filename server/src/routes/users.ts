import { Router } from 'express';
import * as userController from '../controllers/users';
import { auth } from '../middleware/auth';

const router = Router();

// Get all users
router.get('/', userController.getAllUsers);

// Get user profile
router.get('/:id', userController.getProfile);

// Upload avatar (auth -> multer -> handler)
router.post('/avatar', auth, userController.avatarUploadMiddleware, userController.uploadAvatar as any);
// Temporary test route (no auth) to validate upload flow during development
router.post('/avatar/test', userController.avatarUploadMiddleware, userController.uploadAvatar as any);
router.post('/avatar/debug', userController.avatarUploadMiddleware, userController.avatarDebug as any);

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
