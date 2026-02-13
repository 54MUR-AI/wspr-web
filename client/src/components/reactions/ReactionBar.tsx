import { useState } from 'react'
import { Smile } from 'lucide-react'
import type { Reaction } from '../../services/reaction.service'
import { toggleReaction } from '../../services/reaction.service'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👀', '🎉', '💯', '⚔️']

interface ReactionBarProps {
  messageId: string
  userId: string
  reactions: Reaction[]
  onReactionChange: () => void
  isAuthor?: boolean
}

export default function ReactionBar({ messageId, userId, reactions, onReactionChange, isAuthor = true }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false)

  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, { count: number; userReacted: boolean; users: string[] }>>((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, userReacted: false, users: [] }
    }
    acc[r.emoji].count++
    acc[r.emoji].users.push(r.user_id)
    if (r.user_id === userId) acc[r.emoji].userReacted = true
    return acc
  }, {})

  const handleToggle = async (emoji: string) => {
    setShowPicker(false)
    await toggleReaction(messageId, userId, emoji)
    onReactionChange()
  }

  return (
    <div className={`flex items-center gap-1 flex-wrap mt-1 ${!isAuthor ? 'flex-row-reverse' : ''}`}>
      {/* Existing reactions */}
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => handleToggle(emoji)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
            data.userReacted
              ? 'bg-samurai-red/20 border border-samurai-red/40 text-white'
              : 'bg-samurai-grey-darker border border-samurai-grey-dark text-samurai-steel hover:text-white'
          }`}
          title={`${data.count} reaction${data.count > 1 ? 's' : ''}`}
        >
          <span>{emoji}</span>
          <span className="font-medium">{data.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded-full text-samurai-steel hover:text-white hover:bg-samurai-grey-darker transition-colors opacity-0 group-hover:opacity-100"
          title="Add reaction"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className={`absolute bottom-full mb-1 z-50 bg-samurai-grey-dark border border-samurai-grey rounded-lg shadow-xl p-2 flex gap-1 ${isAuthor ? 'left-0' : 'right-0'}`}>
              {QUICK_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleToggle(emoji)}
                  className="p-1.5 hover:bg-samurai-grey-darker rounded transition-colors text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
