import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import presenceService, { UserPresence as IUserPresence } from '../../services/presence.service';
import { useAuth } from '../../hooks/useAuth';

interface UserPresenceProps {
  userId: string;
  className?: string;
  showLastSeen?: boolean;
  showTyping?: boolean;
}

const UserPresence: React.FC<UserPresenceProps> = ({
  userId,
  className,
  showLastSeen = true,
  showTyping = true,
}) => {
  const [presence, setPresence] = useState<IUserPresence | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    // Initialize presence service if not already initialized
    presenceService.initialize(token);

    // Get initial presence
    presenceService.getCurrentPresence(userId).then(setPresence);

    // Subscribe to presence updates
    const unsubscribePresence = presenceService.subscribeToPresence(
      userId,
      (newPresence) => {
        setPresence(newPresence);
      }
    );

    // Subscribe to typing status if enabled
    let unsubscribeTyping: (() => void) | undefined;
    if (showTyping) {
      unsubscribeTyping = presenceService.subscribeToTyping(
        userId,
        (_, typing) => {
          setIsTyping(typing);
        }
      );
    }

    return () => {
      unsubscribePresence();
      if (unsubscribeTyping) {
        unsubscribeTyping();
      }
    };
  }, [userId, token, showTyping]);

  if (!presence) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground',
        className
      )}
    >
      <div
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          presence.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
      <span>
        {isTyping && showTyping ? (
          'Typing...'
        ) : presence.status === 'online' ? (
          'Online'
        ) : showLastSeen && presence.lastSeen ? (
          `Last seen ${formatLastSeen(presence.lastSeen)}`
        ) : (
          'Offline'
        )}
      </span>
    </div>
  );
};

const formatLastSeen = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days === 1) {
    return 'yesterday';
  } else {
    return `${days}d ago`;
  }
};

export default UserPresence;
