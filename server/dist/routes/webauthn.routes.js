"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const webauthn_service_1 = require("../services/webauthn.service");
const validate_request_1 = require("../middleware/validate-request");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const webAuthnService = webauthn_service_1.WebAuthnService.getInstance();
const prisma = new client_1.PrismaClient();
// Rate limiting for authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window per IP
    message: 'Too many authentication attempts, please try again later'
});
// Get user's WebAuthn credentials
router.get('/credentials', auth_1.requireAuth, async (req, res, next) => {
    try {
        const credentials = await prisma.webAuthnCredential.findMany({
            where: { userId: req.user.id },
            select: {
                id: true,
                createdAt: true,
                lastUsed: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(credentials);
    }
    catch (error) {
        next(error);
    }
});
// Delete a WebAuthn credential
router.delete('/credentials/:id', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        // Ensure the credential belongs to the user
        const credential = await prisma.webAuthnCredential.findFirst({
            where: {
                id,
                userId: req.user.id,
            },
        });
        if (!credential) {
            return res.status(404).json({ message: 'Credential not found' });
        }
        // Don't allow deleting the last credential if no other authentication method exists
        const credentialCount = await prisma.webAuthnCredential.count({
            where: { userId: req.user.id },
        });
        const hasPasswordAuth = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { password: true },
        });
        if (credentialCount <= 1 && !hasPasswordAuth?.password) {
            return res.status(400).json({
                message: 'Cannot delete the last security key without another authentication method',
            });
        }
        await prisma.webAuthnCredential.delete({
            where: { id },
        });
        res.json({ message: 'Credential deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Generate registration options
router.post('/generate-registration-options', auth_1.requireAuth, [
    (0, express_validator_1.body)('username').isString().notEmpty(),
], validate_request_1.validateRequest, async (req, res, next) => {
    try {
        const { username } = req.body;
        const userId = req.user.id;
        const options = await webAuthnService.generateRegistrationOptions(userId, username);
        res.json(options);
    }
    catch (error) {
        next(error);
    }
});
// Verify registration
router.post('/verify-registration', auth_1.requireAuth, [
    (0, express_validator_1.body)('response').isObject().notEmpty(),
], validate_request_1.validateRequest, async (req, res, next) => {
    try {
        const { response } = req.body;
        const userId = req.user.id;
        const verification = await webAuthnService.verifyRegistration(userId, response);
        res.json(verification);
    }
    catch (error) {
        next(error);
    }
});
// Generate authentication options
router.post('/generate-authentication-options', authLimiter, [
    (0, express_validator_1.body)('userId').isString().notEmpty(),
], validate_request_1.validateRequest, async (req, res, next) => {
    try {
        const { userId } = req.body;
        const options = await webAuthnService.generateAuthenticationOptions(userId);
        res.json(options);
    }
    catch (error) {
        next(error);
    }
});
// Verify authentication
router.post('/verify-authentication', authLimiter, [
    (0, express_validator_1.body)('userId').isString().notEmpty(),
    (0, express_validator_1.body)('response').isObject().notEmpty(),
], validate_request_1.validateRequest, async (req, res, next) => {
    try {
        const { userId, response } = req.body;
        const verification = await webAuthnService.verifyAuthentication(userId, response);
        if (verification.verified) {
            // Generate JWT token here or use your existing token generation
            const token = generateToken(userId);
            res.json({ verified: true, token });
        }
        else {
            res.json({ verified: false });
        }
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
