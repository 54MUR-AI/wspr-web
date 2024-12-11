import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Avatar,
  Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = React.useState({
    notifications: true,
    darkMode: false,
    twoFactorAuth: false,
    language: 'English'
  });

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
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
          borderRadius: 0
        }}
      >
        <Typography variant="h6">Settings</Typography>
      </Paper>

      {/* Settings Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Paper sx={{ maxWidth: 800, mx: 'auto' }}>
          {/* Profile Section */}
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ width: 80, height: 80 }}
            >
              JD
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">John Doe</Typography>
              <Typography variant="body2" color="text.secondary">
                john.doe@example.com
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonIcon />}
                sx={{ mt: 1 }}
              >
                Edit Profile
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Settings List */}
          <List>
            {/* Notifications */}
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Notifications"
                secondary="Enable push notifications"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={settings.notifications}
                  onChange={() => handleToggle('notifications')}
                />
              </ListItemSecondaryAction>
            </ListItem>

            {/* Dark Mode */}
            <ListItem>
              <ListItemIcon>
                <PaletteIcon />
              </ListItemIcon>
              <ListItemText
                primary="Dark Mode"
                secondary="Use dark theme"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={settings.darkMode}
                  onChange={() => handleToggle('darkMode')}
                />
              </ListItemSecondaryAction>
            </ListItem>

            {/* Security */}
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Two-Factor Authentication"
                secondary="Enable 2FA for enhanced security"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={settings.twoFactorAuth}
                  onChange={() => handleToggle('twoFactorAuth')}
                />
              </ListItemSecondaryAction>
            </ListItem>

            {/* Language */}
            <ListItem>
              <ListItemIcon>
                <LanguageIcon />
              </ListItemIcon>
              <ListItemText
                primary="Language"
                secondary={settings.language}
              />
              <ListItemSecondaryAction>
                <Button size="small">
                  Change
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          {/* Version Info */}
          <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="body2" color="text.secondary" align="center">
              WSPR Web v1.0.0
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Settings;
