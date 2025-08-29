"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAnswer = void 0;
const express_validator_1 = require("express-validator");
const prisma_1 = require("../lib/prisma");
const notifications_1 = require("./notifications");
const addAnswer = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { questionId } = req.params;
        const { content } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Get question details including author
        const question = await prisma_1.prisma.question.findUnique({
            where: { id: questionId },
            include: {
                author: true
            }
        });
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        // Create the answer
        const answer = await prisma_1.prisma.answer.create({
            data: {
                content,
                author: { connect: { id: userId } },
                question: { connect: { id: questionId } }
            },
            include: {
                author: {
                    select: {
                        username: true
                    }
                }
            }
        });
        // Create notification for question author
        if (question.authorId !== userId) {
            await (0, notifications_1.createNotification)(question.authorId, // userId (recipient)
            userId, // actionById (answerer)
            questionId, 'ANSWER', `${answer.author.username} a répondu à votre question "${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}"`);
        }
        res.status(201).json(answer);
    }
    catch (error) {
        console.error('Error adding answer:', error);
        res.status(500).json({ message: 'Error adding answer' });
    }
};
exports.addAnswer = addAnswer;
