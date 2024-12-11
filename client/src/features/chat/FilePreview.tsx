import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Movie as VideoIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '../../app/hooks';
import { downloadFile } from './chatSlice';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  };
  onClose: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
  const dispatch = useAppDispatch();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await dispatch(downloadFile(file.id)).unwrap();
      
      // Create a temporary link to trigger the download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const renderPreview = () => {
    const type = file.type.split('/')[0];
    
    switch (type) {
      case 'image':
        return (
          <Box
            component="img"
            src={file.url}
            alt={file.name}
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
            }}
          />
        );
      case 'video':
        return (
          <Box
            component="video"
            controls
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
            }}
          >
            <source src={file.url} type={file.type} />
            Your browser does not support the video tag.
          </Box>
        );
      case 'audio':
        return (
          <Box
            component="audio"
            controls
            sx={{
              width: '100%',
            }}
          >
            <source src={file.url} type={file.type} />
            Your browser does not support the audio tag.
          </Box>
        );
      default:
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 4,
            }}
          >
            <FileIcon sx={{ fontSize: 72, color: 'primary.main' }} />
            <Typography variant="h6">{file.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatFileSize(file.size)}
            </Typography>
          </Box>
        );
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
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {file.name}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleDownload} disabled={downloading}>
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
          }}
        >
          {renderPreview()}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreview;
