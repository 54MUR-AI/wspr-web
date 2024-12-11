import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  AvatarGroup,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectCurrentGroup, leaveGroup, addMembers } from './groupSlice';
import { Contact } from '../../types';
import ChatWindow from './ChatWindow';

const GroupChat: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentGroup = useAppSelector(selectCurrentGroup);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    // Fetch contacts that can be added to the group
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddMemberClick = () => {
    setAddMemberOpen(true);
    handleMenuClose();
  };

  const handleAddMemberClose = () => {
    setAddMemberOpen(false);
    setSelectedContacts([]);
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleAddMembers = async () => {
    if (currentGroup && selectedContacts.length > 0) {
      try {
        await dispatch(addMembers({ groupId: currentGroup.id, members: selectedContacts })).unwrap();
        handleAddMemberClose();
      } catch (error) {
        console.error('Error adding members:', error);
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (currentGroup) {
      try {
        await dispatch(leaveGroup(currentGroup.id)).unwrap();
      } catch (error) {
        console.error('Error leaving group:', error);
      }
    }
    handleMenuClose();
  };

  if (!currentGroup) return null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Group Header */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={currentGroup.avatar}
              alt={currentGroup.name}
              sx={{ width: 48, height: 48, mr: 2 }}
            />
            <Box>
              <Typography variant="h6">{currentGroup.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {currentGroup.members.length} members
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AvatarGroup max={3} sx={{ mr: 2 }}>
              {currentGroup.members.map((member) => (
                <Avatar key={member.id} src={member.avatar} alt={member.username} />
              ))}
            </AvatarGroup>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Chat Window */}
      <Box sx={{ flexGrow: 1 }}>
        <ChatWindow isGroup />
      </Box>

      {/* Group Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleAddMemberClick}>
          <PersonAddIcon sx={{ mr: 1 }} /> Add Members
        </MenuItem>
        <MenuItem onClick={handleLeaveGroup}>
          <ExitToAppIcon sx={{ mr: 1 }} /> Leave Group
        </MenuItem>
      </Menu>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onClose={handleAddMemberClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Members to {currentGroup.name}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Search contacts"
            type="search"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {contacts.map((contact) => (
              <ListItem
                key={contact.id}
                button
                onClick={() => handleContactToggle(contact.id)}
                selected={selectedContacts.includes(contact.id)}
              >
                <ListItemAvatar>
                  <Avatar src={contact.avatar} alt={contact.username} />
                </ListItemAvatar>
                <ListItemText primary={contact.username} />
                <ListItemSecondaryAction>
                  {selectedContacts.includes(contact.id) && (
                    <IconButton edge="end">
                      <PersonAddIcon color="primary" />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddMemberClose}>Cancel</Button>
          <Button
            onClick={handleAddMembers}
            color="primary"
            disabled={selectedContacts.length === 0}
          >
            Add ({selectedContacts.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupChat;
