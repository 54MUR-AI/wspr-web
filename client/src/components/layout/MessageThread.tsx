import { Send, Paperclip, Smile, Hash, Menu, Edit2, Trash2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { socketService, Message } from '../../services/socket'
import { getChannelMessages, sendChannelMessage, subscribeToChannelMessages, decryptMessageContent, editMessage, deleteMessage } from '../../services/supabase-message.service'
import { supabase } from '../../lib/supabase'
import type { WsprMessage } from '../../lib/supabase'

interface MessageThreadProps {
  channelId: string
  userEmail?: string
  userId?: string
  username?: string
  isConnected?: boolean
}

export default function MessageThread({ channelId, userEmail, userId, username, isConnected }: MessageThreadProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<WsprMessage[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [channelName, setChannelName] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  useEffect(() => {
    if (!channelId || !userId) {
      setIsLoading(false)
      setChannelName('')
      return
    }

    // Fetch channel name
    const fetchChannelName = async () => {
      const { data } = await supabase
        .from('wspr_channels')
        .select('name')
        .eq('id', channelId)
        .single()
      
      if (data) {
        setChannelName(data.name)
      }
    }

    // Load message history from Supabase
    const loadMessages = async () => {
      setIsLoading(true)
      const messageHistory = await getChannelMessages(channelId, 50)
      setMessages(messageHistory)
      setIsLoading(false)
      
      // Scroll to bottom after loading
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    fetchChannelName()
    loadMessages()

    // Subscribe to real-time messages
    const unsubscribe = subscribeToChannelMessages(channelId, (newMessage) => {
      setMessages(prev => {
        // Prevent duplicates - check if message already exists
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev
        }
        return [...prev, newMessage]
      })
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })

    return () => {
      unsubscribe()
    }
  }, [channelId, userId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || !channelId || !userId) return

    const newMessage = await sendChannelMessage(channelId, userId, message)
    if (newMessage) {
      // Optimistically add message to UI
      setMessages(prev => [...prev, newMessage])
      setMessage('')
    }
  }

  const handleEdit = async (messageId: string) => {
    if (!editingContent.trim() || !userId) return

    const result = await editMessage(messageId, userId, editingContent)
    if (result.success && result.encryptedContent) {
      // Update message in UI with encrypted content
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: result.encryptedContent!, edited_at: new Date().toISOString() }
          : msg
      ))
      setEditingMessageId(null)
      setEditingContent('')
    } else {
      alert('Failed to edit message')
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!userId || !confirm('Delete this message?')) return

    const success = await deleteMessage(messageId, userId)
    if (success) {
      // Remove message from UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } else {
      alert('Failed to delete message')
    }
  }

  const startEdit = (msg: WsprMessage) => {
    setEditingMessageId(msg.id)
    setEditingContent(userId ? decryptMessageContent(msg, userId) : msg.content)
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
        <h3 className="text-lg font-bold text-white">{channelName || 'Select a channel'}</h3>
        <div className="flex-1" />
        
        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-samurai-steel mr-4">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {username && (
          <div className="hidden md:block text-sm text-samurai-steel mr-4">
            <span className="text-samurai-red">{username}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-samurai-red border-t-transparent mb-4"></div>
              <p className="text-samurai-steel">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-samurai-steel">
              <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const displayName = (msg as any).user?.display_name || 'Unknown'
              const decryptedContent = userId ? decryptMessageContent(msg, userId) : msg.content
              const isAuthor = msg.user_id === userId
              const isEditing = editingMessageId === msg.id
              
              return (
                <div key={msg.id} className="flex gap-3 group hover:bg-samurai-black-light px-2 sm:px-4 py-2 -mx-2 sm:-mx-4 rounded-lg transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-samurai-red flex items-center justify-center font-bold text-white flex-shrink-0 text-sm sm:text-base">
                    {displayName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white truncate">{displayName}</span>
                      <span className="text-xs text-samurai-steel flex-shrink-0">{formatTime(msg.created_at)}</span>
                      {msg.edited_at && (
                        <span className="text-xs text-samurai-steel italic">(edited)</span>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleEdit(msg.id)}
                          className="flex-1 bg-samurai-black border border-samurai-grey-dark rounded px-2 py-1 text-white text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEdit(msg.id)}
                          className="text-samurai-red hover:text-samurai-red-dark text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-samurai-steel hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <p className="text-samurai-steel-light break-words flex-1">{decryptedContent}</p>
                        {isAuthor && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(msg)}
                              className="p-1 hover:bg-samurai-grey-darker rounded"
                              title="Edit message"
                            >
                              <Edit2 className="w-3 h-3 text-samurai-steel hover:text-white" />
                            </button>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="p-1 hover:bg-samurai-grey-darker rounded"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3 text-samurai-steel hover:text-samurai-red" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
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
              onKeyPress={handleKeyPress}
              placeholder={`Message ${channelName ? '#' + channelName : ''}`}
              disabled={!channelId}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-samurai-steel text-sm sm:text-base px-2 disabled:opacity-50"
            />
            <button className="hidden sm:block p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors">
              <Smile className="w-5 h-5 text-samurai-steel hover:text-white transition-colors" />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || !channelId}
              className="p-2 sm:p-2 bg-samurai-red hover:bg-samurai-red-dark disabled:bg-samurai-grey-dark disabled:cursor-not-allowed rounded-lg transition-colors"
              title={!channelId ? 'Select a channel first' : 'Send message'}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
