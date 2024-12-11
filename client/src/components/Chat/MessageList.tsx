import React from 'react';
import { Message } from '../../services/message.service';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  recipientId: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  recipientId,
}) => {
  const renderMessageGroup = (messages: Message[]) => {
    return messages.map((message) => {
      const isSentByMe = message.senderId === currentUserId;

      return (
        <MessageBubble
          key={message.id}
          message={message}
          isSentByMe={isSentByMe}
        />
      );
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ [key: string]: Message[] }>(
    (groups, message) => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {}
  );

  return (
    <div className="space-y-4">
      {Object.entries(groupedMessages).map(([date, messages]) => (
        <div key={date}>
          <div className="flex justify-center my-4">
            <span className="px-3 py-1 text-sm text-muted-foreground bg-muted rounded-full">
              {date}
            </span>
          </div>
          {renderMessageGroup(messages)}
        </div>
      ))}
    </div>
  );
};

export default MessageList;
