import { useState } from 'react'

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😏', '🙄', '😴', '🤯', '😤', '😭', '🥺', '😈'],
  'Gestures': ['👍', '👎', '👋', '✌️', '🤞', '🤙', '👊', '🙌', '👏', '🤝', '💪', '🫡', '🫶', '🖖', '✋', '🤘'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❤️‍🔥', '💯', '💢', '💥', '✨', '🔥', '⚡'],
  'Objects': ['⚔️', '🗡️', '🛡️', '🏯', '🎯', '🎮', '💻', '📱', '🔒', '🔑', '💰', '📁', '📎', '🔔', '⏰', '🚀'],
  'Flags': ['🏴', '🏳️', '🇺🇸', '🇯🇵', '🏴‍☠️', '🎌', '🏁', '🚩']
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('Smileys')

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full right-0 mb-2 z-50 bg-samurai-grey-dark border border-samurai-grey rounded-xl shadow-2xl w-72">
        {/* Category Tabs */}
        <div className="flex border-b border-samurai-grey-dark/50 px-2 pt-2 gap-1 overflow-x-auto">
          {Object.keys(EMOJI_CATEGORIES).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-1 text-xs rounded-t-lg whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-samurai-red text-white'
                  : 'text-samurai-steel hover:text-white hover:bg-samurai-grey-darker'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="p-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {EMOJI_CATEGORIES[activeCategory].map(emoji => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose() }}
              className="p-1.5 hover:bg-samurai-grey-darker rounded transition-colors text-lg leading-none"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
