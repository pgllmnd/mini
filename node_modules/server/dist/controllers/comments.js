"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQuestionComment = exports.addAnswerComment = exports.getQuestionComments = exports.getAnswerComments = void 0;
const prisma_1 = require("../lib/prisma");
const express_validator_1 = require("express-validator");
const formatDateFrDateOnly = (d) => d.toLocaleDateString('fr-FR');
const formatDateFrDateTime = (d) => d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});
const formatDateFrRelative = (d) => {
    const now = new Date();
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (sec < 60)
        return `il y a ${sec} seconde${sec > 1 ? 's' : ''}`;
    const min = Math.floor(sec / 60);
    if (min < 60)
        return `il y a ${min} minute${min > 1 ? 's' : ''}`;
    const hr = Math.floor(min / 60);
    if (hr < 24)
        return `il y a ${hr} heure${hr > 1 ? 's' : ''}`;
    const days = Math.floor(hr / 24);
    if (days < 30)
        return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    if (months < 12)
        return `il y a ${months} mois`;
    const years = Math.floor(months / 12);
    return `il y a ${years} an${years > 1 ? 's' : ''}`;
};
const formatDateFr = (date, format = 'datetime') => {
    if (!date)
        return '';
    const d = new Date(date);
    if (isNaN(d.getTime()))
        return '';
    switch (format) {
        case 'date': return formatDateFrDateOnly(d);
        case 'relative': return formatDateFrRelative(d);
        case 'datetime':
        default:
            return formatDateFrDateTime(d);
    }
};
const getAnswerComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { answerId } = req.params;
        const format = req.query.format || 'datetime';
        const comments = yield prisma_1.prisma.comment.findMany({
            where: {
                answerId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const formatted = comments.map((c) => {
            var _a, _b, _c;
            return ({
                id: c.id,
                content: c.content,
                createdAt: c.createdAt,
                createdAtIso: (c.createdAt instanceof Date) ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString(),
                updatedAt: c.updatedAt,
                updatedAtIso: (c.updatedAt instanceof Date) ? c.updatedAt.toISOString() : new Date(c.updatedAt).toISOString(),
                createdAtFr: formatDateFr(c.createdAt, format),
                author: {
                    id: (_a = c.author) === null || _a === void 0 ? void 0 : _a.id,
                    username: (_b = c.author) === null || _b === void 0 ? void 0 : _b.username,
                    avatar_url: (_c = c.author) === null || _c === void 0 ? void 0 : _c.avatar_url
                },
                answerId: c.answerId,
                questionId: c.questionId
            });
        });
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching answer comments:', error);
        res.status(500).json({ message: 'Error fetching comments' });
    }
});
exports.getAnswerComments = getAnswerComments;
const getQuestionComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { questionId } = req.params;
        const format = req.query.format || 'datetime';
        const comments = yield prisma_1.prisma.comment.findMany({
            where: {
                questionId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const formatted = comments.map((c) => {
            var _a, _b, _c;
            return ({
                id: c.id,
                content: c.content,
                createdAt: c.createdAt,
                createdAtIso: (c.createdAt instanceof Date) ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString(),
                updatedAt: c.updatedAt,
                updatedAtIso: (c.updatedAt instanceof Date) ? c.updatedAt.toISOString() : new Date(c.updatedAt).toISOString(),
                createdAtFr: formatDateFr(c.createdAt, format),
                author: {
                    id: (_a = c.author) === null || _a === void 0 ? void 0 : _a.id,
                    username: (_b = c.author) === null || _b === void 0 ? void 0 : _b.username,
                    avatar_url: (_c = c.author) === null || _c === void 0 ? void 0 : _c.avatar_url
                },
                answerId: c.answerId,
                questionId: c.questionId
            });
        });
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching question comments:', error);
        res.status(500).json({ message: 'Error fetching comments' });
    }
});
exports.getQuestionComments = getQuestionComments;
const addAnswerComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { answerId } = req.params;
        const { content } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const comment = yield prisma_1.prisma.comment.create({
            data: {
                content,
                author: { connect: { id: userId } },
                answer: { connect: { id: answerId } }
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                }
            }
        });
        const format = req.query.format || 'datetime';
        const result = {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            createdAtIso: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : new Date(comment.createdAt).toISOString(),
            updatedAt: comment.updatedAt,
            updatedAtIso: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : new Date(comment.updatedAt).toISOString(),
            createdAtFr: formatDateFr(comment.createdAt, format),
            author: {
                id: comment.author.id,
                username: comment.author.username,
                avatar_url: comment.author.avatar_url
            },
            answerId: comment.answerId,
            questionId: comment.questionId
        };
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Error adding answer comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});
exports.addAnswerComment = addAnswerComment;
const addQuestionComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { questionId } = req.params;
        const { content } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const comment = yield prisma_1.prisma.comment.create({
            data: {
                content,
                author: { connect: { id: userId } },
                question: { connect: { id: questionId } }
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                }
            }
        });
        const format = req.query.format || 'datetime';
        const result = {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            createdAtIso: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : new Date(comment.createdAt).toISOString(),
            updatedAt: comment.updatedAt,
            updatedAtIso: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : new Date(comment.updatedAt).toISOString(),
            createdAtFr: formatDateFr(comment.createdAt, format),
            author: {
                id: comment.author.id,
                username: comment.author.username,
                avatar_url: comment.author.avatar_url
            },
            answerId: comment.answerId,
            questionId: comment.questionId
        };
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Error adding question comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});
exports.addQuestionComment = addQuestionComment;
