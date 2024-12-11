import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/authSlice';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const auth = useAppSelector(selectAuth);

  useEffect(() => {
    if (auth.token) {
      const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:3001', {
        auth: {
          token: auth.token,
        },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [auth.token]);

  return { socket, connected };
};
