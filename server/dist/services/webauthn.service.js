"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAuthnService = void 0;
const server_1 = require("@simplewebauthn/server");
const database_1 = require("../database");
const helpers_1 = require("@simplewebauthn/server/helpers");
const rpName = process.env.RP_NAME || 'WSPR Web';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || 'http://localhost:3000';
class WebAuthnService {
    constructor() { }
    static getInstance() {
        if (!WebAuthnService.instance) {
            WebAuthnService.instance = new WebAuthnService();
        }
        return WebAuthnService.instance;
    }
    async generateRegistrationOptions(userId, username, deviceName) {
        // Get existing authenticators for user
        const existingDevices = await database_1.db.authenticator.findMany({
            where: { userId },
        });
        const options = await (0, server_1.generateRegistrationOptions)({
            rpName,
            rpID,
            userID: userId,
            userName: username,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
            excludeCredentials: existingDevices.map((dev) => ({
                id: Buffer.from(dev.credentialID, 'base64'),
                type: 'public-key',
                transports: dev.transports,
            })),
        });
        // Save challenge
        await database_1.db.user.update({
            where: { id: userId },
            data: {
                currentChallenge: options.challenge,
            },
        });
        return options;
    }
    async verifyRegistration(userId, deviceName, response) {
        const user = await database_1.db.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.currentChallenge) {
            throw new Error('No challenge found for user');
        }
        let verification;
        try {
            verification = await (0, server_1.verifyRegistrationResponse)({
                response,
                expectedChallenge: user.currentChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
            });
        }
        catch (error) {
            throw new Error(`Failed to verify registration: ${error}`);
        }
        const { verified, registrationInfo } = verification;
        if (verified && registrationInfo) {
            const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp, } = registrationInfo;
            const existingDevice = await database_1.db.authenticator.findFirst({
                where: {
                    credentialID: helpers_1.isoBase64URL.fromBuffer(credentialID),
                },
            });
            if (existingDevice) {
                throw new Error('Authenticator has already been registered');
            }
            await database_1.db.authenticator.create({
                data: {
                    userId,
                    credentialID: helpers_1.isoBase64URL.fromBuffer(credentialID),
                    credentialPublicKey: Buffer.from(credentialPublicKey),
                    counter: counter,
                    credentialDeviceType,
                    credentialBackedUp,
                    transports: response.response.transports || [],
                    name: deviceName,
                    lastUsed: new Date(),
                },
            });
            // Clear challenge
            await database_1.db.user.update({
                where: { id: userId },
                data: { currentChallenge: null },
            });
        }
        return verification;
    }
    async generateAuthenticationOptions(userId) {
        const devices = await database_1.db.authenticator.findMany({
            where: { userId },
        });
        const options = await (0, server_1.generateAuthenticationOptions)({
            rpID,
            userVerification: 'preferred',
            allowCredentials: devices.map((dev) => ({
                id: Buffer.from(dev.credentialID, 'base64'),
                type: 'public-key',
                transports: dev.transports,
            })),
        });
        await database_1.db.user.update({
            where: { id: userId },
            data: { currentChallenge: options.challenge },
        });
        return options;
    }
    async verifyAuthentication(userId, response) {
        const user = await database_1.db.user.findUnique({
            where: { id: userId },
            include: {
                authenticators: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.currentChallenge) {
            throw new Error('No challenge found for user');
        }
        const credentialID = helpers_1.isoBase64URL.fromBuffer(response.rawId ? Buffer.from(response.rawId) : Buffer.from(response.id, 'base64'));
        const authenticator = user.authenticators.find((dev) => dev.credentialID === credentialID);
        if (!authenticator) {
            throw new Error('Authenticator not found');
        }
        let verification;
        try {
            verification = await (0, server_1.verifyAuthenticationResponse)({
                response,
                expectedChallenge: user.currentChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                authenticator: {
                    credentialID: Buffer.from(authenticator.credentialID, 'base64'),
                    credentialPublicKey: authenticator.credentialPublicKey,
                    counter: Number(authenticator.counter),
                },
            });
        }
        catch (error) {
            throw new Error(`Failed to verify authentication: ${error}`);
        }
        if (verification.verified) {
            await database_1.db.authenticator.update({
                where: { id: authenticator.id },
                data: {
                    counter: verification.authenticationInfo.newCounter,
                    lastUsed: new Date(),
                },
            });
            await database_1.db.user.update({
                where: { id: userId },
                data: { currentChallenge: null },
            });
        }
        return verification;
    }
    async listAuthenticators(userId) {
        return database_1.db.authenticator.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                credentialDeviceType: true,
                credentialBackedUp: true,
                lastUsed: true,
                createdAt: true,
            },
        });
    }
    async removeAuthenticator(authenticatorId, userId) {
        await database_1.db.authenticator.deleteMany({
            where: {
                id: authenticatorId,
                userId,
            },
        });
    }
}
exports.WebAuthnService = WebAuthnService;
