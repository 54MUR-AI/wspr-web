const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');
const { encryptFile, decryptFile } = require('../utils/crypto');
const videoService = require('./video.service');
const streamManager = require('../utils/stream-manager');

class MediaService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.thumbnailDir = path.join(__dirname, '../../uploads/thumbnails');
    this.streamDir = path.join(__dirname, '../../uploads/streams');
    this.initializeDirs();
  }

  async initializeDirs() {
    await Promise.all([
      fs.mkdir(this.uploadDir, { recursive: true }),
      fs.mkdir(this.thumbnailDir, { recursive: true }),
      fs.mkdir(this.streamDir, { recursive: true }),
    ]);
  }

  async processImage(file, maxWidth = 2000) {
    const image = sharp(file.buffer);
    const metadata = await image.metadata();
    
    if (metadata.width > maxWidth) {
      return image.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      }).toBuffer();
    }
    
    return file.buffer;
  }

  async createThumbnail(buffer, width = 300) {
    return sharp(buffer)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  async uploadFile(file, userId) {
    const fileId = uuidv4();
    const fileType = this.getFileType(file.mimetype);
    let processedBuffer = file.buffer;
    let thumbnailBuffer = null;
    let metadata = {};
    let streamInfo = null;

    // Process based on file type
    if (fileType === 'image') {
      processedBuffer = await this.processImage(file);
      thumbnailBuffer = await this.createThumbnail(processedBuffer);
      const imgMetadata = await sharp(processedBuffer).metadata();
      metadata = {
        width: imgMetadata.width,
        height: imgMetadata.height,
        format: imgMetadata.format
      };
    } else if (fileType === 'video') {
      const processed = await videoService.processVideo(file.buffer);
      processedBuffer = processed.video;
      thumbnailBuffer = processed.thumbnail;
      
      // Create HLS stream for video
      streamInfo = await videoService.createHLSStream(processedBuffer);
      streamManager.addStream(streamInfo.streamId, streamInfo.streamDir);
      
      metadata = {
        streamId: streamInfo.streamId,
        playlistUrl: streamInfo.playlistUrl
      };
    }

    // Encrypt the file
    const encryptedBuffer = await encryptFile(processedBuffer, userId);
    let thumbnailPath = null;

    // Save files
    const filePath = path.join(this.uploadDir, `${fileId}.enc`);
    await fs.writeFile(filePath, encryptedBuffer);

    if (thumbnailBuffer) {
      thumbnailPath = path.join(this.thumbnailDir, `${fileId}.jpg`);
      await fs.writeFile(thumbnailPath, thumbnailBuffer);
    }

    return {
      id: fileId,
      type: fileType,
      size: encryptedBuffer.length,
      metadata,
      hasThumbnail: !!thumbnailBuffer,
      hasStream: !!streamInfo
    };
  }

  async getFile(fileId, userId) {
    const filePath = path.join(this.uploadDir, `${fileId}.enc`);
    const encryptedBuffer = await fs.readFile(filePath);
    return await decryptFile(encryptedBuffer, userId);
  }

  async getThumbnail(fileId) {
    const thumbnailPath = path.join(this.thumbnailDir, `${fileId}.jpg`);
    return await fs.readFile(thumbnailPath);
  }

  async deleteFile(fileId) {
    const filePath = path.join(this.uploadDir, `${fileId}.enc`);
    const thumbnailPath = path.join(this.thumbnailDir, `${fileId}.jpg`);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      // Thumbnail might not exist, ignore error
    }
  }

  async getMediaGallery(threadId, type = 'all', page = 1, limit = 20) {
    // TODO: Implement gallery retrieval from database
    return {
      items: [],
      total: 0,
      page,
      limit
    };
  }
}

module.exports = new MediaService();
