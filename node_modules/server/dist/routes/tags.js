"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tags_1 = require("../controllers/tags");
const router = (0, express_1.Router)();
// Get all tags
router.get('/', tags_1.getAllTags);
// Get tag suggestions for autocomplete
router.get('/suggest', tags_1.suggestTags);
exports.default = router;
