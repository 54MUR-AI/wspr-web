import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';

interface ChatMessageProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, timestamp, isOwn, status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return <DoneAllIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
      case 'delivered':
        return <DoneAllIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
      case 'sent':
        return <DoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
      case 'failed':
        return <Typography color="error" variant="caption">Failed</Typography>;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          maxWidth: '70%',
          p: 2,
          backgroundColor: isOwn ? 'primary.main' : 'background.paper',
          color: isOwn ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          position: 'relative',
        }}
      >
        <Typography variant="body1">{content}</Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            mt: 1,
            gap: 0.5,
          }}
        >
          <Typography
            variant="caption"
            color={isOwn ? 'primary.contrastText' : 'text.secondary'}
            sx={{ opacity: 0.7 }}
          >
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </Typography>
          {isOwn && getStatusIcon()}
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatMessage;
