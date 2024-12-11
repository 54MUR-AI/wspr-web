"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.optionalAuth = exports.auth = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '24h';
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
exports.verifyToken = verifyToken;
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new Error('No token provided');
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, exports.verifyToken)(token);
        const user = await database_1.db.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                disabled: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.disabled) {
            throw new Error('User account is disabled');
        }
        req.user = {
            id: user.id,
            email: user.email,
        };
        req.token = token;
        next();
    }
    catch (error) {
        res.status(401).json({
            error: 'Authentication failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.auth = auth;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, exports.verifyToken)(token);
        const user = await database_1.db.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                disabled: true,
            },
        });
        if (user && !user.disabled) {
            req.user = {
                id: user.id,
                email: user.email,
            };
            req.token = token;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (role) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new Error('Authentication required');
            }
            const userRole = await database_1.db.userRole.findFirst({
                where: {
                    userId: req.user.id,
                    role: role,
                },
            });
            if (!userRole) {
                throw new Error('Insufficient permissions');
            }
            next();
        }
        catch (error) {
            res.status(403).json({
                error: 'Authorization failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
};
exports.requireRole = requireRole;
