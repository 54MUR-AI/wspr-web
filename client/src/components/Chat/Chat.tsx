import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Tooltip
} from '@mui/material';
import { RootState } from '@/store';
import { fetchChats } from '@/store/slices/chatSlice';
import ChatList from './ChatList';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TemplateIcon from '@mui/icons-material/Assignment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { env } from '@/utils/env';

const Chat: React.FC = () => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chats, activeChat, loading, error } = useSelector((state: RootState) => state.chat);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [showScheduled, setShowScheduled] = React.useState(false);

  const activeMessages = activeChat
    ? chats.find((chat) => chat.id === activeChat)?.messages || []
    : [];

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  if (loading) {
    return <Typography>Loading chats...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Chat List Sidebar */}
      <Paper
        elevation={2}
        sx={{
          width: 320,
          borderRight: 1,
          borderColor: 'divider',
          display: { xs: activeChat ? 'none' : 'block', sm: 'block' },
        }}
      >
        <Typography variant="h6" sx={{ p: 2 }}>
          Chats
        </Typography>
        <Divider />
        <ChatList />
      </Paper>

      {/* Chat Window */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          display: { xs: !activeChat ? 'none' : 'flex', sm: 'flex' },
        }}
      >
        {activeChat ? (
          <>
            {/* Chat Toolbar */}
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar variant="dense">
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Message Templates">
                  <IconButton 
                    onClick={() => setShowTemplates(true)}
                    size="small"
                  >
                    <TemplateIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Scheduled Messages">
                  <IconButton 
                    onClick={() => setShowScheduled(true)}
                    size="small"
                  >
                    <Badge badgeContent={4} color="primary">
                      <ScheduleIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </AppBar>

            {/* Messages Area */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                backgroundColor: 'grey.50',
              }}
            >
              {activeMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  timestamp={message.timestamp}
                  isOwn={message.senderId === userId}
                  status={message.status}
                />
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2 }}>
              <ChatInput chatId={activeChat} />
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" color="textSecondary">
              Select a chat to start messaging
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Chat;
