import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  InputBase,
  Fab,
  AvatarGroup
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { RootState } from '../../store';

const Messages = () => {
  const navigate = useNavigate();
  const conversations = useSelector((state: RootState) => state.messages.conversations);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 0
        }}
      >
        <Typography variant="h6">Messages</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: 400
            }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search conversations"
              inputProps={{ 'aria-label': 'search conversations' }}
            />
            <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </Paper>
        </Box>
      </Paper>

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper' }}>
        {conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No conversations yet. Start a new message to begin chatting!
            </Typography>
          </Box>
        ) : (
          conversations.map((conversation, index) => (
            <React.Fragment key={conversation.id}>
              <ListItem
                alignItems="flex-start"
                button
                onClick={() => navigate(`/messages/${conversation.id}`)}
                sx={{
                  bgcolor: conversation.unread ? 'action.hover' : 'inherit'
                }}
                secondaryAction={
                  <IconButton edge="end" aria-label="options">
                    <MoreVertIcon />
                  </IconButton>
                }
              >
                {conversation.participants.length === 1 ? (
                  <ListItemAvatar>
                    <Avatar>
                      {conversation.participants[0].name[0]}
                    </Avatar>
                  </ListItemAvatar>
                ) : (
                  <ListItemAvatar>
                    <AvatarGroup max={2} sx={{ width: 40 }}>
                      {conversation.participants.map(participant => (
                        <Avatar key={participant.id}>
                          {participant.name[0]}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </ListItemAvatar>
                )}
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline'
                      }}
                    >
                      <Typography
                        component="span"
                        variant="subtitle1"
                        color="text.primary"
                        sx={{ fontWeight: conversation.unread ? 'bold' : 'normal' }}
                      >
                        {conversation.participants
                          .map(p => p.name)
                          .join(', ')}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {conversation.timestamp}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      sx={{ display: 'inline' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {conversation.lastMessage}
                    </Typography>
                  }
                />
              </ListItem>
              {index < conversations.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))
        )}
      </List>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/messages/new')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Messages;
