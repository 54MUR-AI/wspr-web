import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { Clock, Copy, Reply, Trash2 } from 'lucide-react';
import { privacyService } from '../../services/privacy.service';

interface MessageContextMenuProps {
  messageId: string;
  children: React.ReactNode;
  onReply: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  messageId,
  children,
  onReply,
  onDelete,
  onCopy,
}) => {
  const handleSetExpiry = async (seconds: number) => {
    try {
      await privacyService.setMessageExpiry(messageId, seconds);
    } catch (error) {
      console.error('Failed to set message expiry:', error);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Clock className="mr-2 h-4 w-4" />
            Set Expiry Time
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => handleSetExpiry(3600)}>
              1 hour
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleSetExpiry(86400)}>
              24 hours
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleSetExpiry(604800)}>
              7 days
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleSetExpiry(2592000)}>
              30 days
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleSetExpiry(0)}>
              Remove Expiry
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessageContextMenu;
