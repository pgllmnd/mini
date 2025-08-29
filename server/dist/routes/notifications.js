"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notifications_1 = require("../controllers/notifications");
const router = (0, express_1.Router)();
// Routes protégées nécessitant une authentification
router.use(auth_1.auth);
// Récupérer toutes les notifications de l'utilisateur
router.get('/', notifications_1.getNotifications);
// Marquer une notification comme lue
router.patch('/:notificationId/read', notifications_1.markNotificationAsRead);
// Marquer toutes les notifications comme lues
router.patch('/read-all', notifications_1.markAllNotificationsAsRead);
exports.default = router;
