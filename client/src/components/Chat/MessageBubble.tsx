import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import MessageContextMenu from './MessageContextMenu';
import MessageExpiryIndicator from './MessageExpiryIndicator';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    timestamp: Date;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
    status: 'sent' | 'delivered' | 'read';
    expiryTime?: Date;
  };
  isSelf: boolean;
  onReply: () => void;
  onDelete: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  onReply,
  onDelete,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <MessageContextMenu
      messageId={message.id}
      onReply={onReply}
      onDelete={onDelete}
      onCopy={handleCopy}
    >
      <div
        className={`flex flex-col max-w-[70%] ${
          isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
        }`}
      >
        <div
          className={`rounded-lg px-4 py-2 ${
            isSelf
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {!isSelf && (
            <div className="text-sm font-medium mb-1">{message.sender.name}</div>
          )}
          <div className="text-sm">{message.content}</div>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <span>{format(message.timestamp, 'HH:mm')}</span>
          {isSelf && (
            <>
              {message.status === 'read' ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </>
          )}
          {message.expiryTime && (
            <MessageExpiryIndicator expiryTime={message.expiryTime} />
          )}
        </div>
      </div>
    </MessageContextMenu>
  );
};

export default MessageBubble;
