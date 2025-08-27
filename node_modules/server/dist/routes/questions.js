"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const questionController = __importStar(require("../controllers/questions"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all questions with optional filters
router.get('/', questionController.getQuestions);
// Get a specific question
router.get('/:id', questionController.getQuestion);
// Create a question
router.post('/', auth_1.auth, [
    (0, express_validator_1.body)('title').notEmpty(),
    (0, express_validator_1.body)('content').notEmpty(),
    (0, express_validator_1.body)('tags').isArray()
], questionController.createQuestion);
// Add an answer to a question
router.post('/:id/answers', auth_1.auth, [
    (0, express_validator_1.body)('content').notEmpty()
], questionController.addAnswer);
// Vote on a question or answer
router.post('/:id/vote', auth_1.auth, [
    (0, express_validator_1.body)('voteType').isIn(['up', 'down']),
    (0, express_validator_1.body)('targetType').isIn(['question', 'answer']),
    (0, express_validator_1.body)('targetId').isNumeric()
], questionController.vote);
// Mark answer as accepted
router.patch('/:questionId/answers/:answerId/accept', auth_1.auth, questionController.acceptAnswer);
// Get comments for an answer
router.get('/:questionId/answers/:answerId/comments', questionController.getAnswerComments);
// Add comment to an answer
router.post('/:questionId/answers/:answerId/comments', auth_1.auth, [
    (0, express_validator_1.body)('content').notEmpty().trim()
], questionController.addAnswerComment);
// Get comments for a question
router.get('/:questionId/comments', questionController.getQuestionComments);
// Add comment to a question
router.post('/:questionId/comments', auth_1.auth, [
    (0, express_validator_1.body)('content').notEmpty().trim()
], questionController.addQuestionComment);
exports.default = router;
