import React from 'react';
import { Message as MessageType } from '../../types/message';
import { MessageStatus } from './MessageStatus';
import { useMessageStatus } from '../../hooks/useMessageStatus';
import { format } from 'date-fns';
import {
  User,
  MoreVertical,
  Reply,
  Bookmark,
  Pin,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface MessageProps {
  message: MessageType;
  isOwnMessage: boolean;
  onReply?: (message: MessageType) => void;
  onEdit?: (message: MessageType) => void;
  onDelete?: (message: MessageType) => void;
  onBookmark?: (message: MessageType) => void;
  onPin?: (message: MessageType) => void;
  className?: string;
}

export const Message: React.FC<MessageProps> = ({
  message,
  isOwnMessage,
  onReply,
  onEdit,
  onDelete,
  onBookmark,
  onPin,
  className = ''
}) => {
  const [showActions, setShowActions] = React.useState(false);
  const messageStatus = useMessageStatus(message.id);

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await messageStatus.retryMessage();
  };

  const handleCancelScheduled = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await messageStatus.cancelScheduledMessage();
  };

  return (
    <div
      className={`relative group ${
        isOwnMessage ? 'ml-auto' : 'mr-auto'
      } max-w-[70%] ${className}`}
    >
      <div
        className={`p-3 rounded-lg ${
          isOwnMessage
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700'
        }`}
      >
        {/* Message Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">
              {message.senderId}
            </span>
          </div>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Message Content */}
        <div className="mb-2">
          <p className={`text-sm ${
            isOwnMessage ? 'text-white' : 'text-gray-800 dark:text-gray-200'
          }`}>
            {message.content}
          </p>
        </div>

        {/* Message Footer */}
        <div className="flex items-center justify-between text-xs">
          <span className={
            isOwnMessage ? 'text-white/70' : 'text-gray-500'
          }>
            {format(message.timestamp, 'HH:mm')}
          </span>
          <MessageStatus
            status={messageStatus.status}
            timestamp={messageStatus.timestamp}
            readBy={messageStatus.readBy}
            deliveredTo={messageStatus.deliveredTo}
            retryCount={messageStatus.retryCount}
            scheduledFor={messageStatus.scheduledFor}
            className={isOwnMessage ? 'text-white/70' : ''}
            showTooltip
          />
        </div>

        {/* Message Actions Dropdown */}
        {showActions && (
          <div className="absolute top-0 right-0 mt-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
            <div className="py-1">
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </button>
              )}
              {onBookmark && (
                <button
                  onClick={() => onBookmark(message)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Bookmark
                </button>
              )}
              {onPin && (
                <button
                  onClick={() => onPin(message)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Pin className="w-4 h-4 mr-2" />
                  Pin
                </button>
              )}
              {isOwnMessage && onEdit && (
                <button
                  onClick={() => onEdit(message)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
              {isOwnMessage && onDelete && (
                <button
                  onClick={() => onDelete(message)}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error/Retry UI */}
        {messageStatus.error && (
          <div className="mt-2 flex items-center space-x-2 text-red-500 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>{messageStatus.error}</span>
            <button
              onClick={handleRetry}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Scheduled Message Cancel UI */}
        {messageStatus.status === 'scheduled' && (
          <div className="mt-2 flex items-center justify-between text-xs text-purple-500">
            <span>
              Scheduled for {format(messageStatus.scheduledFor!, 'MMM d, HH:mm')}
            </span>
            <button
              onClick={handleCancelScheduled}
              className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
