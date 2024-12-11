import React, { useState, useEffect } from 'react';
import { Message, MessageReaction } from '../../types/message';
import { messageInteractionService } from '../../services/message-interaction.service';
import { errorService } from '../../services/error.service';
import { Smile, MessageSquare, Share2 } from 'lucide-react';

interface MessageInteractionsProps {
  message: Message;
  onReply: (messageId: string) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😄', '🎉', '🤔', '👀', '🙌', '⭐'];

export const MessageInteractions: React.FC<MessageInteractionsProps> = ({
  message,
  onReply,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<MessageReaction[]>(message.reactions || []);
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    window.addEventListener('wspr:reaction:update', handleReactionUpdate);
    return () => {
      window.removeEventListener('wspr:reaction:update', handleReactionUpdate);
    };
  }, []);

  const handleReactionUpdate = (event: CustomEvent) => {
    const { messageId, reaction, action } = event.detail;
    if (messageId !== message.id) return;

    if (action === 'add') {
      setReactions(prev => [...prev, reaction]);
    } else {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      const reaction = await messageInteractionService.addReaction(message.id, emoji);
      setShowEmojiPicker(false);
    } catch (error) {
      errorService.handleError(error, 'ADD_REACTION_FAILED', 'low');
    }
  };

  const handleRemoveReaction = async (reactionId: string) => {
    try {
      await messageInteractionService.removeReaction(message.id, reactionId);
    } catch (error) {
      errorService.handleError(error, 'REMOVE_REACTION_FAILED', 'low');
    }
  };

  const handleReplyClick = () => {
    setIsReplying(true);
    onReply(message.id);
  };

  const groupedReactions = reactions.reduce((acc, reaction) => {
    const key = reaction.emoji;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-500">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          title="Add reaction"
        >
          <Smile className="w-4 h-4" />
        </button>
        <button
          onClick={handleReplyClick}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          title="Reply"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={() => {}} // Implement thread creation
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          title="Start thread"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="flex gap-1 p-2 bg-white rounded-lg shadow-lg">
          {COMMON_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleAddReaction(emoji)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {Object.entries(groupedReactions).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(groupedReactions).map(([emoji, reactions]) => (
            <button
              key={emoji}
              onClick={() => handleRemoveReaction(reactions[0].id)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <span>{emoji}</span>
              <span className="text-xs text-gray-600">{reactions.length}</span>
            </button>
          ))}
        </div>
      )}

      {message.replies && message.replies.length > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
        </div>
      )}
    </div>
  );
};
