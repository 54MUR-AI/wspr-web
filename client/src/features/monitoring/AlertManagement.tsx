import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface Alert {
  id: string;
  name: string;
  metric: string;
  condition: 'above' | 'below';
  threshold: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notifyEmail: boolean;
  notifySlack: boolean;
}

const METRIC_OPTIONS = [
  { value: 'cpu_usage', label: 'CPU Usage', unit: '%' },
  { value: 'memory_usage', label: 'Memory Usage', unit: '%' },
  { value: 'network_latency', label: 'Network Latency', unit: 'ms' },
  { value: 'disk_usage', label: 'Disk Usage', unit: '%' },
  { value: 'error_rate', label: 'Error Rate', unit: 'errors/min' },
  { value: 'response_time', label: 'Response Time', unit: 'ms' },
];

const AlertManagement: React.FC = () => {
  const theme = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [formData, setFormData] = useState<Partial<Alert>>({
    name: '',
    metric: '',
    condition: 'above',
    threshold: 0,
    enabled: true,
    severity: 'medium',
    notifyEmail: true,
    notifySlack: false,
  });

  useEffect(() => {
    // Fetch alerts from API
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleOpenDialog = (alert?: Alert) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData(alert);
    } else {
      setEditingAlert(null);
      setFormData({
        name: '',
        metric: '',
        condition: 'above',
        threshold: 0,
        enabled: true,
        severity: 'medium',
        notifyEmail: true,
        notifySlack: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAlert(null);
  };

  const handleInputChange = (field: keyof Alert, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const url = editingAlert 
        ? `/api/alerts/${editingAlert.id}`
        : '/api/alerts';
      
      const method = editingAlert ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchAlerts();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return theme.palette.info.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'high':
        return theme.palette.error.light;
      case 'critical':
        return theme.palette.error.dark;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Alert Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Alert
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Metric</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Threshold</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notifications</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>{alert.name}</TableCell>
                <TableCell>
                  {METRIC_OPTIONS.find(m => m.value === alert.metric)?.label}
                </TableCell>
                <TableCell>
                  {alert.condition} {alert.threshold}
                  {METRIC_OPTIONS.find(m => m.value === alert.metric)?.unit}
                </TableCell>
                <TableCell>{alert.threshold}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      color: getSeverityColor(alert.severity),
                      fontWeight: 'bold',
                    }}
                  >
                    {alert.severity.toUpperCase()}
                  </Box>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={alert.enabled}
                    onChange={() => handleInputChange('enabled', !alert.enabled)}
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  {alert.notifyEmail && 'Email'}
                  {alert.notifyEmail && alert.notifySlack && ', '}
                  {alert.notifySlack && 'Slack'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(alert)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAlert ? 'Edit Alert' : 'Create New Alert'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Alert Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Metric</InputLabel>
              <Select
                value={formData.metric}
                onChange={(e) => handleInputChange('metric', e.target.value)}
                label="Metric"
              >
                {METRIC_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  label="Condition"
                >
                  <MenuItem value="above">Above</MenuItem>
                  <MenuItem value="below">Below</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Threshold"
                type="number"
                value={formData.threshold}
                onChange={(e) => handleInputChange('threshold', Number(e.target.value))}
                fullWidth
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                label="Severity"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                  />
                }
                label="Enable Alert"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifyEmail}
                    onChange={(e) => handleInputChange('notifyEmail', e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifySlack}
                    onChange={(e) => handleInputChange('notifySlack', e.target.checked)}
                  />
                }
                label="Slack Notifications"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingAlert ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertManagement;
