import cryptoService from './crypto.service';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  encrypted: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class UploadService {
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB

  /**
   * Upload a file with encryption
   */
  async uploadFile(
    file: File,
    recipientId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileMetadata> {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum limit of 100MB');
    }

    try {
      // Generate a unique file ID
      const fileId = crypto.randomUUID();

      // Create file metadata
      const metadata: FileMetadata = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        encrypted: true,
      };

      // Read and encrypt the file
      const encryptedData = await this.encryptFile(file, recipientId, onProgress);

      // Create form data
      const formData = new FormData();
      formData.append('file', encryptedData);
      formData.append('metadata', JSON.stringify(metadata));

      // Upload the encrypted file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return metadata;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  /**
   * Download and decrypt a file
   */
  async downloadFile(fileId: string, senderId: string): Promise<Blob> {
    try {
      // Download the encrypted file
      const response = await fetch(`/api/download/${fileId}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const encryptedBlob = await response.blob();
      const encryptedBuffer = await encryptedBlob.arrayBuffer();

      // Decrypt the file
      const decryptedData = await cryptoService.decryptData(
        senderId,
        new Uint8Array(encryptedBuffer)
      );

      return new Blob([decryptedData]);
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt a file
   */
  private async encryptFile(
    file: File,
    recipientId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Blob> {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Encrypt the file data
    const encryptedData = await cryptoService.encryptData(recipientId, data);

    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
      });
    }

    return new Blob([encryptedData]);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const response = await fetch(`/api/files/${fileId}/metadata`);
    if (!response.ok) {
      throw new Error('Failed to fetch file metadata');
    }
    return await response.json();
  }
}

export const uploadService = new UploadService();
export default uploadService;
