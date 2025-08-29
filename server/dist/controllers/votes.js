"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vote = void 0;
const prisma_1 = require("../lib/prisma");
const notifications_1 = require("./notifications");
const vote = async (req, res) => {
    try {
        const { voteType, targetType, targetId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        let questionId;
        let authorId;
        let title;
        let voterUsername;
        // Get voter's username
        const voter = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true }
        });
        if (!voter) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        voterUsername = voter.username;
        // Handle voting based on target type
        if (targetType === 'question') {
            const question = await prisma_1.prisma.question.findUnique({
                where: { id: targetId },
                include: {
                    author: true,
                    votes: {
                        where: { userId }
                    }
                }
            });
            if (!question) {
                return res.status(404).json({ message: 'Question non trouvée' });
            }
            // Don't allow voting on own content
            if (question.authorId === userId) {
                return res.status(400).json({ message: 'Vous ne pouvez pas voter sur votre propre question' });
            }
            // Check if user already voted
            const existingVote = question.votes[0];
            if (existingVote) {
                if (existingVote.type === voteType) {
                    return res.status(400).json({ message: 'Vote déjà enregistré' });
                }
                // Remove existing vote
                await prisma_1.prisma.vote.delete({
                    where: { id: existingVote.id }
                });
            }
            // Create new vote
            await prisma_1.prisma.vote.create({
                data: {
                    type: voteType,
                    user: { connect: { id: userId } },
                    question: { connect: { id: targetId } }
                }
            });
            // Create notification for question author
            await (0, notifications_1.createNotification)(question.authorId, userId, question.id, 'VOTE', `${voterUsername} a ${voteType === 'UP' ? 'upvoté' : 'downvoté'} votre question "${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}"`);
        }
        else if (targetType === 'answer') {
            const answer = await prisma_1.prisma.answer.findUnique({
                where: { id: targetId },
                include: {
                    author: true,
                    question: true,
                    votes: {
                        where: { userId }
                    }
                }
            });
            if (!answer) {
                return res.status(404).json({ message: 'Réponse non trouvée' });
            }
            // Don't allow voting on own content
            if (answer.authorId === userId) {
                return res.status(400).json({ message: 'Vous ne pouvez pas voter sur votre propre réponse' });
            }
            // Check if user already voted
            const existingVote = answer.votes[0];
            if (existingVote) {
                if (existingVote.type === voteType) {
                    return res.status(400).json({ message: 'Vote déjà enregistré' });
                }
                // Remove existing vote
                await prisma_1.prisma.vote.delete({
                    where: { id: existingVote.id }
                });
            }
            // Create new vote
            await prisma_1.prisma.vote.create({
                data: {
                    type: voteType,
                    user: { connect: { id: userId } },
                    answer: { connect: { id: targetId } }
                }
            });
            // Create notification for answer author
            await (0, notifications_1.createNotification)(answer.authorId, userId, answer.questionId, 'VOTE', `${voterUsername} a ${voteType === 'UP' ? 'upvoté' : 'downvoté'} votre réponse à la question "${answer.question.title.substring(0, 50)}${answer.question.title.length > 50 ? '...' : ''}"`);
        }
        res.json({ message: 'Vote enregistré avec succès' });
    }
    catch (error) {
        console.error('Error handling vote:', error);
        res.status(500).json({ message: 'Erreur lors du vote' });
    }
};
exports.vote = vote;
