import React from 'react';
import { format } from 'date-fns';
import {
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Ban,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { MessageStatus as MessageStatusType } from '../../hooks/useMessageStatus';

interface MessageStatusProps {
  status: MessageStatusType;
  timestamp: number;
  readBy: string[];
  deliveredTo: string[];
  retryCount?: number;
  scheduledFor?: number;
  className?: string;
  showTooltip?: boolean;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  timestamp,
  readBy,
  deliveredTo,
  retryCount,
  scheduledFor,
  className = '',
  showTooltip = false,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="w-4 h-4 animate-pulse" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'read':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'blocked':
        return <Ban className="w-4 h-4 text-red-500" />;
      case 'retrying':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getTooltipText = () => {
    const baseText = `${status.charAt(0).toUpperCase() + status.slice(1)} ${format(
      timestamp,
      'HH:mm'
    )}`;

    switch (status) {
      case 'delivered':
        return `${baseText} to ${deliveredTo.length} recipient${
          deliveredTo.length !== 1 ? 's' : ''
        }`;
      case 'read':
        return `${baseText} by ${readBy.length} recipient${
          readBy.length !== 1 ? 's' : ''
        }`;
      case 'failed':
        return `${baseText}${
          retryCount ? ` (${retryCount} retries)` : ''
        }`;
      case 'scheduled':
        return scheduledFor
          ? `Scheduled for ${format(scheduledFor, 'MMM d, HH:mm')}`
          : baseText;
      default:
        return baseText;
    }
  };

  return (
    <div
      className={`inline-flex items-center space-x-1 ${className}`}
      title={showTooltip ? getTooltipText() : undefined}
    >
      {getStatusIcon()}
      {showTooltip && (
        <span className="text-xs">
          {format(timestamp, 'HH:mm')}
        </span>
      )}
    </div>
  );
};
