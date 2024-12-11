import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { RootState, AppDispatch } from '../store';
import { fetchChats, sendMessage } from '../store/slices/chatSlice';

const Chat: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { chats, activeChat, loading } = useSelector((state: RootState) => state.chat);
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !message.trim()) return;

    try {
      await dispatch(sendMessage({
        chatId: activeChat,
        content: message.trim(),
      })).unwrap();
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return <Typography>Loading chats...</Typography>;
  }

  const activeMessages = chats.find(chat => chat.id === activeChat)?.messages || [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <List
          sx={{
            flex: 1,
            overflow: 'auto',
            padding: 2,
          }}
        >
          {activeMessages.map((msg) => (
            <ListItem key={msg.id}>
              <ListItemText
                primary={msg.content}
                secondary={new Date(msg.timestamp).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            type="submit"
            disabled={!message.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chat;
