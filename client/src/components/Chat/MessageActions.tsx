import React, { useState } from 'react';
import { Message } from '../../types/message';
import { MessageManagementService } from '../../services/message-management.service';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Pin,
  Clock,
  Bookmark,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';

interface MessageActionsProps {
  message: Message;
  onEdit: (messageId: string, content: string) => void;
  className?: string;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onEdit,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  
  const messageService = MessageManagementService.getInstance();

  const handleEdit = async () => {
    try {
      await messageService.editMessage(message.id, editContent);
      onEdit(message.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDelete = async (type: 'self' | 'all') => {
    try {
      await messageService.deleteMessage(message.id, type);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handlePin = async () => {
    try {
      if (message.pinned) {
        await messageService.unpinMessage(message.id);
      } else {
        await messageService.pinMessage(message.id);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to pin/unpin message:', error);
    }
  };

  const handleSchedule = async () => {
    try {
      await messageService.scheduleMessage(
        message.content,
        scheduledDate.getTime()
      );
      setShowScheduler(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to schedule message:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      if (message.bookmarkedBy?.includes(messageService.ws.getCurrentUserId())) {
        await messageService.removeBookmark(message.id);
      } else {
        await messageService.bookmarkMessage(message.id);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to bookmark message:', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              onClick={() => {
                setIsEditing(true);
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </button>

            <button
              onClick={() => handleDelete('all')}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete for Everyone
            </button>

            <button
              onClick={() => handleDelete('self')}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete for Me
            </button>

            <button
              onClick={handlePin}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <Pin className="w-4 h-4 mr-2" />
              {message.pinned ? 'Unpin' : 'Pin'}
            </button>

            <button
              onClick={() => {
                setShowScheduler(true);
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              Schedule
            </button>

            <button
              onClick={handleBookmark}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {message.bookmarkedBy?.includes(messageService.ws.getCurrentUserId())
                ? 'Remove Bookmark'
                : 'Bookmark'}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Text
            </button>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium mb-4">Edit Message</h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={4}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium mb-4">Schedule Message</h3>
            <input
              type="datetime-local"
              value={format(scheduledDate, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setScheduledDate(new Date(e.target.value))}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowScheduler(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
