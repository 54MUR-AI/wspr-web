import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { RootState } from '@/store';
import {
  fetchScheduledMessages,
  createScheduledMessage,
  updateScheduledMessage,
  deleteScheduledMessage,
} from '@/store/slices/scheduledMessageSlice';

interface ScheduledMessagesProps {
  open: boolean;
  onClose: () => void;
  onSchedule?: (message: any) => void;
  message?: string;
  chatId: string;
}

const ScheduledMessages: React.FC<ScheduledMessagesProps> = ({
  open,
  onClose,
  message = '',
  chatId,
}) => {
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector(
    (state: RootState) => state.scheduledMessages
  );

  const [editMode, setEditMode] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState(message);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(new Date());
  const [recurrencePattern, setRecurrencePattern] = useState<string>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchScheduledMessages());
    }
  }, [dispatch, open]);

  const handleSchedule = async () => {
    if (!scheduledTime) return;

    const scheduleData = {
      chatId,
      content: editMessage,
      scheduledTime: scheduledTime.toISOString(),
      ...(recurrencePattern !== 'none' && {
        recurrence: {
          pattern: recurrencePattern,
          interval: recurrenceInterval,
          ...(recurrenceEndDate && { endDate: recurrenceEndDate.toISOString() }),
        },
      }),
    };

    if (editMode && editMode !== 'new') {
      await dispatch(
        updateScheduledMessage({
          id: editMode,
          message: scheduleData,
        })
      );
    } else {
      await dispatch(createScheduledMessage(scheduleData));
    }

    resetForm();
  };

  const handleEdit = (scheduledMessage: any) => {
    setEditMode(scheduledMessage.id);
    setEditMessage(scheduledMessage.content);
    setScheduledTime(new Date(scheduledMessage.scheduledTime));
    if (scheduledMessage.recurrence) {
      setRecurrencePattern(scheduledMessage.recurrence.pattern);
      setRecurrenceInterval(scheduledMessage.recurrence.interval);
      setRecurrenceEndDate(
        scheduledMessage.recurrence.endDate
          ? new Date(scheduledMessage.recurrence.endDate)
          : null
      );
    }
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteScheduledMessage(id));
  };

  const resetForm = () => {
    setEditMode(null);
    setEditMessage('');
    setScheduledTime(new Date());
    setRecurrencePattern('none');
    setRecurrenceInterval(1);
    setRecurrenceEndDate(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editMode ? 'Edit Scheduled Message' : 'Schedule Message'}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ mb: 4, mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Schedule Time"
                value={scheduledTime}
                onChange={(newValue) => setScheduledTime(newValue)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Recurrence</InputLabel>
                <Select
                  value={recurrencePattern}
                  onChange={(e) => setRecurrencePattern(e.target.value)}
                  label="Recurrence"
                >
                  <MenuItem value="none">No Recurrence</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {recurrencePattern !== 'none' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Interval"
                    value={recurrenceInterval}
                    onChange={(e) =>
                      setRecurrenceInterval(parseInt(e.target.value))
                    }
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="End Date (Optional)"
                    value={recurrenceEndDate}
                    onChange={(newValue) => setRecurrenceEndDate(newValue)}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {messages
              .filter((m) => m.chatId === chatId)
              .map((scheduledMessage) => (
                <ListItem key={scheduledMessage.id}>
                  <ListItemText
                    primary={scheduledMessage.content}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Scheduled for:{' '}
                          {new Date(
                            scheduledMessage.scheduledTime
                          ).toLocaleString()}
                        </Typography>
                        {scheduledMessage.recurrence && (
                          <Typography variant="body2" color="text.secondary">
                            Repeats: {scheduledMessage.recurrence.pattern} (every{' '}
                            {scheduledMessage.recurrence.interval}{' '}
                            {scheduledMessage.recurrence.pattern})
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEdit(scheduledMessage)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(scheduledMessage.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSchedule}
          variant="contained"
          color="primary"
          disabled={!editMessage || !scheduledTime}
        >
          {editMode ? 'Update Schedule' : 'Schedule Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduledMessages;
