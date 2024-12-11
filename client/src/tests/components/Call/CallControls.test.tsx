import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CallControls from '../../../components/Call/CallControls';
import callSlice from '../../../store/slices/callSlice';

describe('CallControls Component', () => {
  const mockStore = configureStore({
    reducer: {
      call: callSlice,
    },
  });

  const mockHandleEndCall = vi.fn();
  const mockToggleAudio = vi.fn();
  const mockToggleVideo = vi.fn();
  const mockToggleScreenShare = vi.fn();

  it('renders all control buttons', () => {
    render(
      <Provider store={mockStore}>
        <CallControls
          onEndCall={mockHandleEndCall}
          onToggleAudio={mockToggleAudio}
          onToggleVideo={mockToggleVideo}
          onToggleScreenShare={mockToggleScreenShare}
          isAudioEnabled={true}
          isVideoEnabled={true}
          isScreenSharing={false}
        />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /turn off video/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share screen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end call/i })).toBeInTheDocument();
  });

  it('handles audio toggle', () => {
    render(
      <Provider store={mockStore}>
        <CallControls
          onEndCall={mockHandleEndCall}
          onToggleAudio={mockToggleAudio}
          onToggleVideo={mockToggleVideo}
          onToggleScreenShare={mockToggleScreenShare}
          isAudioEnabled={true}
          isVideoEnabled={true}
          isScreenSharing={false}
        />
      </Provider>
    );

    const muteButton = screen.getByRole('button', { name: /mute/i });
    fireEvent.click(muteButton);

    expect(mockToggleAudio).toHaveBeenCalled();
  });

  it('handles video toggle', () => {
    render(
      <Provider store={mockStore}>
        <CallControls
          onEndCall={mockHandleEndCall}
          onToggleAudio={mockToggleAudio}
          onToggleVideo={mockToggleVideo}
          onToggleScreenShare={mockToggleScreenShare}
          isAudioEnabled={true}
          isVideoEnabled={true}
          isScreenSharing={false}
        />
      </Provider>
    );

    const videoButton = screen.getByRole('button', { name: /turn off video/i });
    fireEvent.click(videoButton);

    expect(mockToggleVideo).toHaveBeenCalled();
  });

  it('handles screen sharing toggle', () => {
    render(
      <Provider store={mockStore}>
        <CallControls
          onEndCall={mockHandleEndCall}
          onToggleAudio={mockToggleAudio}
          onToggleVideo={mockToggleVideo}
          onToggleScreenShare={mockToggleScreenShare}
          isAudioEnabled={true}
          isVideoEnabled={true}
          isScreenSharing={false}
        />
      </Provider>
    );

    const shareScreenButton = screen.getByRole('button', { name: /share screen/i });
    fireEvent.click(shareScreenButton);

    expect(mockToggleScreenShare).toHaveBeenCalled();
  });

  it('handles end call', () => {
    render(
      <Provider store={mockStore}>
        <CallControls
          onEndCall={mockHandleEndCall}
          onToggleAudio={mockToggleAudio}
          onToggleVideo={mockToggleVideo}
          onToggleScreenShare={mockToggleScreenShare}
          isAudioEnabled={true}
          isVideoEnabled={true}
          isScreenSharing={false}
        />
      </Provider>
    );

    const endCallButton = screen.getByRole('button', { name: /end call/i });
    fireEvent.click(endCallButton);

    expect(mockHandleEndCall).toHaveBeenCalled();
  });

  it('shows correct button states based on props', () => {
    render(
      <Provider store={mockStore}>
        <CallControls
          onEndCall={mockHandleEndCall}
          onToggleAudio={mockToggleAudio}
          onToggleVideo={mockToggleVideo}
          onToggleScreenShare={mockToggleScreenShare}
          isAudioEnabled={false}
          isVideoEnabled={false}
          isScreenSharing={true}
        />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /unmute/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /turn on video/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop sharing/i })).toBeInTheDocument();
  });
});
