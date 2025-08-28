"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Support either a full DATABASE_URL or individual DB_* env vars
let poolInstance;
if (process.env.DATABASE_URL) {
    // Render/Postgres often requires SSL; allow opt-out with DB_SSL=false
    const useSsl = process.env.DB_SSL !== 'false';
    poolInstance = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined
    });
}
else {
    poolInstance = new pg_1.Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME
    });
}
exports.pool = poolInstance;
