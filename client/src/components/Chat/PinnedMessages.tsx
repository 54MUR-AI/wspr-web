import React, { useState, useEffect } from 'react';
import { Message } from '../../types/message';
import { MessageManagementService } from '../../services/message-management.service';
import { format } from 'date-fns';
import {
  Pin,
  MessageSquare,
  User,
  ArrowUpRight,
  Unpin,
  AlertCircle
} from 'lucide-react';

interface PinnedMessagesProps {
  className?: string;
  onMessageClick?: (message: Message) => void;
  channelId?: string;
}

export const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  className = '',
  onMessageClick,
  channelId
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showUnpinConfirm, setShowUnpinConfirm] = useState<string | null>(null);

  const messageService = MessageManagementService.getInstance();

  useEffect(() => {
    loadPinnedMessages();
  }, [channelId]);

  const loadPinnedMessages = async () => {
    try {
      const pinnedMessages = await messageService.getPinnedMessages(channelId);
      setMessages(pinnedMessages);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
    }
  };

  const handleUnpin = async (messageId: string) => {
    try {
      await messageService.unpinMessage(messageId);
      await loadPinnedMessages();
      setShowUnpinConfirm(null);
    } catch (error) {
      console.error('Failed to unpin message:', error);
    }
  };

  const getMessagePreview = (content: string) => {
    const maxLength = 150;
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Pin className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-medium">Pinned Messages</h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className="group relative p-4 border rounded-lg dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {message.senderId}
                </span>
                <MessageSquare className="w-4 h-4 text-gray-400 ml-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {format(message.timestamp, 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onMessageClick?.(message)}
                  className="p-1 text-gray-400 hover:text-blue-500"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowUnpinConfirm(message.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Unpin className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              {getMessagePreview(message.content)}
            </p>

            {message.isPriority && (
              <div className="flex items-center space-x-2 mt-2 text-yellow-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Priority Message</span>
              </div>
            )}

            {/* Unpin Confirmation Overlay */}
            {showUnpinConfirm === message.id && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 flex items-center justify-center rounded-lg">
                <div className="text-center p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Unpin this message?
                  </p>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handleUnpin(message.id)}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Unpin
                    </button>
                    <button
                      onClick={() => setShowUnpinConfirm(null)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No pinned messages
          </div>
        )}
      </div>
    </div>
  );
};
