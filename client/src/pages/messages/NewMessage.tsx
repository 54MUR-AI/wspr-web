import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Avatar,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { addConversation } from '../../store/slices/messagesSlice';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const NewMessage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [recipients, setRecipients] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUsers(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSend = () => {
    if (recipients.length > 0 && message.trim()) {
      dispatch(addConversation({
        recipients,
        message: message.trim()
      }));
      navigate('/messages');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/messages')}
          sx={{ mt: 2 }}
        >
          Back to Messages
        </Button>
      </Box>
    );
  }

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
        <IconButton onClick={() => navigate('/messages')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">New Message</Typography>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
          {/* Recipients */}
          <Autocomplete
            multiple
            options={users}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={recipients}
            onChange={(_, newValue) => setRecipients(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="To"
                placeholder="Search users"
                fullWidth
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={option.id}
                    avatar={
                      <Avatar>
                        {option.avatar || option.name[0].toUpperCase()}
                      </Avatar>
                    }
                    label={option.name}
                    {...tagProps}
                  />
                );
              })
            }
            sx={{ mb: 3 }}
          />

          {/* Message Input */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* Send Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={handleSend}
              disabled={recipients.length === 0 || !message.trim()}
            >
              Send
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default NewMessage;
