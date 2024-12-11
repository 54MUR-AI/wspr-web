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
  Divider,
  IconButton,
  InputBase,
  Fab
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

const Contacts = () => {
  // Dummy data for demonstration
  const contacts = [
    {
      id: '1',
      name: 'John Doe',
      status: 'Online',
      lastSeen: 'Active now'
    },
    {
      id: '2',
      name: 'Jane Smith',
      status: 'Offline',
      lastSeen: '2 hours ago'
    },
    {
      id: '3',
      name: 'Alice Johnson',
      status: 'Online',
      lastSeen: 'Active now'
    }
  ];

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
        <Typography variant="h6">Contacts</Typography>
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
              placeholder="Search contacts"
              inputProps={{ 'aria-label': 'search contacts' }}
            />
            <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </Paper>
        </Box>
      </Paper>

      {/* Contact List */}
      <List sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper' }}>
        {contacts.map((contact, index) => (
          <React.Fragment key={contact.id}>
            <ListItem
              alignItems="flex-start"
              button
              secondaryAction={
                <IconButton edge="end" aria-label="options">
                  <MoreVertIcon />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar>{contact.name[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={contact.name}
                secondary={
                  <Typography
                    sx={{ display: 'inline' }}
                    component="span"
                    variant="body2"
                    color={contact.status === 'Online' ? 'success.main' : 'text.secondary'}
                  >
                    {contact.status} • {contact.lastSeen}
                  </Typography>
                }
              />
            </ListItem>
            {index < contacts.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>

      {/* Floating Action Button for adding contacts */}
      <Fab
        color="primary"
        aria-label="add contact"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => window.location.href = '/contacts/find'}
      >
        <PersonAddIcon />
      </Fab>
    </Box>
  );
};

export default Contacts;
