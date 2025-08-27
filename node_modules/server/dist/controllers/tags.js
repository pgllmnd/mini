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
exports.getAllTags = exports.suggestTags = void 0;
const prisma_1 = require("../lib/prisma");
// Get tag suggestions for autocomplete
const suggestTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q } = req.query;
        const tags = yield prisma_1.prisma.tag.findMany({
            where: {
                name: {
                    contains: String(q),
                    mode: 'insensitive',
                },
            },
            take: 5,
            orderBy: {
                name: 'asc',
            },
        });
        res.json(tags);
    }
    catch (error) {
        console.error('Error suggesting tags:', error);
        res.status(500).json({ message: 'Error fetching tag suggestions' });
    }
});
exports.suggestTags = suggestTags;
// Get all tags with question counts
const getAllTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tags = yield prisma_1.prisma.tag.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: {
                        questions: true,
                    },
                },
            },
        });
        // Format response
        const formattedTags = tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            description: tag.description,
            questionCount: tag._count.questions,
        }));
        res.json(formattedTags);
    }
    catch (err) {
        console.error('Error getting all tags:', err);
        res.status(500).json({ error: 'Error fetching tags' });
    }
});
exports.getAllTags = getAllTags;
