import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CallVideo from '../../../components/Call/CallVideo';
import callSlice from '../../../store/slices/callSlice';

describe('CallVideo Component', () => {
  const mockStore = configureStore({
    reducer: {
      call: callSlice,
    },
  });

  const mockStream = new MediaStream();

  it('renders video element when stream is provided', () => {
    render(
      <Provider store={mockStore}>
        <CallVideo stream={mockStream} muted={false} />
      </Provider>
    );

    const videoElement = screen.getByTestId('call-video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement.tagName.toLowerCase()).toBe('video');
  });

  it('applies muted attribute when muted prop is true', () => {
    render(
      <Provider store={mockStore}>
        <CallVideo stream={mockStream} muted={true} />
      </Provider>
    );

    const videoElement = screen.getByTestId('call-video');
    expect(videoElement).toHaveAttribute('muted');
  });

  it('does not apply muted attribute when muted prop is false', () => {
    render(
      <Provider store={mockStore}>
        <CallVideo stream={mockStream} muted={false} />
      </Provider>
    );

    const videoElement = screen.getByTestId('call-video');
    expect(videoElement).not.toHaveAttribute('muted');
  });

  it('renders placeholder when no stream is provided', () => {
    render(
      <Provider store={mockStore}>
        <CallVideo stream={null} muted={false} />
      </Provider>
    );

    expect(screen.getByTestId('video-placeholder')).toBeInTheDocument();
  });

  it('sets srcObject when stream changes', () => {
    const { rerender } = render(
      <Provider store={mockStore}>
        <CallVideo stream={mockStream} muted={false} />
      </Provider>
    );

    const videoElement = screen.getByTestId('call-video');
    expect(videoElement.srcObject).toBe(mockStream);

    const newMockStream = new MediaStream();
    rerender(
      <Provider store={mockStore}>
        <CallVideo stream={newMockStream} muted={false} />
      </Provider>
    );

    expect(videoElement.srcObject).toBe(newMockStream);
  });

  it('handles null stream gracefully', () => {
    const { rerender } = render(
      <Provider store={mockStore}>
        <CallVideo stream={mockStream} muted={false} />
      </Provider>
    );

    rerender(
      <Provider store={mockStore}>
        <CallVideo stream={null} muted={false} />
      </Provider>
    );

    expect(screen.getByTestId('video-placeholder')).toBeInTheDocument();
  });

  it('applies autoplay and playsInline attributes', () => {
    render(
      <Provider store={mockStore}>
        <CallVideo stream={mockStream} muted={false} />
      </Provider>
    );

    const videoElement = screen.getByTestId('call-video');
    expect(videoElement).toHaveAttribute('autoplay');
    expect(videoElement).toHaveAttribute('playsinline');
  });
});
