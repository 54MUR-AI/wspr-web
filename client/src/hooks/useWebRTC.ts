import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { monitoringService } from '../services/monitoring';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/userSlice';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: process.env.REACT_APP_TURN_SERVER,
      username: process.env.REACT_APP_TURN_USERNAME,
      credential: process.env.REACT_APP_TURN_CREDENTIAL,
    },
  ],
};

export const useWebRTC = () => {
  const user = useAppSelector(selectUser);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const { socket } = useSocket();
  const statsInterval = useRef<NodeJS.Timer>();
  const callStartTime = useRef<number>(0);

  const monitorCallQuality = useCallback((pc: RTCPeerConnection, contactId: string) => {
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
    }

    statsInterval.current = setInterval(async () => {
      if (pc.connectionState === 'connected') {
        const stats = await pc.getStats();
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            monitoringService.trackCallQuality({
              userId: user?.id || '',
              callId: contactId,
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
                bitrate: report.bitrate,
                packetLossRate: report.packetsLost ? (report.packetsLost / report.packetsReceived) * 100 : 0,
              },
            });
          }
        });
      }
    }, 5000);
  }, [user]);

  const createPeerConnection = useCallback(async (contactId: string) => {
    const pc = new RTCPeerConnection(configuration);
    callStartTime.current = Date.now();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('ice_candidate', {
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        monitorCallQuality(pc, contactId);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        monitoringService.logError({
          type: 'WEBRTC_CONNECTION_ERROR',
          message: `WebRTC connection state changed to ${pc.connectionState}`,
          timestamp: new Date().toISOString(),
          metadata: {
            userId: user?.id,
            contactId,
            callDuration: Date.now() - callStartTime.current,
          },
        });
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      stream.getTracks().forEach((track) => {
        if (stream) {
          pc.addTrack(track, stream);
        }
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      monitoringService.logError({
        type: 'MEDIA_ACCESS_ERROR',
        message: 'Failed to access media devices',
        timestamp: new Date().toISOString(),
        metadata: {
          userId: user?.id,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    setPeerConnection(pc);
    return pc;
  }, [socket, monitorCallQuality, user]);

  const startCall = async (contactId: string) => {
    const pc = await createPeerConnection(contactId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket?.emit('call_offer', {
        contactId,
        offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleIncomingCall = async (offer: RTCSessionDescriptionInit) => {
    const pc = await createPeerConnection('');
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket?.emit('call_answer', {
        answer,
      });
    } catch (error) {
      console.error('Error handling incoming call:', error);
    }
  };

  const endCall = () => {
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
    }

    if (peerConnection) {
      // Log call metrics before closing
      const callDuration = Date.now() - callStartTime.current;
      monitoringService.trackPerformance('call_duration', callDuration);

      peerConnection.close();
      setPeerConnection(null);
    }
    
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    
    setRemoteStream(null);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      
      if (peerConnection && localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
        
        setLocalStream(screenStream);
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      
      if (peerConnection && localStream) {
        const sender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(stream.getVideoTracks()[0]);
        }
        
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(stream);
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('ice_candidate', ({ candidate }) => {
        if (peerConnection) {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on('call_offer', ({ offer }) => {
        handleIncomingCall(offer);
      });

      socket.on('call_answer', ({ answer }) => {
        if (peerConnection) {
          peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      return () => {
        socket.off('ice_candidate');
        socket.off('call_offer');
        socket.off('call_answer');
      };
    }
  }, [socket, peerConnection, handleIncomingCall]);

  useEffect(() => {
    return () => {
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
      }
    };
  }, []);

  return {
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
};
