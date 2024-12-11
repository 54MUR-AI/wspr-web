"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticatorSchema = exports.recoverySchema = exports.webAuthnAuthenticationSchema = exports.webAuthnRegistrationSchema = exports.loginUserSchema = exports.registerUserSchema = void 0;
const zod_1 = require("zod");
// User schemas
exports.registerUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    name: zod_1.z.string().min(1, 'Name is required'),
});
exports.loginUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
// WebAuthn schemas
exports.webAuthnRegistrationSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    response: zod_1.z.custom((data) => {
        try {
            return typeof data === 'object' &&
                data !== null &&
                'id' in data &&
                'rawId' in data &&
                'response' in data &&
                'type' in data;
        }
        catch {
            return false;
        }
    }, 'Invalid registration response'),
});
exports.webAuthnAuthenticationSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    response: zod_1.z.custom((data) => {
        try {
            return typeof data === 'object' &&
                data !== null &&
                'id' in data &&
                'rawId' in data &&
                'response' in data &&
                'type' in data;
        }
        catch {
            return false;
        }
    }, 'Invalid authentication response'),
});
// Recovery schemas
exports.recoverySchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    recoveryKey: zod_1.z.string().min(20, 'Invalid recovery key'),
});
// Device schemas
exports.authenticatorSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid authenticator ID'),
    name: zod_1.z.string().min(1, 'Device name is required'),
});
