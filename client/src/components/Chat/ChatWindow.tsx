import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../../services/message.service';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import UserPresence from './UserPresence';
import messageService from '../../services/message.service';
import { useAuth } from '../../hooks/useAuth';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Load message history
        const history = await messageService.getMessageHistory(recipientId);
        setMessages(history);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load messages');
        setIsLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const unsubscribe = messageService.onMessage((message) => {
      if (
        message.senderId === recipientId ||
        message.recipientId === recipientId
      ) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    // Subscribe to message status updates
    const unsubscribeStatus = messageService.onMessageStatus(
      (messageId, status) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status } : msg
          )
        );
      }
    );

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [recipientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    try {
      const messageId = await messageService.sendMessage(recipientId, content);
      // Message will be added to the list through the subscription
    } catch (err) {
      setError('Failed to send message');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">{recipientName}</h2>
        <UserPresence userId={recipientId} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <MessageList
          messages={messages}
          currentUserId={user?.id || ''}
          recipientId={recipientId}
        />
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <MessageComposer onSend={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatWindow;
