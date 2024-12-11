import React, { useState, KeyboardEvent } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Box, 
  TextField, 
  IconButton, 
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TemplateIcon from '@mui/icons-material/Assignment';
import { sendMessage } from '@/store/slices/chatSlice';
import MessageTemplates from './MessageTemplates';
import ScheduledMessages from './ScheduledMessages';

interface ChatInputProps {
  chatId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ chatId }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      dispatch(sendMessage({ chatId, content: message.trim() }));
      setMessage('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleTemplateSelect = (templateContent: string) => {
    setMessage(templateContent);
    setShowTemplates(false);
  };

  const handleScheduleMessage = (scheduleConfig: any) => {
    // Handle scheduling logic
    setShowScheduler(false);
  };

  const actions = [
    { icon: <TemplateIcon />, name: 'Templates', onClick: () => setShowTemplates(true) },
    { icon: <ScheduleIcon />, name: 'Schedule', onClick: () => setShowScheduler(true) },
  ];

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="primary" aria-label="attach file">
            <AttachFileIcon />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
          />
          <SpeedDial
            ariaLabel="Message actions"
            sx={{ 
              position: 'absolute',
              bottom: 70,
              right: 16,
              '& .MuiSpeedDial-fab': { width: 40, height: 40 }
            }}
            icon={<SpeedDialIcon />}
            direction="up"
            FabProps={{ size: "small" }}
          >
            {actions.map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={action.onClick}
              />
            ))}
          </SpeedDial>
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!message.trim()}
            aria-label="send message"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Template Selection Modal */}
      {showTemplates && (
        <MessageTemplates
          open={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelect={handleTemplateSelect}
        />
      )}

      {/* Message Scheduler Modal */}
      {showScheduler && (
        <ScheduledMessages
          open={showScheduler}
          onClose={() => setShowScheduler(false)}
          onSchedule={handleScheduleMessage}
          message={message}
          chatId={chatId}
        />
      )}
    </>
  );
};

export default ChatInput;
