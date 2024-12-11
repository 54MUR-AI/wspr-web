import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
}

const FindContacts = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy data for demonstration
  const users: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'Active now' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: '2 hours ago' },
    { id: '3', name: 'Alice Johnson', email: 'alice@example.com', status: 'Active now' },
    { id: '4', name: 'Bob Wilson', email: 'bob@example.com', status: '1 day ago' },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContact = (userId: string) => {
    // TODO: Implement add contact logic
    console.log('Adding contact:', userId);
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
          gap: 2,
          borderRadius: 0
        }}
      >
        <IconButton onClick={() => navigate('/contacts')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Find Contacts</Typography>
      </Paper>

      {/* Search and Results */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
          {/* Search Input */}
          <TextField
            fullWidth
            label="Search users"
            placeholder="Enter name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* Results List */}
          <List>
            {filteredUsers.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem
                  secondaryAction={
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleAddContact(user.id)}
                    >
                      Add Contact
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{user.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {user.email}
                        </Typography>
                        {' — '}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {user.status}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < filteredUsers.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
            {filteredUsers.length === 0 && (
              <Typography variant="body1" color="text.secondary" align="center">
                No users found matching "{searchQuery}"
              </Typography>
            )}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default FindContacts;
