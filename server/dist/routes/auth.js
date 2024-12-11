"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../database");
const webauthn_service_1 = require("../services/webauthn.service");
const recovery_service_1 = require("../services/recovery.service");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRouter = router;
const webAuthnService = webauthn_service_1.WebAuthnService.getInstance();
const recoveryService = recovery_service_1.RecoveryService.getInstance();
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
// Registration endpoint
router.post('/register', async (req, res, next) => {
    try {
        const { email, name } = registerSchema.parse(req.body);
        const existingUser = await database_1.db.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new error_1.AppError(409, 'User already exists');
        }
        const user = await database_1.db.user.create({
            data: { email, name },
        });
        const options = await webAuthnService.generateRegistrationOptions(user.id, user.email, 'Primary Device');
        res.json(options);
    }
    catch (error) {
        next(error);
    }
});
// Registration verification endpoint
router.post('/register/verify', async (req, res, next) => {
    try {
        const { email, response } = req.body;
        const user = await database_1.db.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_1.AppError(404, 'User not found');
        }
        const verification = await webAuthnService.verifyRegistration(user.id, 'Primary Device', response);
        if (verification.verified) {
            const token = (0, auth_2.generateToken)({ id: user.id, email: user.email });
            const recoveryKey = await recoveryService.createRecoveryKey(user.id);
            res.json({ token, recoveryKey });
        }
        else {
            throw new error_1.AppError(400, 'Registration verification failed');
        }
    }
    catch (error) {
        next(error);
    }
});
// Login endpoint
router.post('/login', async (req, res, next) => {
    try {
        const { email } = loginSchema.parse(req.body);
        const user = await database_1.db.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_1.AppError(404, 'User not found');
        }
        const options = await webAuthnService.generateAuthenticationOptions(user.id);
        res.json(options);
    }
    catch (error) {
        next(error);
    }
});
// Login verification endpoint
router.post('/login/verify', async (req, res, next) => {
    try {
        const { email, response } = req.body;
        const user = await database_1.db.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_1.AppError(404, 'User not found');
        }
        const verification = await webAuthnService.verifyAuthentication(user.id, response);
        if (verification.verified) {
            const token = (0, auth_2.generateToken)({ id: user.id, email: user.email });
            res.json({ token });
        }
        else {
            throw new error_1.AppError(401, 'Authentication failed');
        }
    }
    catch (error) {
        next(error);
    }
});
// Recovery endpoints
router.post('/recover', async (req, res, next) => {
    try {
        const { email, recoveryKey } = req.body;
        const user = await database_1.db.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_1.AppError(404, 'User not found');
        }
        const isValid = await recoveryService.verifyRecoveryKey(user.id, recoveryKey);
        if (isValid) {
            const token = (0, auth_2.generateToken)({ id: user.id, email: user.email });
            const newRecoveryKey = await recoveryService.createRecoveryKey(user.id);
            res.json({ token, recoveryKey: newRecoveryKey });
        }
        else {
            throw new error_1.AppError(401, 'Invalid recovery key');
        }
    }
    catch (error) {
        next(error);
    }
});
// Protected routes
router.get('/me', auth_1.auth, async (req, res, next) => {
    try {
        const user = await database_1.db.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new error_1.AppError(404, 'User not found');
        }
        res.json(user);
    }
    catch (error) {
        next(error);
    }
});
router.get('/authenticators', auth_1.auth, async (req, res, next) => {
    try {
        const authenticators = await webAuthnService.listAuthenticators(req.user.id);
        res.json(authenticators);
    }
    catch (error) {
        next(error);
    }
});
router.delete('/authenticators/:id', auth_1.auth, async (req, res, next) => {
    try {
        await webAuthnService.removeAuthenticator(req.params.id, req.user.id);
        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
});
