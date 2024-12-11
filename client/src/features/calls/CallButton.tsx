import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { VideoCall as VideoCallIcon } from '@mui/icons-material';
import { useAppSelector } from '../../app/hooks';
import { selectIsInCall } from './callSlice';

interface CallButtonProps {
  recipientId: string;
  recipientName: string;
  onStartCall: (recipientId: string, recipientName: string) => void;
}

const CallButton: React.FC<CallButtonProps> = ({
  recipientId,
  recipientName,
  onStartCall,
}) => {
  const isInCall = useAppSelector(selectIsInCall);

  const handleClick = () => {
    if (!isInCall) {
      onStartCall(recipientId, recipientName);
    }
  };

  return (
    <Tooltip title={isInCall ? 'Already in a call' : 'Start video call'}>
      <span>
        <IconButton
          color="primary"
          onClick={handleClick}
          disabled={isInCall}
          size="large"
        >
          <VideoCallIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default CallButton;
