import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWebRTC } from '../../hooks/useWebRTC';

describe('useWebRTC', () => {
  const mockPeerConnection = new RTCPeerConnection();
  const mockStream = new MediaStream();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize WebRTC connection', () => {
    const { result } = renderHook(() => useWebRTC());
    
    expect(result.current.peerConnection).toBeDefined();
    expect(result.current.localStream).toBeNull();
    expect(result.current.remoteStream).toBeNull();
  });

  it('should start local stream', async () => {
    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.startLocalStream();
    });

    expect(result.current.localStream).toBeDefined();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it('should create and set offer', async () => {
    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.createOffer();
    });

    expect(mockPeerConnection.createOffer).toHaveBeenCalled();
    expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
  });

  it('should handle remote offer and create answer', async () => {
    const { result } = renderHook(() => useWebRTC());
    const mockOffer = { type: 'offer', sdp: 'mock-sdp' };

    await act(async () => {
      await result.current.handleRemoteOffer(mockOffer);
    });

    expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith(mockOffer);
    expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
    expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
  });

  it('should handle ICE candidate', async () => {
    const { result } = renderHook(() => useWebRTC());
    const mockCandidate = { candidate: 'mock-candidate' };

    await act(async () => {
      await result.current.handleIceCandidate(mockCandidate);
    });

    expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith(mockCandidate);
  });

  it('should collect connection stats', async () => {
    const { result } = renderHook(() => useWebRTC());
    const mockStats = new Map([
      ['inbound-rtp', { packetsLost: 0, jitter: 0.5 }],
      ['outbound-rtp', { bytesSent: 1000 }],
    ]);

    vi.spyOn(mockPeerConnection, 'getStats').mockResolvedValue(mockStats);

    await act(async () => {
      const stats = await result.current.getConnectionStats();
      expect(stats).toBeDefined();
      expect(mockPeerConnection.getStats).toHaveBeenCalled();
    });
  });

  it('should clean up resources on unmount', () => {
    const { result, unmount } = renderHook(() => useWebRTC());

    act(() => {
      unmount();
    });

    expect(mockPeerConnection.close).toHaveBeenCalled();
  });

  it('should handle screen sharing', async () => {
    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.startScreenShare();
    });

    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
    expect(result.current.isScreenSharing).toBe(true);
  });

  it('should stop screen sharing', async () => {
    const { result } = renderHook(() => useWebRTC());
    const mockTrack = { stop: vi.fn() };

    // Start screen sharing
    await act(async () => {
      await result.current.startScreenShare();
    });

    // Stop screen sharing
    act(() => {
      result.current.stopScreenShare();
    });

    expect(result.current.isScreenSharing).toBe(false);
  });

  it('should handle connection state changes', async () => {
    const { result } = renderHook(() => useWebRTC());
    const mockConnectionState = 'connected';

    act(() => {
      // @ts-ignore - Manually trigger connection state change
      mockPeerConnection.connectionState = mockConnectionState;
      mockPeerConnection.onconnectionstatechange?.(new Event('connectionstatechange'));
    });

    expect(result.current.connectionState).toBe(mockConnectionState);
  });
});
