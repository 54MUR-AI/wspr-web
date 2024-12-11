import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Movie as VideoIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '../../app/hooks';
import { uploadFile } from './chatSlice';

interface FileUploadProps {
  recipientId: string;
  onUploadComplete: (fileData: any) => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ recipientId, onUploadComplete }) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const newFiles = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending' as const,
      }));
      setUploadingFiles((prev) => [...prev, ...newFiles]);
      setShowUploadDialog(true);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCloseDialog = () => {
    setShowUploadDialog(false);
    setUploadingFiles([]);
  };

  const handleUpload = async () => {
    const pendingFiles = uploadingFiles.filter((f) => f.status === 'pending');
    
    await Promise.all(
      pendingFiles.map(async (uploadingFile) => {
        try {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id ? { ...f, status: 'uploading' } : f
            )
          );

          const formData = new FormData();
          formData.append('file', uploadingFile.file);
          formData.append('recipientId', recipientId);

          const response = await dispatch(uploadFile({ formData, onProgress: (progress) => {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadingFile.id ? { ...f, progress } : f
              )
            );
          }})).unwrap();

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id ? { ...f, status: 'completed' } : f
            )
          );

          onUploadComplete(response);
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? { ...f, status: 'error', error: 'Upload failed' }
                : f
            )
          );
        }
      })
    );

    if (!uploadingFiles.some((f) => f.status === 'error')) {
      handleCloseDialog();
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      case 'audio':
        return <AudioIcon />;
      default:
        return <FileIcon />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        multiple
      />
      <IconButton color="primary" onClick={handleUploadClick}>
        <AttachFileIcon />
      </IconButton>

      <Dialog open={showUploadDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Files
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List>
            {uploadingFiles.map((uploadingFile) => (
              <ListItem key={uploadingFile.id}>
                <ListItemIcon>{getFileIcon(uploadingFile.file)}</ListItemIcon>
                <ListItemText
                  primary={uploadingFile.file.name}
                  secondary={formatFileSize(uploadingFile.file.size)}
                />
                <ListItemSecondaryAction sx={{ width: '100px' }}>
                  {uploadingFile.status === 'uploading' && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress variant="determinate" value={uploadingFile.progress} />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">
                          {uploadingFile.progress}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {uploadingFile.status === 'completed' && (
                    <Typography color="success.main">Completed</Typography>
                  )}
                  {uploadingFile.status === 'error' && (
                    <Typography color="error">{uploadingFile.error}</Typography>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleUpload}
            color="primary"
            disabled={uploadingFiles.every((f) => f.status !== 'pending')}
            endIcon={uploadingFiles.some((f) => f.status === 'uploading') && <CircularProgress size={20} />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileUpload;
