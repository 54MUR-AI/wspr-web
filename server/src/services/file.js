const crypto = require('crypto');
const { Storage } = require('@google-cloud/storage');
const EncryptionService = require('./encryption');

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET);

const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const hash = crypto.createHash('sha256')
    .update(`${timestamp}-${originalName}`)
    .digest('hex')
    .substring(0, 12);
  return `${hash}-${originalName}`;
};

exports.uploadFile = async (file, userId, recipientId, recipientPublicKey) => {
  try {
    const fileName = generateFileName(file.originalname);
    
    // Encrypt file and metadata
    const encryptedData = await EncryptionService.encryptFile(file.buffer, recipientPublicKey);
    const metadata = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      timestamp: Date.now(),
    };
    const encryptedMetadata = await EncryptionService.encryptMetadata(metadata, recipientPublicKey);
    
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: 'application/octet-stream',
        metadata: {
          userId,
          recipientId,
          encrypted: true,
          encryptedKey: encryptedData.encryptedKey,
          iv: encryptedData.iv,
          authTag: encryptedData.authTag,
          encryptedMetadata,
        },
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        reject(error);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve({
          fileName,
          fileUrl: publicUrl,
          ...metadata,
        });
      });

      blobStream.end(encryptedData.encryptedFile);
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

exports.downloadFile = async (fileName, userId, privateKey) => {
  try {
    const file = bucket.file(fileName);
    const [fileData] = await file.download();
    const [metadata] = await file.getMetadata();
    
    if (userId !== metadata.metadata.userId && userId !== metadata.metadata.recipientId) {
      throw new Error('Unauthorized access to file');
    }

    // Decrypt file using the stored encryption data
    const encryptedData = {
      encryptedFile: fileData,
      encryptedKey: metadata.metadata.encryptedKey,
      iv: metadata.metadata.iv,
      authTag: metadata.metadata.authTag,
    };

    const decryptedFile = await EncryptionService.decryptFile(encryptedData, privateKey);
    const decryptedMetadata = await EncryptionService.decryptMetadata(
      metadata.metadata.encryptedMetadata,
      privateKey
    );

    return {
      content: decryptedFile,
      metadata: decryptedMetadata,
    };
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

exports.deleteFile = async (fileName, userId) => {
  try {
    const file = bucket.file(fileName);
    const [metadata] = await file.getMetadata();
    
    if (userId !== metadata.metadata.userId) {
      throw new Error('Unauthorized to delete file');
    }

    await file.delete();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
