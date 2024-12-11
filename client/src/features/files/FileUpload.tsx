import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Clear as ClearIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../app/hooks';
import { selectUser } from '../auth/authSlice';
import { monitoringService } from '../../services/monitoring';

interface FileUploadProps {
  onUploadComplete: (fileIds: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  id?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
}) => {
  const user = useAppSelector(selectUser);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedTypes.join(','),
  });

  const uploadFile = async (fileWithProgress: FileWithProgress) => {
    const formData = new FormData();
    formData.append('file', fileWithProgress.file);

    const startTime = Date.now();
    let lastUpdate = startTime;
    let lastLoaded = 0;

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          
          // Update file progress
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileWithProgress.file
                ? { ...f, progress, status: 'uploading' }
                : f
            )
          );

          // Track transfer metrics
          const currentTime = Date.now();
          const timeElapsed = currentTime - lastUpdate;
          if (timeElapsed >= 1000) { // Update every second
            const bytesUploaded = progressEvent.loaded - lastLoaded;
            const speed = bytesUploaded / (timeElapsed / 1000); // bytes per second

            monitoringService.trackFileTransfer({
              fileId: fileWithProgress.id || fileWithProgress.file.name,
              userId: user?.id || '',
              timestamp: new Date().toISOString(),
              metrics: {
                bytesTransferred: progressEvent.loaded,
                totalBytes: progressEvent.total,
                speed,
                timeElapsed: currentTime - startTime,
              },
            });

            lastUpdate = currentTime;
            lastLoaded = progressEvent.loaded;
          }
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const { fileId } = await response.json();

      // Track successful upload
      monitoringService.trackPerformance('file_upload_success', 1, {
        userId: user?.id,
        fileSize: fileWithProgress.file.size,
        duration: Date.now() - startTime,
      });

      return fileId;
    } catch (error) {
      // Track failed upload
      monitoringService.logError({
        error,
        errorInfo: {
          component: 'FileUpload',
          method: 'uploadFile',
          userId: user?.id,
          fileName: fileWithProgress.file.name,
          fileSize: fileWithProgress.file.size,
        },
        location: window.location.href,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const fileIds: string[] = [];
    const pendingFiles = files.filter((f) => f.status === 'pending');

    try {
      for (const file of pendingFiles) {
        const fileId = await uploadFile(file);
        fileIds.push(fileId);

        setFiles((prev) =>
          prev.map((f) =>
            f.file === file.file
              ? { ...f, status: 'completed', id: fileId }
              : f
          )
        );
      }

      onUploadComplete(fileIds);
    } catch (error) {
      console.error('Upload failed:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileToRemove: FileWithProgress) => {
    setFiles((prev) => prev.filter((f) => f.file !== fileToRemove.file));
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 1,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop files here'
            : 'Drag and drop files here, or click to select'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Maximum {maxFiles} files, up to {maxSize / (1024 * 1024)}MB each
        </Typography>
      </Box>

      {files.length > 0 && (
        <>
          <List>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <AttachFileIcon />
                </ListItemIcon>
                <ListItemText
                  primary={file.file.name}
                  secondary={
                    file.status === 'error' ? (
                      <Typography color="error">{file.error}</Typography>
                    ) : (
                      <LinearProgress
                        variant="determinate"
                        value={file.progress}
                        sx={{ mt: 1 }}
                      />
                    )
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(file)}
                    disabled={isUploading}
                  >
                    <ClearIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isUploading || files.every((f) => f.status === 'completed')}
              startIcon={isUploading ? <CircularProgress size={20} /> : undefined}
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default FileUpload;
