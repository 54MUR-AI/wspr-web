import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Service Worker
const mockServiceWorker = {
  register: vi.fn().mockResolvedValue({ update: vi.fn() }),
  ready: vi.fn().mockResolvedValue(undefined),
  active: { postMessage: vi.fn() },
};

// Mock WebRTC APIs
class MockRTCPeerConnection implements RTCPeerConnection {
  onicecandidate: ((this: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => any) | null = null;
  ontrack: ((this: RTCPeerConnection, ev: RTCTrackEvent) => any) | null = null;
  iceGatheringState: RTCIceGatheringState = 'complete';
  localDescription: RTCSessionDescription | null = null;
  remoteDescription: RTCSessionDescription | null = null;
  connectionState: RTCPeerConnectionState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  signalingState: RTCSignalingState = 'stable';

  createOffer(): Promise<RTCSessionDescriptionInit> {
    return Promise.resolve({ type: 'offer', sdp: 'mock-sdp' });
  }

  createAnswer(): Promise<RTCSessionDescriptionInit> {
    return Promise.resolve({ type: 'answer', sdp: 'mock-sdp' });
  }

  setLocalDescription(description?: RTCSessionDescriptionInit): Promise<void> {
    return Promise.resolve();
  }

  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    return Promise.resolve();
  }

  addIceCandidate(candidate?: RTCIceCandidateInit): Promise<void> {
    return Promise.resolve();
  }

  getStats(): Promise<RTCStatsReport> {
    return Promise.resolve(new Map() as unknown as RTCStatsReport);
  }

  close(): void {}

  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
    return {} as RTCRtpSender;
  }

  // Add other required RTCPeerConnection methods
  addTransceiver(): RTCRtpTransceiver {
    return {} as RTCRtpTransceiver;
  }

  createDataChannel(): RTCDataChannel {
    return {} as RTCDataChannel;
  }

  getReceivers(): RTCRtpReceiver[] {
    return [];
  }

  getSenders(): RTCRtpSender[] {
    return [];
  }

  getTransceivers(): RTCRtpTransceiver[] {
    return [];
  }

  removeTrack(): void {}

  // Add static method
  static generateCertificate(keygenAlgorithm: AlgorithmIdentifier): Promise<RTCCertificate> {
    return Promise.resolve({} as RTCCertificate);
  }
}

class MockMediaStream implements MediaStream {
  id = 'mock-stream-id';
  active = true;
  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;

  addTrack(track: MediaStreamTrack): void {}
  clone(): MediaStream {
    return new MockMediaStream();
  }
  getAudioTracks(): MediaStreamTrack[] {
    return [];
  }
  getTrackById(): MediaStreamTrack | null {
    return null;
  }
  getTracks(): MediaStreamTrack[] {
    return [{ stop: vi.fn() } as unknown as MediaStreamTrack];
  }
  getVideoTracks(): MediaStreamTrack[] {
    return [];
  }
  removeTrack(track: MediaStreamTrack): void {}
}

// Mock Push API
const mockPushManager = {
  subscribe: vi.fn().mockResolvedValue({
    toJSON: () => ({ endpoint: 'mock-endpoint', keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' } }),
  }),
  getSubscription: vi.fn().mockResolvedValue(null),
};

// Setup global mocks
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    serviceWorker: mockServiceWorker,
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue(new MockMediaStream()),
      getDisplayMedia: vi.fn().mockResolvedValue(new MockMediaStream()),
    },
    permissions: {
      query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
  },
  writable: true,
});

global.RTCPeerConnection = MockRTCPeerConnection as unknown as typeof RTCPeerConnection;
global.MediaStream = MockMediaStream as unknown as typeof MediaStream;

// Mock IndexedDB
const indexedDB = {
  open: vi.fn().mockReturnValue({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
  }),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

global.ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Cleanup between tests
afterEach(() => {
  vi.clearAllMocks();
});
