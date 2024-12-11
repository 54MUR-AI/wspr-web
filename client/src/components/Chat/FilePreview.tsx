import React, { useEffect, useState } from 'react';
import {
  FileIcon,
  ImageIcon,
  VideoIcon,
  AudioIcon,
  FileTextIcon,
  DownloadIcon,
  XIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { uploadService, FileMetadata } from '../../services/upload.service';

interface FilePreviewProps {
  fileId: string;
  senderId: string;
  onClose?: () => void;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  fileId,
  senderId,
  onClose,
  className,
}) => {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, [fileId]);

  const loadMetadata = async () => {
    try {
      const data = await uploadService.getFileMetadata(fileId);
      setMetadata(data);
    } catch (err) {
      setError('Failed to load file information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!metadata) return;

    try {
      setDownloading(true);
      const blob = await uploadService.downloadFile(fileId, senderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = metadata.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const getFileIcon = () => {
    if (!metadata) return <FileIcon className="w-8 h-8" />;

    if (metadata.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8" />;
    } else if (metadata.type.startsWith('video/')) {
      return <VideoIcon className="w-8 h-8" />;
    } else if (metadata.type.startsWith('audio/')) {
      return <AudioIcon className="w-8 h-8" />;
    } else if (metadata.type.startsWith('text/')) {
      return <FileTextIcon className="w-8 h-8" />;
    }

    return <FileIcon className="w-8 h-8" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <span className="text-sm text-red-500">{error}</span>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <div className="flex items-center gap-3">
        {getFileIcon()}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{metadata.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatBytes(metadata.size)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          disabled={downloading}
        >
          <DownloadIcon className="w-4 h-4" />
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default FilePreview;
