"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const recovery_service_1 = require("../services/recovery.service");
const validate_request_1 = require("../middleware/validate-request");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const recoveryService = recovery_service_1.RecoveryService.getInstance();
// Rate limiting for recovery endpoints
const recoveryLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: 'Too many recovery attempts, please try again later'
});
// Generate recovery keys
router.post('/generate', auth_1.requireAuth, [
    (0, express_validator_1.body)('count')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Count must be between 1 and 10'),
], validate_request_1.validateRequest, async (req, res, next) => {
    try {
        const { count = 3 } = req.body;
        const userId = req.user.id;
        // Generate new recovery keys
        const keys = await recoveryService.generateRecoveryKeys(userId, count);
        res.json({
            message: 'Recovery keys generated successfully',
            keys,
            warning: 'Store these keys safely. They will not be shown again.',
        });
    }
    catch (error) {
        next(error);
    }
});
// Verify recovery key
router.post('/verify', recoveryLimiter, [
    (0, express_validator_1.body)('userId').isString().notEmpty(),
    (0, express_validator_1.body)('key').isString().notEmpty(),
], validate_request_1.validateRequest, async (req, res, next) => {
    try {
        const { userId, key } = req.body;
        const isValid = await recoveryService.verifyRecoveryKey(userId, key);
        if (isValid) {
            // Generate new auth token here
            const token = generateToken(userId);
            res.json({ verified: true, token });
        }
        else {
            res.status(401).json({
                verified: false,
                message: 'Invalid recovery key',
            });
        }
    }
    catch (error) {
        next(error);
    }
});
// Get recovery key status
router.get('/status', auth_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const status = await recoveryService.getRecoveryKeyStatus(userId);
        res.json(status);
    }
    catch (error) {
        next(error);
    }
});
// Cleanup expired/used recovery keys
router.post('/cleanup', auth_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const deletedCount = await recoveryService.cleanupRecoveryKeys(userId);
        res.json({
            message: 'Cleanup completed',
            deletedCount,
        });
    }
    catch (error) {
        next(error);
    }
});
// Delete all recovery keys
router.delete('/all', auth_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const deletedCount = await recoveryService.deleteAllRecoveryKeys(userId);
        res.json({
            message: 'All recovery keys deleted',
            deletedCount,
        });
    }
    catch (error) {
        next(error);
    }
});
// Revoke specific recovery key
router.delete('/:keyId', auth_1.requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { keyId } = req.params;
        const success = await recoveryService.revokeRecoveryKey(userId, keyId);
        if (success) {
            res.json({ message: 'Recovery key revoked successfully' });
        }
        else {
            res.status(404).json({ message: 'Recovery key not found' });
        }
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
