"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_1 = require("../controllers/chat");
const router = (0, express_1.Router)();
// POST /api/chat
router.post('/', chat_1.chatProxy);
exports.default = router;
