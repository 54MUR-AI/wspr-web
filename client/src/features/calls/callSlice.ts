import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { CallState } from './types';

const initialState: CallState = {
  isInCall: false,
  activeCallId: null,
  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,
  connectionState: 'new',
  localStream: null,
  remoteStream: null,
  error: null,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setCallActive: (state, action: PayloadAction<string>) => {
      state.isInCall = true;
      state.activeCallId = action.payload;
      state.error = null;
    },
    setCallEnded: (state) => {
      state.isInCall = false;
      state.activeCallId = null;
      state.isMuted = false;
      state.isVideoEnabled = true;
      state.isScreenSharing = false;
      state.connectionState = 'closed';
      state.localStream = null;
      state.remoteStream = null;
      state.error = null;
    },
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    setVideoEnabled: (state, action: PayloadAction<boolean>) => {
      state.isVideoEnabled = action.payload;
    },
    setScreenSharing: (state, action: PayloadAction<boolean>) => {
      state.isScreenSharing = action.payload;
    },
    setConnectionState: (state, action: PayloadAction<RTCPeerConnectionState>) => {
      state.connectionState = action.payload;
    },
    setLocalStream: (state, action: PayloadAction<MediaStream>) => {
      state.localStream = action.payload;
    },
    setRemoteStream: (state, action: PayloadAction<MediaStream>) => {
      state.remoteStream = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCallActive,
  setCallEnded,
  setMuted,
  setVideoEnabled,
  setScreenSharing,
  setConnectionState,
  setLocalStream,
  setRemoteStream,
  setError,
} = callSlice.actions;

export const selectIsInCall = (state: RootState) => state.call.isInCall;
export const selectActiveCallId = (state: RootState) => state.call.activeCallId;
export const selectIsMuted = (state: RootState) => state.call.isMuted;
export const selectIsVideoEnabled = (state: RootState) => state.call.isVideoEnabled;
export const selectIsScreenSharing = (state: RootState) => state.call.isScreenSharing;
export const selectConnectionState = (state: RootState) => state.call.connectionState;
export const selectLocalStream = (state: RootState) => state.call.localStream;
export const selectRemoteStream = (state: RootState) => state.call.remoteStream;
export const selectError = (state: RootState) => state.call.error;

export default callSlice.reducer;
