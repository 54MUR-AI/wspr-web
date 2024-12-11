import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  TextField,
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Contact {
  id: string;
  username: string;
  status: string;
  lastSeen: string;
}

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');

  useEffect(() => {
    // TODO: Fetch contacts from API
    const mockContacts: Contact[] = [
      {
        id: '1',
        username: 'Alice',
        status: 'Online',
        lastSeen: new Date().toISOString(),
      },
      {
        id: '2',
        username: 'Bob',
        status: 'Offline',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    setContacts(mockContacts);
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleAddContact = async () => {
    try {
      // TODO: Implement add contact logic
      setOpenAddDialog(false);
      setNewContactEmail('');
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleStartChat = (contactId: string) => {
    navigate(`/chat/${contactId}`);
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      // TODO: Implement delete contact logic
      setContacts(contacts.filter(contact => contact.id !== contactId));
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">
            Contacts
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Contact
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={handleSearch}
          sx={{ mb: 3 }}
        />

        <List>
          {filteredContacts.map((contact) => (
            <ListItem key={contact.id} divider>
              <ListItemAvatar>
                <Avatar>{contact.username[0].toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={contact.username}
                secondary={`${contact.status} • Last seen ${new Date(contact.lastSeen).toLocaleString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="chat"
                  onClick={() => handleStartChat(contact.id)}
                  sx={{ mr: 1 }}
                >
                  <ChatIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {filteredContacts.length === 0 && (
          <Typography color="textSecondary" align="center" sx={{ mt: 2 }}>
            No contacts found
          </Typography>
        )}

        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Contact Email"
              type="email"
              fullWidth
              variant="outlined"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddContact} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Contacts;
