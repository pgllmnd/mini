import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notifications';

const router = Router();

// Routes protégées nécessitant une authentification
router.use(auth);

// Récupérer toutes les notifications de l'utilisateur
router.get('/', getNotifications);

// Marquer une notification comme lue
router.patch('/:notificationId/read', markNotificationAsRead);

// Marquer toutes les notifications comme lues
router.patch('/read-all', markAllNotificationsAsRead);

export default router;
