import { Send, Paperclip, Smile, Hash, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import { socketService, Message } from '../../services/socket'

interface MessageThreadProps {
  channelName: string
  userEmail?: string
  userId?: string
  isConnected?: boolean
}

export default function MessageThread({ channelName, userEmail, userId, isConnected }: MessageThreadProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    // Join channel when it changes
    socketService.joinChannel(channelName)
    
    // Listen for new messages
    const unsubscribe = socketService.onMessage((newMessage) => {
      if (newMessage.channelId === channelName) {
        setMessages(prev => [...prev, newMessage])
      }
    })

    return () => {
      socketService.leaveChannel(channelName)
      unsubscribe()
    }
  }, [channelName])

  const handleSend = () => {
    if (message.trim() && userId && userEmail) {
      const author = userEmail.split('@')[0] // Use email username as author
      socketService.sendMessage(channelName, message.trim(), author, userId)
      setMessage('')
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="flex-1 flex flex-col bg-samurai-black">
      {/* Channel Header */}
      <div className="h-16 border-b border-samurai-grey-dark px-4 sm:px-6 flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="sm:hidden p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-samurai-steel" />
        </button>
        
        <Hash className="w-5 h-5 text-samurai-red" />
        <h3 className="text-lg font-bold text-white">{channelName}</h3>
        <div className="flex-1" />
        
        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-samurai-steel mr-4">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {userEmail && (
          <div className="hidden md:block text-sm text-samurai-steel mr-4">
            <span className="text-samurai-red">{userEmail.split('@')[0]}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-samurai-steel">
              <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group hover:bg-samurai-black-light px-2 sm:px-4 py-2 -mx-2 sm:-mx-4 rounded-lg transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-samurai-red flex items-center justify-center font-bold text-white flex-shrink-0 text-sm sm:text-base">
                {msg.author[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-white truncate">{msg.author}</span>
                  <span className="text-xs text-samurai-steel flex-shrink-0">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-samurai-steel-light break-words">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-3 sm:p-4 border-t border-samurai-grey-dark">
        <div className="glass-card rounded-xl p-2 sm:p-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="hidden sm:block p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors">
              <Paperclip className="w-5 h-5 text-samurai-steel hover:text-white transition-colors" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Message #${channelName}`}
              disabled={!isConnected}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-samurai-steel text-sm sm:text-base px-2 disabled:opacity-50"
            />
            <button className="hidden sm:block p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors">
              <Smile className="w-5 h-5 text-samurai-steel hover:text-white transition-colors" />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || !isConnected}
              className="p-2 sm:p-2 bg-samurai-red hover:bg-samurai-red-dark disabled:bg-samurai-grey-dark disabled:cursor-not-allowed rounded-lg transition-colors"
              title={!isConnected ? 'Connecting to server...' : 'Send message'}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
