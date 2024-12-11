import { Socket } from 'socket.io-client';

export interface CallState {
  isInCall: boolean;
  activeCallId: string | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionState: RTCPeerConnectionState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
}

export interface CallEvents {
  'call:start': (data: { recipientId: string; offer: RTCSessionDescriptionInit }) => void;
  'call:answer': (data: { callerId: string; answer: RTCSessionDescriptionInit }) => void;
  'call:ice-candidate': (data: { recipientId: string; candidate: RTCIceCandidate }) => void;
  'call:end': (data: { callId: string }) => void;
  'call:error': (data: { message: string }) => void;
}

export interface IncomingCall {
  callerId: string;
  callerName: string;
  offer: RTCSessionDescriptionInit;
}

export interface CallMetrics {
  packetsLost: number;
  jitter: number;
  roundTripTime: number;
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
}

export interface CallQualityReport {
  userId: string;
  callId: string;
  timestamp: string;
  metrics: CallMetrics;
}
