import React from 'react';
import { Box, Grid } from '@mui/material';
import ThreadList from './ThreadList';
import ChatWindow from './ChatWindow';

const ChatLayout: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <Grid container>
        <Grid item xs={3} sx={{ borderRight: 1, borderColor: 'divider' }}>
          <ThreadList />
        </Grid>
        <Grid item xs={9}>
          <ChatWindow />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatLayout;
