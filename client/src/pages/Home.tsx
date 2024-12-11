import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Avatar,
  Stack
} from '@mui/material';
import {
  Message as MessageIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { RootState } from '../store';
import { logoutUser } from '../store/slices/authSlice';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const features = [
    {
      title: 'Messages',
      icon: <MessageIcon fontSize="large" />,
      description: 'Send and receive real-time messages with other users',
      action: 'Open Messages',
      path: '/messages'
    },
    {
      title: 'Contacts',
      icon: <PeopleIcon fontSize="large" />,
      description: 'Manage your contacts and find new connections',
      action: 'View Contacts',
      path: '/contacts'
    },
    {
      title: 'Notifications',
      icon: <NotificationsIcon fontSize="large" />,
      description: 'Stay updated with your latest notifications',
      action: 'View All',
      path: '/notifications'
    },
    {
      title: 'Settings',
      icon: <SettingsIcon fontSize="large" />,
      description: 'Customize your profile and preferences',
      action: 'Open Settings',
      path: '/settings'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, borderRadius: 2, mb: 3 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  Welcome back, {user?.username}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your secure communication hub is ready
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Feature Cards */}
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h2" align="center" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {feature.description}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Button size="small" fullWidth onClick={() => handleNavigation(feature.path)}>
                  {feature.action}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="primary" onClick={() => handleNavigation('/messages/new')}>
                New Message
              </Button>
              <Button variant="outlined" color="primary" onClick={() => handleNavigation('/contacts/find')}>
                Find Contacts
              </Button>
              <Button variant="outlined" color="error" onClick={handleLogout}>
                Sign Out
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
