import React, { useEffect, useState } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Badge,
  Divider,
} from '@mui/material';
import { VideoCall as VideoCallIcon } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectContacts, setCurrentContact } from './chatSlice';
import { Contact } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';

const ContactList: React.FC = () => {
  const dispatch = useAppDispatch();
  const contacts = useAppSelector(selectContacts);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to online status updates
    const socket = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3001');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'online_users') {
        setOnlineUsers(new Set(data.users));
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleContactClick = (contact: Contact) => {
    dispatch(setCurrentContact(contact));
  };

  const handleVideoCall = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement video call initialization
  };

  return (
    <Paper elevation={3} sx={{ height: '100%', overflow: 'auto' }}>
      <List sx={{ p: 0 }}>
        {contacts.map((contact, index) => (
          <React.Fragment key={contact.id}>
            <ListItem
              button
              onClick={() => handleContactClick(contact)}
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={onlineUsers.has(contact.id) ? 'success' : 'error'}
                >
                  <Avatar src={contact.avatar} alt={contact.username} />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={contact.username}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{
                        display: 'block',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {contact.lastMessage}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {contact.lastMessageAt && formatRelativeTime(contact.lastMessageAt)}
                    </Typography>
                  </>
                }
              />
              <IconButton
                color="primary"
                onClick={(e) => handleVideoCall(contact.id, e)}
                sx={{ ml: 1 }}
              >
                <VideoCallIcon />
              </IconButton>
            </ListItem>
            {index < contacts.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default ContactList;
