import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  AvatarGroup,
  Divider,
  Button,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';
import { addMessage } from '../../store/slices/messagesSlice';

const ChatWindow = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState('');

  const conversation = useSelector((state: RootState) =>
    state.messages.conversations.find(conv => conv.id === conversationId)
  );

  const messages = useSelector((state: RootState) =>
    state.messages.messages[conversationId || ''] || []
  );

  if (!conversation) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Conversation not found</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/messages')}
          sx={{ mt: 2 }}
        >
          Back to Messages
        </Button>
      </Box>
    );
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      dispatch(addMessage({
        conversationId: conversationId!,
        content: newMessage.trim(),
      }));
      setNewMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderRadius: 0,
        }}
      >
        <IconButton onClick={() => navigate('/messages')}>
          <ArrowBackIcon />
        </IconButton>

        {/* Participant Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 2 }}>
          {conversation.participants.length === 1 ? (
            <Avatar>{conversation.participants[0].name[0]}</Avatar>
          ) : (
            <AvatarGroup max={3}>
              {conversation.participants.map(participant => (
                <Avatar key={participant.id}>{participant.name[0]}</Avatar>
              ))}
            </AvatarGroup>
          )}
          <Box>
            <Typography variant="subtitle1">
              {conversation.participants.map(p => p.name).join(', ')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {conversation.participants.length > 1
                ? `${conversation.participants.length} participants`
                : 'Online'}
            </Typography>
          </Box>
        </Box>

        <IconButton>
          <MoreVertIcon />
        </IconButton>
      </Paper>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              flexDirection: msg.senderId === 'currentUser' ? 'row-reverse' : 'row',
              gap: 1,
              maxWidth: '70%',
              alignSelf: msg.senderId === 'currentUser' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.senderId !== 'currentUser' && (
              <Avatar
                sx={{ width: 32, height: 32 }}
              >
                {conversation.participants.find(p => p.id === msg.senderId)?.name[0]}
              </Avatar>
            )}
            <Paper
              sx={{
                p: 2,
                bgcolor: msg.senderId === 'currentUser' ? 'primary.main' : 'background.paper',
                color: msg.senderId === 'currentUser' ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
              }}
            >
              <Typography variant="body1">{msg.content}</Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  color: msg.senderId === 'currentUser' ? 'primary.contrastText' : 'text.secondary',
                  opacity: 0.8,
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Message Input */}
      <Paper
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{ alignSelf: 'flex-end' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatWindow;
