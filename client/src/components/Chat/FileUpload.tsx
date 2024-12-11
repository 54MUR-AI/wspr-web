import React, { useRef, useState } from 'react';
import { FileIcon, Loader2Icon, XIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { uploadService, UploadProgress } from '../../services/upload.service';

interface FileUploadProps {
  recipientId: string;
  onUploadComplete: (fileId: string) => void;
  onCancel: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  recipientId,
  onUploadComplete,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      handleUpload(selectedFile);
    }
  };

  const handleUpload = async (selectedFile: File) => {
    try {
      const metadata = await uploadService.uploadFile(
        selectedFile,
        recipientId,
        (progress) => {
          setProgress(progress);
        }
      );

      onUploadComplete(metadata.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setFile(null);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setProgress(null);
    setError(null);
    onCancel();
  };

  return (
    <div className="p-4 bg-muted rounded-lg">
      {!file && !error && (
        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileIcon className="w-4 h-4 mr-2" />
            Select File
          </Button>
          <p className="text-sm text-muted-foreground">
            Maximum file size: 100MB
          </p>
        </div>
      )}

      {file && progress && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={progress.percentage === 100}
            >
              {progress.percentage === 100 ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <XIcon className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Progress value={progress.percentage} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {formatBytes(progress.loaded)} of {formatBytes(progress.total)}
              </span>
              <span>{progress.percentage}%</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Try Again
          </Button>
        </div>
      )}
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

export default FileUpload;
