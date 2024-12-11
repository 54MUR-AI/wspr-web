"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.extractUser = exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../database");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 12;
/**
 * Hash a password
 */
const hashPassword = async (password) => {
    return await bcryptjs_1.default.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
/**
 * Compare a password with a hash
 */
const comparePassword = async (password, hash) => {
    return await bcryptjs_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
/**
 * Generate a JWT token
 */
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '7d',
    });
};
exports.generateToken = generateToken;
/**
 * Verify a JWT token
 */
const verifyToken = async (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Verify user still exists and has access
        const user = await database_1.db.users.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, publicKey: true, active: true },
        });
        if (!user || !user.active) {
            throw new Error('User not found or inactive');
        }
        return {
            id: user.id,
            email: user.email,
            publicKey: user.publicKey,
        };
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
exports.verifyToken = verifyToken;
/**
 * Extract user from request
 */
const extractUser = async (authHeader) => {
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        return await (0, exports.verifyToken)(token);
    }
    catch (error) {
        return null;
    }
};
exports.extractUser = extractUser;
/**
 * Middleware to require authentication
 */
const requireAuth = async (req, res, next) => {
    const user = await (0, exports.extractUser)(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    req.user = user;
    next();
};
exports.requireAuth = requireAuth;
