import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { MessageDeliveryInfo } from '../types/message';

export type MessageStatus = 
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'blocked'
  | 'retrying'
  | 'scheduled';

interface MessageStatusState {
  status: MessageStatus;
  timestamp: number;
  error?: string;
  retryCount: number;
  readBy: string[];
  deliveredTo: string[];
  scheduledFor?: number;
}

export const useMessageStatus = (messageId: string) => {
  const ws = useWebSocket();
  const [state, setState] = useState<MessageStatusState>({
    status: 'sending',
    timestamp: Date.now(),
    retryCount: 0,
    readBy: [],
    deliveredTo: [],
  });

  useEffect(() => {
    const handleDeliveryUpdate = (info: MessageDeliveryInfo) => {
      if (info.messageId !== messageId) return;

      setState(prev => {
        const newState = { ...prev };

        if (info.deliveredAt) {
          newState.status = 'delivered';
          newState.timestamp = info.deliveredAt;
          if (!newState.deliveredTo.includes(info.recipientId)) {
            newState.deliveredTo = [...newState.deliveredTo, info.recipientId];
          }
        }

        if (info.readAt) {
          newState.status = 'read';
          newState.timestamp = info.readAt;
          if (!newState.readBy.includes(info.recipientId)) {
            newState.readBy = [...newState.readBy, info.recipientId];
          }
        }

        if (info.error) {
          newState.status = 'failed';
          newState.error = info.error;
          newState.retryCount = info.retryCount || prev.retryCount;
        }

        return newState;
      });
    };

    const handleMessageSent = (data: { messageId: string; timestamp: number }) => {
      if (data.messageId !== messageId) return;
      setState(prev => ({
        ...prev,
        status: 'sent',
        timestamp: data.timestamp,
      }));
    };

    const handleMessageBlocked = (data: { messageId: string; reason: string }) => {
      if (data.messageId !== messageId) return;
      setState(prev => ({
        ...prev,
        status: 'blocked',
        error: data.reason,
      }));
    };

    const handleMessageScheduled = (data: { 
      messageId: string; 
      scheduledFor: number 
    }) => {
      if (data.messageId !== messageId) return;
      setState(prev => ({
        ...prev,
        status: 'scheduled',
        scheduledFor: data.scheduledFor,
      }));
    };

    ws.on('message:delivery', handleDeliveryUpdate);
    ws.on('message:sent', handleMessageSent);
    ws.on('message:blocked', handleMessageBlocked);
    ws.on('message:scheduled', handleMessageScheduled);

    return () => {
      ws.off('message:delivery', handleDeliveryUpdate);
      ws.off('message:sent', handleMessageSent);
      ws.off('message:blocked', handleMessageBlocked);
      ws.off('message:scheduled', handleMessageScheduled);
    };
  }, [messageId, ws]);

  const retryMessage = async () => {
    setState(prev => ({
      ...prev,
      status: 'retrying',
      retryCount: prev.retryCount + 1,
    }));

    try {
      await ws.emit('message:retry', { messageId });
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to retry message',
      }));
    }
  };

  const cancelScheduledMessage = async () => {
    try {
      await ws.emit('message:cancel-scheduled', { messageId });
      setState(prev => ({
        ...prev,
        status: 'sending',
        scheduledFor: undefined,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to cancel scheduled message',
      }));
    }
  };

  return {
    ...state,
    retryMessage,
    cancelScheduledMessage,
  };
};
