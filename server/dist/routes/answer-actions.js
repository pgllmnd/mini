"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const answer_actions_1 = require("../controllers/answer-actions");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Route pour voter sur une réponse
router.post('/answers/:answerId/vote', auth_1.auth, answer_actions_1.voteAnswer);
// Route pour accepter une réponse
router.post('/answers/:answerId/accept', auth_1.auth, answer_actions_1.acceptAnswer);
exports.default = router;
