import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import {
  Call as CallIcon,
  CallEnd as CallEndIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../app/hooks';
import { selectUser } from '../auth/authSlice';
import { socket } from '../../app/socket';
import VideoCall from './VideoCall';

interface IncomingCall {
  callerId: string;
  callerName: string;
  offer: RTCSessionDescription;
  roomId: string;
}

const CallManager: React.FC = () => {
  const user = useAppSelector(selectUser);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<{
    recipientId: string;
    recipientName: string;
    isIncoming?: boolean;
    offer?: RTCSessionDescription;
  } | null>(null);

  useEffect(() => {
    // Handle incoming calls
    socket.on('call:incoming', (call: IncomingCall) => {
      setIncomingCall(call);
      // Play ringtone
      playRingtone();
    });

    // Handle accepted calls
    socket.on('call:accepted', ({ recipientId, recipientName, answer }) => {
      if (activeCall) {
        // Handle the accepted call
        handleCallAccepted(answer);
      }
    });

    // Handle call ended
    socket.on('call:ended', () => {
      handleCallEnded();
    });

    // Handle call errors
    socket.on('call:error', ({ message }) => {
      console.error('Call error:', message);
      handleCallEnded();
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:ended');
      socket.off('call:error');
    };
  }, [activeCall]);

  const playRingtone = () => {
    // Implement ringtone playback
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(console.error);
    return audio;
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      setActiveCall({
        recipientId: incomingCall.callerId,
        recipientName: incomingCall.callerName,
        isIncoming: true,
        offer: incomingCall.offer,
      });
      setIncomingCall(null);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit('call:reject', {
        callerId: incomingCall.callerId,
        roomId: incomingCall.roomId,
      });
      setIncomingCall(null);
    }
  };

  const handleCallAccepted = (answer: RTCSessionDescription) => {
    // Handle the accepted call (implemented in VideoCall component)
  };

  const handleCallEnded = () => {
    setActiveCall(null);
    setIncomingCall(null);
  };

  const startCall = (recipientId: string, recipientName: string) => {
    setActiveCall({
      recipientId,
      recipientName,
    });
  };

  return (
    <>
      {/* Incoming Call Dialog */}
      <Dialog open={!!incomingCall} onClose={handleRejectCall}>
        <DialogTitle>Incoming Call</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 2,
            }}
          >
            <Avatar
              sx={{ width: 80, height: 80 }}
              src={`/api/users/${incomingCall?.callerId}/avatar`}
            />
            <Typography variant="h6">{incomingCall?.callerName}</Typography>
            <Typography variant="body2" color="text.secondary">
              is calling you...
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<CallEndIcon />}
            onClick={handleRejectCall}
          >
            Decline
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CallIcon />}
            onClick={handleAcceptCall}
          >
            Accept
          </Button>
        </DialogActions>
      </Dialog>

      {/* Active Call Component */}
      {activeCall && (
        <VideoCall
          recipientId={activeCall.recipientId}
          recipientName={activeCall.recipientName}
          isIncoming={activeCall.isIncoming}
          offer={activeCall.offer}
          onClose={handleCallEnded}
        />
      )}
    </>
  );
};

export default CallManager;
