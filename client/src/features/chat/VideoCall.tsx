import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Dialog,
  DialogContent,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  CallEnd as CallEndIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
} from '@mui/icons-material';
import { useWebRTC } from '../../hooks/useWebRTC';

interface VideoCallProps {
  contactId: string;
  isIncoming?: boolean;
  onClose: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ contactId, isIncoming = false, onClose }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const {
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC();

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!isIncoming) {
      startCall(contactId);
    }
    return () => {
      endCall();
    };
  }, [contactId, isIncoming]);

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
    setIsScreenSharing(!isScreenSharing);
  };

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  return (
    <Dialog
      open={true}
      maxWidth="lg"
      fullWidth
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          height: '80vh',
        },
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', flexGrow: 1, gap: 2, p: 2 }}>
          {/* Remote Video */}
          <Paper
            elevation={3}
            sx={{
              position: 'relative',
              width: '100%',
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {!remoteStream && (
              <Typography
                variant="h6"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'text.secondary',
                }}
              >
                Connecting...
              </Typography>
            )}
          </Paper>

          {/* Local Video */}
          <Paper
            elevation={3}
            sx={{
              position: 'relative',
              width: '25%',
              minWidth: 200,
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
          </Paper>
        </Box>

        {/* Controls */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            p: 2,
            bgcolor: 'background.paper',
          }}
        >
          <IconButton
            onClick={handleToggleMute}
            color={isMuted ? 'error' : 'primary'}
            sx={{ bgcolor: 'action.hover' }}
          >
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
          <IconButton
            onClick={handleToggleVideo}
            color={isVideoEnabled ? 'primary' : 'error'}
            sx={{ bgcolor: 'action.hover' }}
          >
            {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
          <IconButton
            onClick={handleToggleScreenShare}
            color={isScreenSharing ? 'error' : 'primary'}
            sx={{ bgcolor: 'action.hover' }}
          >
            {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>
          <IconButton
            onClick={handleEndCall}
            color="error"
            sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
          >
            <CallEndIcon />
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;
