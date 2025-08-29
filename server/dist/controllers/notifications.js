"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = void 0;
const prisma_1 = require("../lib/prisma");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        const notifications = await prisma_1.prisma.notification.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                actionBy: {
                    select: {
                        username: true,
                        avatar_url: true
                    }
                },
                question: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications', error: errorMessage });
    }
};
exports.getNotifications = getNotifications;
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        const notification = await prisma_1.prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: userId
            }
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        await prisma_1.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
        res.json({ message: 'Notification marquée comme lue' });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la notification' });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        await prisma_1.prisma.notification.updateMany({
            where: {
                userId: userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });
        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour des notifications' });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const createNotification = async (userId, actionById, questionId, type, content) => {
    try {
        // Ne pas créer de notification si l'utilisateur agit sur son propre contenu
        if (userId === actionById) {
            return;
        }
        await prisma_1.prisma.notification.create({
            data: {
                type,
                content,
                userId,
                actionById,
                questionId
            }
        });
    }
    catch (error) {
        console.error('Error creating notification:', error);
    }
};
exports.createNotification = createNotification;
