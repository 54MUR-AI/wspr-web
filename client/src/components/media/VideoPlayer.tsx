import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Box, IconButton, Slider, Stack, Typography, Menu, MenuItem, CircularProgress } from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Speed,
  SettingsOutlined,
  PictureInPictureAlt,
  Refresh,
} from '@mui/icons-material';

interface VideoPlayerProps {
  src: string;
  thumbnail?: string;
  onError?: (error: Error) => void;
}

interface Quality {
  height: number;
  bitrate: number;
  label: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, thumbnail, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [currentQuality, setCurrentQuality] = useState<Quality | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const initializeHls = () => {
      if (Hls.isSupported()) {
        hlsRef.current = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          autoStartLoad: true,
        });

        const hls = hlsRef.current;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const levels = data.levels.map((level) => ({
            height: level.height,
            bitrate: level.bitrate,
            label: `${level.height}p`,
          }));
          setQualities(levels);
          setCurrentQuality(levels[levels.length - 1]); // Start with highest quality
          setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError(new Error('HLS streaming error'));
            onError?.(new Error('HLS streaming error'));
          }
        });

        return () => {
          hls.destroy();
          hlsRef.current = null;
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        setIsLoading(false);
      }
    };

    initializeHls();
  }, [src, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(!isMuted);
          break;
        case 'arrowleft':
          e.preventDefault();
          videoRef.current.currentTime -= 5;
          break;
        case 'arrowright':
          e.preventDefault();
          videoRef.current.currentTime += 5;
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setVolume(value);
    setIsMuted(value === 0);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
  };

  const handleTimeChange = (_: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setCurrentTime(value);
    if (videoRef.current) {
      videoRef.current.currentTime = value;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleQualityChange = (quality: Quality) => {
    if (hlsRef.current) {
      const levelIndex = qualities.findIndex(q => q.height === quality.height);
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQuality(quality);
    }
    setSettingsAnchorEl(null);
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setSettingsAnchorEl(null);
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Picture-in-Picture failed:', err);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        bgcolor="black"
        color="white"
        p={2}
      >
        <Typography variant="body1" mb={2}>
          Error playing video. Please try again.
        </Typography>
        <IconButton onClick={handleRetry} color="primary">
          <Refresh />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      position="relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      sx={{
        width: '100%',
        aspectRatio: '16/9',
        bgcolor: 'black',
        '&:hover': {
          '& .controls': {
            opacity: 1,
          },
        },
      }}
    >
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        poster={thumbnail}
        playsInline
      />

      {(isLoading || isBuffering) && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{ transform: 'translate(-50%, -50%)' }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      <Box
        className="controls"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        px={2}
        py={1}
        sx={{
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="white">
              {formatTime(currentTime)}
            </Typography>
            <Slider
              value={currentTime}
              max={duration}
              onChange={handleTimeChange}
              sx={{ color: 'primary.main', flexGrow: 1 }}
            />
            <Typography variant="caption" color="white">
              {formatTime(duration)}
            </Typography>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={handlePlayPause} size="small" sx={{ color: 'white' }}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>

              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 150 }}>
                <IconButton
                  onClick={() => setIsMuted(!isMuted)}
                  size="small"
                  sx={{ color: 'white' }}
                >
                  {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
                <Slider
                  value={isMuted ? 0 : volume}
                  max={1}
                  step={0.1}
                  onChange={handleVolumeChange}
                  sx={{ color: 'white' }}
                />
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                onClick={togglePictureInPicture}
                size="small"
                sx={{ color: 'white' }}
              >
                <PictureInPictureAlt />
              </IconButton>

              <IconButton
                onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                size="small"
                sx={{ color: 'white' }}
              >
                <SettingsOutlined />
              </IconButton>

              <IconButton
                onClick={toggleFullscreen}
                size="small"
                sx={{ color: 'white' }}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Quality</Typography>
        </MenuItem>
        {qualities.map((quality) => (
          <MenuItem
            key={quality.height}
            onClick={() => handleQualityChange(quality)}
            selected={currentQuality?.height === quality.height}
          >
            {quality.label}
          </MenuItem>
        ))}
        <MenuItem disabled sx={{ mt: 1 }}>
          <Typography variant="subtitle2">Playback Speed</Typography>
        </MenuItem>
        {PLAYBACK_SPEEDS.map((speed) => (
          <MenuItem
            key={speed}
            onClick={() => handleSpeedChange(speed)}
            selected={playbackSpeed === speed}
          >
            {speed}x
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default VideoPlayer;
