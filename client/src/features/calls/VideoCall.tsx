import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Grid,
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
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectUser } from '../auth/authSlice';
import { socket } from '../../app/socket';
import { monitoringService } from '../../services/monitoring';
import axios from 'axios'; // Import axios

interface VideoCallProps {
  recipientId: string;
  recipientName: string;
  isIncoming?: boolean;
  offer?: RTCSessionDescription;
  onClose: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({
  recipientId,
  recipientName,
  isIncoming = false,
  offer,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = Date.now();
    initializeCall();
    return () => {
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (!peerConnection.current) return;

    const statsInterval = setInterval(async () => {
      try {
        const stats = await peerConnection.current.getStats();
        const statsData = {};
        stats.forEach(stat => {
          statsData[stat.id] = stat;
        });

        // Send stats to server
        await axios.post('/api/monitoring/webrtc/stats', {
          callId: recipientId,
          stats: statsData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to collect WebRTC stats:', error);
      }
    }, 5000); // Collect stats every 5 seconds

    return () => clearInterval(statsInterval);
  }, [peerConnection, recipientId]);

  const initializeCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      const configuration: RTCConfiguration = {
        iceServers: [
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
            ],
          },
          // Add TURN server configuration here
        ],
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnection.current = pc;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle incoming tracks
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call:ice-candidate', {
            recipientId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'disconnected') {
          handleCallEnd();
        }
      };

      // Monitor call quality
      setInterval(() => {
        if (pc.connectionState === 'connected') {
          pc.getStats().then((stats) => {
            stats.forEach((report) => {
              if (report.type === 'inbound-rtp' && report.kind === 'video') {
                monitoringService.trackCallQuality({
                  userId: user?.id || '',
                  callId: recipientId,
                  timestamp: new Date().toISOString(),
                  metrics: {
                    packetsLost: report.packetsLost || 0,
                    jitter: report.jitter || 0,
                    roundTripTime: report.roundTripTime || 0,
                    frameRate: report.framesPerSecond,
                    resolution: {
                      width: report.frameWidth,
                      height: report.frameHeight,
                    },
                  },
                });
              }
            });
          });
        }
      }, 5000); // Monitor every 5 seconds

      // Handle incoming call
      if (isIncoming && offer) {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', {
          callerId: recipientId,
          answer,
        });
      } else {
        // Create and send offer for outgoing call
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:start', {
          recipientId,
          offer,
        });
      }

    } catch (error) {
      console.error('Error initializing call:', error);
      monitoringService.logError({
        error,
        errorInfo: {
          component: 'VideoCall',
          method: 'initializeCall',
          userId: user?.id,
          recipientId,
        },
        location: window.location.href,
        timestamp: new Date().toISOString(),
      });
      handleCallEnd();
    }
  };

  const cleanupCall = () => {
    // Log call end metrics
    if (peerConnection.current) {
      peerConnection.current.getStats().then((stats) => {
        const metrics: any = {};
        stats.forEach((report) => {
          if (report.type === 'transport') {
            metrics.bytesSent = report.bytesSent;
            metrics.bytesReceived = report.bytesReceived;
          }
        });
        
        monitoringService.trackPerformance('call_ended', 1, {
          userId: user?.id,
          recipientId,
          duration: Date.now() - startTime.current,
          ...metrics,
        });
      });
    }

    // Stop all tracks in local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Stop screen sharing if active
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    // Clean up state
    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
  };

  const handleCallEnd = () => {
    socket.emit('call:end');
    cleanupCall();
    onClose();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        screenStream.current = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        if (peerConnection.current) {
          const sender = peerConnection.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');

          if (sender) {
            await sender.replaceTrack(screenStream.current.getVideoTracks()[0]);
          }
        }
      } else {
        if (screenStream.current) {
          screenStream.current.getTracks().forEach((track) => track.stop());
        }

        if (localStream && peerConnection.current) {
          const sender = peerConnection.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');

          if (sender) {
            await sender.replaceTrack(localStream.getVideoTracks()[0]);
          }
        }
      }

      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  return (
    <Dialog open maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 2, height: '80vh' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                bgcolor: 'black',
              }}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              <Paper
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  p: 1,
                  display: 'flex',
                  gap: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <IconButton onClick={toggleMute} color="primary">
                  {isMuted ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
                <IconButton onClick={toggleVideo} color="primary">
                  {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
                </IconButton>
                <IconButton onClick={toggleScreenShare} color="primary">
                  {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>
                <IconButton onClick={handleCallEnd} color="error">
                  <CallEndIcon />
                </IconButton>
              </Paper>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'black',
                position: 'relative',
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
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  color: 'white',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  px: 1,
                  borderRadius: 1,
                }}
              >
                {user?.name} (You)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;
