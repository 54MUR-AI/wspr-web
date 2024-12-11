import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  IconButton,
  Paper,
  Typography,
  Alert,
  Snackbar,
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
import { useWebRTC } from '../hooks/useWebRTC';
import { useAppSelector } from '../store/hooks';
import { selectConnectionState } from '../features/calls/callSlice';

const VideoCall: React.FC = () => {
  const { id: contactId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const connectionState = useAppSelector(selectConnectionState);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    if (!contactId) {
      setErrorMessage('Invalid contact ID');
      setShowError(true);
      return;
    }

    startCall(contactId).catch((error) => {
      setErrorMessage('Failed to start call: ' + error.message);
      setShowError(true);
    });

    return () => {
      endCall();
    };
  }, [contactId]);

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

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      setErrorMessage('Failed to toggle screen sharing');
      setShowError(true);
    }
  };

  const handleEndCall = () => {
    endCall();
    navigate('/');
  };

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', py: 4 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            {/* Remote Video */}
            <Box sx={{ flex: 1, bgcolor: 'black', position: 'relative' }}>
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
                    color: 'white',
                  }}
                >
                  {connectionState === 'connecting' ? 'Connecting...' : 'Waiting for peer...'}
                </Typography>
              )}
              
              {/* Local Video (Picture-in-Picture) */}
              <Box
                sx={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  width: 200,
                  height: 150,
                  bgcolor: 'black',
                  borderRadius: 1,
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
                    transform: 'scaleX(-1)', // Mirror local video
                  }}
                />
              </Box>
            </Box>

            {/* Controls */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
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
          </Paper>
        </Grid>

        {/* Call Information Panel */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Call Information
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Contact ID: {contactId}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Status: {connectionState}
            </Typography>
            {/* Add more call information here */}
          </Paper>
        </Grid>
      </Grid>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VideoCall;
