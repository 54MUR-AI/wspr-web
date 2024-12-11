const crypto = require('crypto');
const libsignal = require('libsignal');

class CryptoService {
  static async generateKeyPair() {
    const keyPair = await libsignal.KeyHelper.generateIdentityKeyPair();
    return {
      publicKey: keyPair.pubKey,
      privateKey: keyPair.privKey
    };
  }

  static async generatePreKeys(startId, count) {
    const preKeys = [];
    for (let i = startId; i < startId + count; i++) {
      const preKey = await libsignal.KeyHelper.generatePreKey(i);
      preKeys.push({
        keyId: preKey.keyId,
        keyPair: preKey.keyPair
      });
    }
    return preKeys;
  }

  static async generateSignedPreKey(identityKeyPair, signedPreKeyId) {
    return await libsignal.KeyHelper.generateSignedPreKey(
      identityKeyPair,
      signedPreKeyId
    );
  }

  static async encryptMessage(message, recipientPublicKey, senderPrivateKey) {
    const sessionBuilder = new libsignal.SessionBuilder(
      recipientPublicKey,
      senderPrivateKey
    );
    
    const sessionCipher = new libsignal.SessionCipher(
      recipientPublicKey,
      senderPrivateKey
    );

    await sessionBuilder.processPreKey({
      registrationId: Math.floor(Math.random() * 16384),
      identityKey: recipientPublicKey,
      signedPreKey: await this.generateSignedPreKey(
        { pubKey: recipientPublicKey, privKey: senderPrivateKey },
        1
      ),
      preKey: (await this.generatePreKeys(1, 1))[0]
    });

    return await sessionCipher.encrypt(Buffer.from(message));
  }

  static async decryptMessage(encryptedMessage, recipientPrivateKey, senderPublicKey) {
    const sessionBuilder = new libsignal.SessionBuilder(
      senderPublicKey,
      recipientPrivateKey
    );
    
    const sessionCipher = new libsignal.SessionCipher(
      senderPublicKey,
      recipientPrivateKey
    );

    const decryptedBuffer = await sessionCipher.decrypt(encryptedMessage);
    return decryptedBuffer.toString();
  }

  static generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static async generateSalt() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = CryptoService;
