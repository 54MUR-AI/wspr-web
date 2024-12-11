import React, { useState, useEffect } from 'react';
import { Message } from '../../types/message';
import { MessageManagementService } from '../../services/message-management.service';
import { format } from 'date-fns';
import {
  Bookmark,
  MessageSquare,
  User,
  Tag,
  Search,
  Trash2,
  ExternalLink,
  Share2
} from 'lucide-react';

interface BookmarkedMessagesProps {
  className?: string;
  onMessageClick?: (message: Message) => void;
}

export const BookmarkedMessages: React.FC<BookmarkedMessagesProps> = ({
  className = '',
  onMessageClick
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState<string | null>(null);

  const messageService = MessageManagementService.getInstance();

  useEffect(() => {
    loadBookmarkedMessages();
  }, []);

  const loadBookmarkedMessages = async () => {
    try {
      const bookmarkedMessages = await messageService.getBookmarkedMessages();
      setMessages(bookmarkedMessages);

      // Extract unique tags
      const tags = new Set<string>();
      bookmarkedMessages.forEach(message => {
        message.tags?.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (error) {
      console.error('Failed to load bookmarked messages:', error);
    }
  };

  const handleSearch = async () => {
    try {
      const results = await messageService.searchBookmarkedMessages(
        searchQuery,
        selectedTags
      );
      setMessages(results);
    } catch (error) {
      console.error('Failed to search bookmarked messages:', error);
    }
  };

  const handleRemoveBookmark = async (messageId: string) => {
    try {
      await messageService.bookmarkMessage(messageId, false);
      await loadBookmarkedMessages();
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  };

  const handleShare = async (messageId: string) => {
    try {
      const shareLink = await messageService.createShareableLink(messageId);
      setIsSharing(shareLink);
    } catch (error) {
      console.error('Failed to create shareable link:', error);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-medium mb-4">Bookmarked Messages</h2>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className="p-4 border rounded-lg dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => onMessageClick?.(message)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(message.id);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBookmark(message.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {message.content}
            </p>

            {message.tags && message.tags.length > 0 && (
              <div className="flex items-center space-x-2 mb-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {message.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {message.threadId && (
              <div className="flex items-center space-x-2 text-xs text-blue-500">
                <MessageSquare className="w-4 h-4" />
                <span>Part of a thread</span>
              </div>
            )}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No bookmarked messages
          </div>
        )}
      </div>

      {/* Share Link Modal */}
      {isSharing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium mb-4">Share Message</h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={isSharing}
                readOnly
                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(isSharing);
                  setIsSharing(null);
                }}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsSharing(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
