import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Badge } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { RootState } from '@/store';
import { setActiveChat } from '@/store/slices/chatSlice';

const ChatList: React.FC = () => {
  const dispatch = useDispatch();
  const { chats, activeChat, unreadMessages } = useSelector((state: RootState) => state.chat);

  const handleChatSelect = (chatId: string) => {
    dispatch(setActiveChat(chatId));
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {chats.map((chat) => (
        <ListItem
          key={chat.id}
          alignItems="flex-start"
          selected={activeChat === chat.id}
          onClick={() => handleChatSelect(chat.id)}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemAvatar>
            <Badge
              badgeContent={unreadMessages[chat.id] || 0}
              color="primary"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
            >
              <Avatar>
                {chat.participants[0].charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={chat.participants.join(', ')}
            secondary={
              <React.Fragment>
                <Typography
                  sx={{ display: 'inline' }}
                  component="span"
                  variant="body2"
                  color="text.primary"
                >
                  {chat.lastMessage?.content}
                </Typography>
                {chat.lastMessage && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ float: 'right', mt: 1 }}
                  >
                    {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: true })}
                  </Typography>
                )}
              </React.Fragment>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ChatList;
