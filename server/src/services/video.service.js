const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');

ffmpeg.setFfmpegPath(ffmpegPath);

class VideoService {
  constructor() {
    this.processingDir = path.join(__dirname, '../../processing');
    this.initializeDirectories();
  }

  async initializeDirectories() {
    await fs.mkdir(this.processingDir, { recursive: true });
  }

  async processVideo(inputBuffer, options = {}) {
    const {
      maxWidth = 1280,
      maxHeight = 720,
      videoBitrate = '1000k',
      audioBitrate = '128k',
      format = 'mp4',
    } = options;

    const tempId = uuidv4();
    const inputPath = path.join(this.processingDir, `${tempId}_input.${format}`);
    const outputPath = path.join(this.processingDir, `${tempId}_output.${format}`);
    const thumbnailPath = path.join(this.processingDir, `${tempId}_thumb.jpg`);

    try {
      // Write input buffer to temporary file
      await fs.writeFile(inputPath, inputBuffer);

      // Process video
      await this.compressVideo(inputPath, outputPath, {
        maxWidth,
        maxHeight,
        videoBitrate,
        audioBitrate,
      });

      // Generate thumbnail
      await this.generateThumbnail(inputPath, thumbnailPath);

      // Read processed files
      const [videoBuffer, thumbnailBuffer] = await Promise.all([
        fs.readFile(outputPath),
        fs.readFile(thumbnailPath),
      ]);

      return {
        video: videoBuffer,
        thumbnail: thumbnailBuffer,
      };
    } finally {
      // Clean up temporary files
      await Promise.all([
        fs.unlink(inputPath).catch(() => {}),
        fs.unlink(outputPath).catch(() => {}),
        fs.unlink(thumbnailPath).catch(() => {}),
      ]);
    }
  }

  compressVideo(inputPath, outputPath, options) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .size(`${options.maxWidth}x${options.maxHeight}`)
        .videoBitrate(options.videoBitrate)
        .audioBitrate(options.audioBitrate)
        .autopad()
        .format('mp4')
        .outputOptions([
          '-movflags faststart',
          '-preset fast',
          '-crf 28',
          '-c:v libx264',
          '-c:a aac',
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
  }

  generateThumbnail(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ['10%'],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x180',
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }

  async createHLSStream(inputBuffer, options = {}) {
    const {
      segmentDuration = 10,
      playlistSize = 10,
      baseUrl = '/streams',
    } = options;

    const streamId = uuidv4();
    const streamDir = path.join(this.processingDir, streamId);
    const inputPath = path.join(streamDir, 'input.mp4');
    const outputPath = path.join(streamDir, 'stream.m3u8');

    try {
      await fs.mkdir(streamDir, { recursive: true });
      await fs.writeFile(inputPath, inputBuffer);

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-b:v 800k',
            '-b:a 96k',
            '-f hls',
            `-hls_time ${segmentDuration}`,
            `-hls_list_size ${playlistSize}`,
            '-hls_segment_filename',
            path.join(streamDir, 'segment_%03d.ts'),
          ])
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      return {
        streamId,
        playlistUrl: `${baseUrl}/${streamId}/stream.m3u8`,
        streamDir,
      };
    } catch (error) {
      await fs.rm(streamDir, { recursive: true, force: true });
      throw error;
    }
  }

  async cleanupStream(streamId) {
    const streamDir = path.join(this.processingDir, streamId);
    await fs.rm(streamDir, { recursive: true, force: true });
  }
}

module.exports = new VideoService();
