import React, { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Message } from '../../types/message';
import { MessageInteractions } from './MessageInteractions';
import { errorService } from '../../services/error.service';
import { debounce } from 'lodash';

interface VirtualizedMessageListProps {
  messages: Message[];
  onReply: (messageId: string) => void;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

const OVERSCAN_COUNT = 5;
const ESTIMATED_MESSAGE_HEIGHT = 100;
const SCROLL_DEBOUNCE_MS = 100;

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  onReply,
  onScroll,
  className = '',
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(true);
  const [messageHeights, setMessageHeights] = useState<Map<string, number>>(new Map());

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => messageHeights.get(messages[index].id) || ESTIMATED_MESSAGE_HEIGHT,
    overscan: OVERSCAN_COUNT,
  });

  useEffect(() => {
    if (scrolledToBottom) {
      scrollToBottom();
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  };

  const handleScroll = debounce(() => {
    if (!parentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setScrolledToBottom(isBottom);

    onScroll?.(scrollTop);
  }, SCROLL_DEBOUNCE_MS);

  const measureMessageHeight = (messageId: string, height: number) => {
    setMessageHeights((prev) => {
      const newHeights = new Map(prev);
      newHeights.set(messageId, height);
      return newHeights;
    });
  };

  const renderMessage = (index: number) => {
    const message = messages[index];
    const measureRef = (element: HTMLDivElement | null) => {
      if (element) {
        measureMessageHeight(message.id, element.getBoundingClientRect().height);
      }
    };

    return (
      <div
        ref={measureRef}
        className="p-4 hover:bg-gray-50 transition-colors"
        data-message-id={message.id}
      >
        <MessageContent message={message} />
        <MessageInteractions message={message} onReply={onReply} />
      </div>
    );
  };

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className={`h-full overflow-auto ${className}`}
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderMessage(virtualItem.index)}
          </div>
        ))}
      </div>

      {!scrolledToBottom && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600 transition-colors"
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

interface MessageContentProps {
  message: Message;
}

const MessageContent: React.FC<MessageContentProps> = React.memo(({ message }) => {
  const renderContent = () => {
    try {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{message.userId}</span>
            <span className="text-sm text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            {message.edited && (
              <span className="text-sm text-gray-500">(edited)</span>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            {message.content}
          </div>
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 bg-gray-100 rounded"
                >
                  <span>{attachment.name}</span>
                  <span className="text-sm text-gray-500">
                    ({formatFileSize(attachment.size)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } catch (error) {
      errorService.handleError(error, 'MESSAGE_RENDER_FAILED', 'low');
      return <div className="text-red-500">Error rendering message</div>;
    }
  };

  return renderContent();
});

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
};

MessageContent.displayName = 'MessageContent';
