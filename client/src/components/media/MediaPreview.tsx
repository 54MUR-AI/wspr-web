import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, X } from 'lucide-react';
import { mediaService } from '../../services/media.service';
import VideoPlayer from './VideoPlayer';
import DocumentPreview from './DocumentPreview';

interface MediaPreviewProps {
  media: {
    id: string;
    type: string;
    filename: string;
    mimeType: string;
    metadata: any;
    hasThumbnail: boolean;
  };
  onClose: () => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ media, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await mediaService.downloadFile(media.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = media.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaType = () => {
    const extension = media.filename.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    }
    if (['mp4', 'm4v', 'webm'].includes(extension)) {
      return 'video';
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'json', 'csv'].includes(extension)) {
      return 'document';
    }
    if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    }
    return 'unknown';
  };

  const renderContent = () => {
    const mediaType = getMediaType();
    const mediaUrl = mediaService.getMediaUrl(media.id);

    switch (mediaType) {
      case 'image':
        return (
          <img
            src={mediaUrl}
            alt={media.filename}
            className="max-w-full max-h-[80vh] object-contain"
          />
        );
      
      case 'video':
        return (
          <VideoPlayer
            src={mediaUrl}
            thumbnail={media.hasThumbnail ? mediaService.getMediaUrl(media.id) : undefined}
            onError={(error) => console.error('Video playback error:', error)}
          />
        );
      
      case 'document':
        return (
          <DocumentPreview
            url={mediaUrl}
            fileType={media.filename.split('.').pop() || ''}
            fileName={media.filename}
          />
        );
      
      case 'audio':
        return (
          <audio
            src={mediaUrl}
            controls
            className="w-full"
          >
            Your browser does not support the audio tag.
          </audio>
        );
      
      default:
        return (
          <div className="text-center p-8">
            Unsupported media type
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{media.filename}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                disabled={loading}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};
