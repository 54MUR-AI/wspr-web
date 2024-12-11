import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Circle as CircleIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { Thread, ThreadParticipant } from '../../types/thread';

interface ThreadListProps {
  onThreadSelect?: (threadId: string) => void;
}

const ThreadList: React.FC<ThreadListProps> = ({ onThreadSelect }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    loadThreads();

    socket?.on('thread:update', handleThreadUpdate);
    socket?.on('message:new', handleNewMessage);

    return () => {
      socket?.off('thread:update', handleThreadUpdate);
      socket?.off('message:new', handleNewMessage);
    };
  }, [socket]);

  const loadThreads = async () => {
    try {
      const response = await fetch('/api/threads');
      const data = await response.json();
      setThreads(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading threads:', error);
      setLoading(false);
    }
  };

  const handleThreadUpdate = (updatedThread: Thread) => {
    setThreads(prevThreads =>
      prevThreads.map(thread =>
        thread.id === updatedThread.id ? updatedThread : thread
      )
    );
  };

  const handleNewMessage = (message: any) => {
    setThreads(prevThreads =>
      prevThreads.map(thread => {
        if (thread.id === message.threadId) {
          return {
            ...thread,
            lastMessage: message,
            updatedAt: new Date().toISOString()
          };
        }
        return thread;
      })
    );
  };

  const getThreadTitle = (thread: Thread): string => {
    if (thread.type === 'direct') {
      const otherParticipant = thread.participants.find(
        p => p.id !== user?.id
      );
      return otherParticipant?.username || 'Unknown User';
    }
    return thread.title || 'Unnamed Group';
  };

  const getLastMessagePreview = (thread: Thread): string => {
    if (!thread.lastMessage) return 'No messages yet';
    const sender =
      thread.lastMessage.senderId === user?.id ? 'You' : 'They';
    return `${sender}: ${thread.lastMessage.content}`;
  };

  const getParticipantStatus = (participant: ThreadParticipant) => {
    return participant.status === 'online' ? (
      <Tooltip title="Online">
        <CircleIcon
          sx={{
            fontSize: 12,
            color: 'success.main',
            position: 'absolute',
            bottom: 2,
            right: 2,
            background: 'white',
            borderRadius: '50%'
          }}
        />
      </Tooltip>
    ) : null;
  };

  const filteredThreads = threads.filter(thread => {
    const title = getThreadTitle(thread).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          size="small"
        />
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredThreads.map(thread => (
          <ListItem
            key={thread.id}
            button
            onClick={() => onThreadSelect?.(thread.id)}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            secondaryAction={
              <IconButton edge="end">
                <MoreVertIcon />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  thread.type === 'direct' &&
                  getParticipantStatus(
                    thread.participants.find(p => p.id !== user?.id)!
                  )
                }
              >
                <Avatar src={thread.type === 'direct' ? thread.participants.find(p => p.id !== user?.id)?.profilePicture : undefined}>
                  {getThreadTitle(thread).charAt(0)}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography noWrap component="div">
                  {getThreadTitle(thread)}
                </Typography>
              }
              secondary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  component="div"
                >
                  {getLastMessagePreview(thread)}
                </Typography>
              }
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                ml: 2,
                minWidth: 65
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {thread.lastMessage &&
                  formatDistanceToNow(new Date(thread.lastMessage.createdAt), {
                    addSuffix: true
                  })}
              </Typography>
              {thread.unreadCount > 0 && (
                <Badge
                  badgeContent={thread.unreadCount}
                  color="primary"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ThreadList;
