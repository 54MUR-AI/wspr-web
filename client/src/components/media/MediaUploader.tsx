import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { mediaService } from '../../services/media.service';

interface MediaUploaderProps {
  threadId: string;
  messageId: string;
  onUploadComplete: (media: any) => void;
  onError: (error: string) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  threadId,
  messageId,
  onUploadComplete,
  onError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    try {
      // Show preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('threadId', threadId);
      formData.append('messageId', messageId);

      const media = await mediaService.uploadFile(formData, (progressEvent) => {
        const percentage = (progressEvent.loaded * 100) / progressEvent.total;
        setProgress(Math.round(percentage));
      });

      onUploadComplete(media);
    } catch (error) {
      onError('Failed to upload file');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setProgress(0);
      setPreviewUrl(null);
    }
  }, [threadId, messageId, onUploadComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'image/*': [],
      'video/*': [],
      'audio/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    },
  });

  const handleCancel = () => {
    setUploading(false);
    setProgress(0);
    setPreviewUrl(null);
  };

  return (
    <div className="w-full">
      {!uploading && !previewUrl ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag & drop a file here, or click to select'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {previewUrl && (
            <div className="relative w-32 h-32">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
