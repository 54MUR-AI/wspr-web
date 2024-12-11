import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Call from '../../../components/Call/Call';
import callSlice from '../../../store/slices/callSlice';
import userSlice from '../../../store/slices/userSlice';

describe('Call Component', () => {
  const mockStore = configureStore({
    reducer: {
      call: callSlice,
      user: userSlice,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders call controls when in a call', () => {
    render(
      <Provider store={mockStore}>
        <Call />
      </Provider>
    );

    // Initial state - should show start call button
    expect(screen.getByRole('button', { name: /start call/i })).toBeInTheDocument();
  });

  it('handles starting a call', async () => {
    render(
      <Provider store={mockStore}>
        <Call />
      </Provider>
    );

    const startCallButton = screen.getByRole('button', { name: /start call/i });
    fireEvent.click(startCallButton);

    // After starting call, should show end call button
    expect(await screen.findByRole('button', { name: /end call/i })).toBeInTheDocument();
  });

  it('handles ending a call', async () => {
    render(
      <Provider store={mockStore}>
        <Call />
      </Provider>
    );

    // Start call first
    const startCallButton = screen.getByRole('button', { name: /start call/i });
    fireEvent.click(startCallButton);

    // End call
    const endCallButton = await screen.findByRole('button', { name: /end call/i });
    fireEvent.click(endCallButton);

    // Should show start call button again
    expect(await screen.findByRole('button', { name: /start call/i })).toBeInTheDocument();
  });

  it('toggles audio mute', async () => {
    render(
      <Provider store={mockStore}>
        <Call />
      </Provider>
    );

    // Start call
    const startCallButton = screen.getByRole('button', { name: /start call/i });
    fireEvent.click(startCallButton);

    // Find and click mute button
    const muteButton = await screen.findByRole('button', { name: /mute/i });
    fireEvent.click(muteButton);

    // Should show unmute button
    expect(await screen.findByRole('button', { name: /unmute/i })).toBeInTheDocument();
  });

  it('toggles video', async () => {
    render(
      <Provider store={mockStore}>
        <Call />
      </Provider>
    );

    // Start call
    const startCallButton = screen.getByRole('button', { name: /start call/i });
    fireEvent.click(startCallButton);

    // Find and click video button
    const videoButton = await screen.findByRole('button', { name: /turn off video/i });
    fireEvent.click(videoButton);

    // Should show turn on video button
    expect(await screen.findByRole('button', { name: /turn on video/i })).toBeInTheDocument();
  });

  it('handles screen sharing', async () => {
    render(
      <Provider store={mockStore}>
        <Call />
      </Provider>
    );

    // Start call
    const startCallButton = screen.getByRole('button', { name: /start call/i });
    fireEvent.click(startCallButton);

    // Find and click share screen button
    const shareScreenButton = await screen.findByRole('button', { name: /share screen/i });
    fireEvent.click(shareScreenButton);

    // Should show stop sharing button
    expect(await screen.findByRole('button', { name: /stop sharing/i })).toBeInTheDocument();
  });

  it('displays error message when media access is denied', async () => {
    // Mock getUserMedia to reject
    const mockGetUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });

    render(
      <Provider store={mockStore}>
        <Call />
      </Provider>
    );

    const startCallButton = screen.getByRole('button', { name: /start call/i });
    fireEvent.click(startCallButton);

    // Should show error message
    expect(await screen.findByText(/unable to access camera or microphone/i)).toBeInTheDocument();
  });
});
