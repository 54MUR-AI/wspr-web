import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Avatar } from '@mui/material';
import { Send as SendIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectCurrentContact } from './chatSlice';
import { Message } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';
import { formatRelativeTime } from '../../utils/dateUtils';

const ChatWindow: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentContact = useAppSelector(selectCurrentContact);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, connected } = useWebSocket();

  useEffect(() => {
    if (currentContact) {
      // Fetch message history
      fetchMessages();
    }
  }, [currentContact]);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('message_status', handleMessageStatus);

      return () => {
        socket.off('new_message');
        socket.off('message_status');
      };
    }
  }, [socket]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${currentContact?.id}`);
      const data = await response.json();
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    scrollToBottom();
  };

  const handleMessageStatus = ({ messageId, status }: { messageId: string; status: string }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      )
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim() || !currentContact || !connected) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: currentContact.id,
          content: message,
          type: 'text',
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        {currentContact && (
          <>
            <Avatar src={currentContact.avatar} alt={currentContact.username} />
            <Box sx={{ ml: 2 }}>
              <Typography variant="h6">{currentContact.username}</Typography>
              <Typography variant="body2" color="text.secondary">
                {connected ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.senderId === currentContact?.id ? 'flex-start' : 'flex-end',
              mb: 2,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: msg.senderId === currentContact?.id ? 'background.paper' : 'primary.main',
                color: msg.senderId === currentContact?.id ? 'text.primary' : 'primary.contrastText',
              }}
            >
              <Typography variant="body1">{msg.content}</Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                {formatRelativeTime(msg.createdAt)}
                {msg.senderId !== currentContact?.id && (
                  <span style={{ marginLeft: 8 }}>{msg.status}</span>
                )}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="primary" aria-label="attach file">
            <AttachFileIcon />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            sx={{ mx: 1 }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!message.trim() || !connected}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatWindow;
