import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Badge
} from '@mui/material';
import {
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'message' | 'contact' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const Notifications = () => {
  // Dummy data for demonstration
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'message',
      title: 'New Message',
      description: 'John Doe sent you a message',
      timestamp: '5 min ago',
      read: false
    },
    {
      id: '2',
      type: 'contact',
      title: 'Contact Request',
      description: 'Jane Smith wants to connect with you',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: '3',
      type: 'system',
      title: 'System Update',
      description: 'New features are available',
      timestamp: '1 day ago',
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageIcon />;
      case 'contact':
        return <PersonAddIcon />;
      default:
        return <NotificationsActiveIcon />;
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
          justifyContent: 'space-between',
          borderRadius: 0
        }}
      >
        <Typography variant="h6">Notifications</Typography>
      </Paper>

      {/* Notifications List */}
      <List sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper' }}>
        {notifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem
              alignItems="flex-start"
              button
              sx={{
                bgcolor: notification.read ? 'inherit' : 'action.hover'
              }}
              secondaryAction={
                <IconButton edge="end" aria-label="options">
                  <MoreVertIcon />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Badge
                  color="error"
                  variant="dot"
                  invisible={notification.read}
                  overlap="circular"
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <Avatar sx={{ bgcolor: notification.read ? 'grey.500' : 'primary.main' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography
                      component="span"
                      variant="subtitle1"
                      color="text.primary"
                      sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {notification.timestamp}
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
                    {notification.description}
                  </Typography>
                }
              />
            </ListItem>
            {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
        {notifications.length === 0 && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ p: 3 }}>
            No notifications
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default Notifications;
