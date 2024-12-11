import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Image as ImageIcon,
  VideoFile as VideoIcon,
  Description as DocumentIcon,
  AudioFile as AudioIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { mediaService } from '../../services/media.service';
import MediaSearch from './MediaSearch';
import MediaPreview from './MediaPreview';

interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  hasThumbnail?: boolean;
}

interface MediaGalleryProps {
  onSelect?: (media: MediaItem) => void;
  onDelete?: (mediaId: string) => void;
  selectable?: boolean;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  onSelect,
  onDelete,
  selectable = false,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSearch = async (results: MediaItem[]) => {
    setMediaItems(results);
    setError(null);
  };

  const handleSearchError = (error: Error) => {
    setError(error.message);
    setMediaItems([]);
  };

  const handleMediaClick = (item: MediaItem) => {
    if (selectable && onSelect) {
      onSelect(item);
    } else {
      setSelectedItem(item);
      setPreviewOpen(true);
    }
  };

  const handleDelete = async (item: MediaItem, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onDelete) return;

    try {
      await mediaService.deleteMedia(item.id);
      onDelete(item.id);
      setMediaItems(mediaItems.filter(media => media.id !== item.id));
    } catch (error) {
      setError('Failed to delete media item');
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      case 'document':
        return <DocumentIcon />;
      case 'audio':
        return <AudioIcon />;
      default:
        return <DocumentIcon />;
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
    <Box sx={{ width: '100%', p: 2 }}>
      <MediaSearch onSearch={handleSearch} onError={handleSearchError} />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" m={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {mediaItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
                onClick={() => handleMediaClick(item)}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                  }}
                >
                  {item.hasThumbnail ? (
                    <img
                      src={mediaService.getThumbnailUrl(item.id)}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box sx={{ p: 2 }}>{getMediaIcon(item.type)}</Box>
                  )}
                </CardMedia>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography noWrap title={item.name}>
                      {item.name}
                    </Typography>
                    {onDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => handleDelete(item, e)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(item.size)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {selectedItem && (
        <MediaPreview
          media={selectedItem}
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setSelectedItem(null);
          }}
        />
      )}
    </Box>
  );
};

export default MediaGallery;
