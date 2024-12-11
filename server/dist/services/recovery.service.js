"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryService = void 0;
const crypto_1 = require("crypto");
const util_1 = require("util");
const database_1 = require("../database");
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
class RecoveryService {
    constructor() {
        this.keyLength = 32;
        this.saltLength = 16;
    }
    static getInstance() {
        if (!RecoveryService.instance) {
            RecoveryService.instance = new RecoveryService();
        }
        return RecoveryService.instance;
    }
    async generateRecoveryKey() {
        const key = (0, crypto_1.randomBytes)(this.keyLength).toString('base64');
        return key.replace(/[+/=]/g, '').substring(0, 20);
    }
    async hashKey(key, salt) {
        const useSalt = salt || (0, crypto_1.randomBytes)(this.saltLength);
        const hash = (await scryptAsync(key, useSalt, this.keyLength));
        return { hash, salt: useSalt };
    }
    async createRecoveryKey(userId) {
        const key = await this.generateRecoveryKey();
        const { hash, salt } = await this.hashKey(key);
        await database_1.db.recoveryKey.create({
            data: {
                userId,
                hash: hash,
                salt: salt,
                used: false,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });
        return key;
    }
    async verifyRecoveryKey(userId, key) {
        const recoveryKey = await database_1.db.recoveryKey.findFirst({
            where: {
                userId,
                used: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!recoveryKey) {
            throw new Error('No valid recovery key found');
        }
        const { hash } = await this.hashKey(key, recoveryKey.salt);
        if (!hash.equals(recoveryKey.hash)) {
            throw new Error('Invalid recovery key');
        }
        // Mark the key as used
        await database_1.db.recoveryKey.update({
            where: { id: recoveryKey.id },
            data: { used: true },
        });
        return true;
    }
    async listRecoveryKeys(userId) {
        return database_1.db.recoveryKey.findMany({
            where: { userId },
            select: {
                id: true,
                createdAt: true,
                expiresAt: true,
                used: true,
            },
        });
    }
    async removeRecoveryKey(keyId, userId) {
        await database_1.db.recoveryKey.deleteMany({
            where: {
                id: keyId,
                userId,
            },
        });
    }
    async removeExpiredKeys() {
        await database_1.db.recoveryKey.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { used: true },
                ],
            },
        });
    }
}
exports.RecoveryService = RecoveryService;
