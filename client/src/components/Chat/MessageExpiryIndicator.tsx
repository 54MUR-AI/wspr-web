import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageExpiryIndicatorProps {
  expiryTime: Date;
}

const MessageExpiryIndicator: React.FC<MessageExpiryIndicatorProps> = ({ expiryTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      if (expiryTime > now) {
        setTimeLeft(formatDistanceToNow(expiryTime, { addSuffix: true }));
      } else {
        setTimeLeft('Expired');
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiryTime]);

  return (
    <div className="flex items-center text-xs text-gray-500">
      <Clock className="mr-1 h-3 w-3" />
      <span>{timeLeft}</span>
    </div>
  );
};

export default MessageExpiryIndicator;
