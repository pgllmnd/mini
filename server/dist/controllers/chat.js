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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatProxy = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.ai/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const chatProxy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { message } = req.body;
        if (!message)
            return res.status(400).json({ error: 'Missing message' });
        // Basic validation
        if (typeof message !== 'string' || message.length > 2000) {
            return res.status(400).json({ error: 'Invalid message' });
        }
        // Call GROQ API (as a proxy)
        const response = yield (0, node_fetch_1.default)(`${GROQ_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: message }],
                max_tokens: 512,
            }),
        });
        if (!response.ok) {
            const text = yield response.text();
            console.error('GROQ API error:', response.status, text);
            return res.status(502).json({ error: 'Upstream error', details: text });
        }
        const data = yield response.json();
        // Extract reply from GROQ response
        const reply = (_d = (_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) !== null && _d !== void 0 ? _d : null;
        return res.json({ reply, raw: data });
    }
    catch (err) {
        console.error('chatProxy error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});
exports.chatProxy = chatProxy;
