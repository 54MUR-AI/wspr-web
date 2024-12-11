import React from 'react';
import { Container } from '@mui/material';
import Chat from '@/components/chat/Chat';

const ChatPage: React.FC = () => {
  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100%' }}>
      <Chat />
    </Container>
  );
};

export default ChatPage;
