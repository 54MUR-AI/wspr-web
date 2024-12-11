const path = require('path');
const fs = require('fs/promises');
const schedule = require('node-schedule');

class StreamManager {
  constructor() {
    this.streams = new Map();
    this.cleanupJob = schedule.scheduleJob('*/15 * * * *', this.cleanupOldStreams.bind(this));
  }

  addStream(streamId, streamDir, expiresIn = 3600000) {
    const expiryTime = Date.now() + expiresIn;
    this.streams.set(streamId, {
      streamDir,
      expiryTime,
    });
  }

  getStream(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) return null;

    if (Date.now() > stream.expiryTime) {
      this.removeStream(streamId);
      return null;
    }

    return stream;
  }

  async removeStream(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    try {
      await fs.rm(stream.streamDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error removing stream directory:', error);
    }

    this.streams.delete(streamId);
  }

  async cleanupOldStreams() {
    const now = Date.now();
    const expiredStreams = Array.from(this.streams.entries())
      .filter(([_, data]) => now > data.expiryTime)
      .map(([id]) => id);

    await Promise.all(expiredStreams.map(id => this.removeStream(id)));
  }

  async shutdown() {
    if (this.cleanupJob) {
      this.cleanupJob.cancel();
    }

    await Promise.all(
      Array.from(this.streams.keys()).map(id => this.removeStream(id))
    );
  }
}

module.exports = new StreamManager();
