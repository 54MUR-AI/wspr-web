import React, { useState, useRef, useEffect } from 'react';
import { PaperclipIcon, SendIcon, XIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import FileUpload from './FileUpload';
import presenceService from '../../services/presence.service';

interface MessageComposerProps {
  recipientId: string;
  onSend: (content: string) => void;
  onFileUpload: (fileId: string) => void;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  recipientId,
  onSend,
  onFileUpload,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSend(trimmedMessage);
      setMessage('');
      setIsTyping(false);
      presenceService.updateTypingStatus(recipientId, false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      presenceService.updateTypingStatus(recipientId, true);
    } else if (isTyping && !value.trim()) {
      setIsTyping(false);
      presenceService.updateTypingStatus(recipientId, false);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        presenceService.updateTypingStatus(recipientId, false);
      }, 3000);
    }
  };

  const handleFileUploadComplete = (fileId: string) => {
    setShowFileUpload(false);
    onFileUpload(fileId);
  };

  return (
    <div className="space-y-4">
      {showFileUpload && (
        <FileUpload
          recipientId={recipientId}
          onUploadComplete={handleFileUploadComplete}
          onCancel={() => setShowFileUpload(false)}
        />
      )}

      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => setShowFileUpload(true)}
          title="Attach file"
        >
          <PaperclipIcon className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[150px] resize-none"
            rows={1}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          className="flex-shrink-0"
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MessageComposer;
