import { Send, Paperclip, Smile, Hash } from 'lucide-react'
import { useState } from 'react'

interface MessageThreadProps {
  channelName: string
}

interface Message {
  id: string
  author: string
  content: string
  timestamp: string
  avatar: string
}

export default function MessageThread({ channelName }: MessageThreadProps) {
  const [message, setMessage] = useState('')

  // Mock messages
  const messages: Message[] = [
    {
      id: '1',
      author: 'Alice',
      content: 'Hey team! Just pushed the new feature to staging.',
      timestamp: '10:23 AM',
      avatar: 'A',
    },
    {
      id: '2',
      author: 'Bob',
      content: 'Awesome! I\'ll test it out this afternoon.',
      timestamp: '10:25 AM',
      avatar: 'B',
    },
    {
      id: '3',
      author: 'Charlie',
      content: 'Looks great! The new UI is much cleaner.',
      timestamp: '10:30 AM',
      avatar: 'C',
    },
  ]

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Send message via Socket.IO
      console.log('Sending message:', message)
      setMessage('')
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-samurai-black">
      {/* Channel Header */}
      <div className="h-16 border-b border-samurai-grey-dark px-6 flex items-center gap-3">
        <Hash className="w-5 h-5 text-samurai-red" />
        <h3 className="text-lg font-bold">{channelName}</h3>
        <div className="flex-1" />
        <div className="text-sm text-samurai-steel">
          3 members
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 group hover:bg-samurai-black-light px-4 py-2 -mx-4 rounded-lg transition-colors">
            <div className="w-10 h-10 rounded-lg bg-samurai-red flex items-center justify-center font-bold text-white flex-shrink-0">
              {msg.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold text-white">{msg.author}</span>
                <span className="text-xs text-samurai-steel">{msg.timestamp}</span>
              </div>
              <p className="text-samurai-steel-light">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-samurai-grey-dark">
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors">
              <Paperclip className="w-5 h-5 text-samurai-steel hover:text-white transition-colors" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message #${channelName}`}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-samurai-steel"
            />
            <button className="p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors">
              <Smile className="w-5 h-5 text-samurai-steel hover:text-white transition-colors" />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 bg-samurai-red hover:bg-samurai-red-dark disabled:bg-samurai-grey-dark disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
