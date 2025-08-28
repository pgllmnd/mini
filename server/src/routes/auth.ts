import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/me', auth, authController.getCurrentUser);

router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('username').isLength({ min: 3 })
  ],
  authController.register
);

router.post('/login',
  [
    body('email').isEmail(),
    body('password').exists()
  ],
  authController.login
);

router.post('/forgot-password',
  [
    body('email').isEmail()
  ],
  authController.forgotPassword
);

router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  authController.resetPassword
);

export default router;
