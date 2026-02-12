import { Send, Smile, Menu, Trash2, MessageSquare } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getDMMessages, sendDM, markAllDMsAsRead, deleteDM, subscribeToDMs } from '../../services/dm.service'
import type { DirectMessage } from '../../services/dm.service'
import { supabase } from '../../lib/supabase'

interface DMThreadProps {
  contactId: string
  userId: string
  username?: string
  isConnected?: boolean
}

interface ProfileInfo {
  display_name: string
  avatar_url: string | null
  avatar_color: string | null
}

export default function DMThread({ contactId, userId, username, isConnected }: DMThreadProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contactInfo, setContactInfo] = useState<ProfileInfo | null>(null)
  const [userInfo, setUserInfo] = useState<ProfileInfo | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load contact info and current user info
  useEffect(() => {
    if (!contactId) return

    const fetchContactInfo = async () => {
      const { data } = await supabase
        .from('wspr_profiles')
        .select('display_name, avatar_url, avatar_color')
        .eq('id', contactId)
        .single()

      if (data) {
        setContactInfo(data)
      }
    }

    fetchContactInfo()
  }, [contactId])

  useEffect(() => {
    if (!userId) return

    const fetchUserInfo = async () => {
      const { data } = await supabase
        .from('wspr_profiles')
        .select('display_name, avatar_url, avatar_color')
        .eq('id', userId)
        .single()

      if (data) {
        setUserInfo(data)
      }
    }

    fetchUserInfo()
  }, [userId])

  // Load messages and subscribe to new ones
  useEffect(() => {
    if (!contactId || !userId) {
      setIsLoading(false)
      return
    }

    const loadMessages = async () => {
      setIsLoading(true)
      const dmMessages = await getDMMessages(userId, contactId, 50)
      setMessages(dmMessages)
      setIsLoading(false)

      // Mark all messages from this contact as read
      await markAllDMsAsRead(userId, contactId)

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    loadMessages()

    // Subscribe to new DMs from this contact
    const subscription = supabase
      .channel(`dm-${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wspr_direct_messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage
          // Only add if it's from this contact
          if (newMsg.sender_id === contactId) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            // Auto-mark as read since we're viewing this conversation
            markAllDMsAsRead(userId, contactId)
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wspr_direct_messages',
          filter: `sender_id=eq.${userId}`
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage
          // Only add if it's to this contact (our own sent messages via realtime)
          if (newMsg.recipient_id === contactId) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [contactId, userId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || !contactId || !userId) return

    const newMessage = await sendDM(userId, contactId, message)
    if (newMessage) {
      // Optimistically add to UI
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
      setMessage('')
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return
    const success = await deleteDM(messageId, userId)
    if (success) {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    }
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

  const contactName = contactInfo?.display_name || 'Loading...'
  const contactAvatar = contactInfo?.avatar_url
  const contactColor = contactInfo?.avatar_color || '#E63946'

  return (
    <div className="flex-1 flex flex-col bg-samurai-black">
      {/* DM Header */}
      <div className="h-16 border-b border-samurai-grey-dark px-4 sm:px-6 flex items-center gap-3">
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="sm:hidden p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-samurai-steel" />
        </button>
        
        {/* Contact Avatar */}
        {contactAvatar ? (
          <img
            src={contactAvatar}
            alt={contactName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: contactColor }}
          >
            {contactName[0]?.toUpperCase() || '?'}
          </div>
        )}
        
        <h3 className="text-lg font-bold text-white">{contactName}</h3>
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
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Say hello!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isSender = msg.sender_id === userId
              const displayName = isSender ? (userInfo?.display_name || username || 'You') : contactName
              const avatarUrl = isSender ? (userInfo?.avatar_url || null) : contactAvatar
              const avatarColor = isSender ? (userInfo?.avatar_color || '#E63946') : contactColor

              const avatar = avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 text-sm sm:text-base"
                  style={{ backgroundColor: avatarColor }}
                >
                  {displayName[0]?.toUpperCase() || '?'}
                </div>
              )

              return (
                <div key={msg.id} className={`flex gap-3 group hover:bg-samurai-black-light px-2 sm:px-4 py-2 -mx-2 sm:-mx-4 rounded-lg transition-colors ${!isSender ? 'flex-row-reverse' : ''}`}>
                  {avatar}
                  <div className={`flex-1 min-w-0 ${!isSender ? 'text-right' : ''}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${!isSender ? 'justify-end' : ''}`}>
                      <span className="font-semibold text-white truncate">{displayName}</span>
                      <span className="text-xs text-samurai-steel flex-shrink-0">{formatTime(msg.created_at)}</span>
                      {!isSender && msg.read_at && (
                        <span className="text-xs text-green-500/60">✓</span>
                      )}
                    </div>
                    <div className={`flex items-start gap-2 ${!isSender ? 'justify-end' : ''}`}>
                      {isSender && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1 hover:bg-samurai-grey-darker rounded"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3 text-samurai-steel hover:text-samurai-red" />
                          </button>
                        </div>
                      )}
                      <p className="text-samurai-steel-light break-words flex-1">{msg.content}</p>
                    </div>
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
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${contactName}`}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-samurai-steel text-sm sm:text-base px-2"
            />
            <button className="hidden sm:block p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors">
              <Smile className="w-5 h-5 text-samurai-steel hover:text-white transition-colors" />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 sm:p-2 bg-samurai-red hover:bg-samurai-red-dark disabled:bg-samurai-grey-dark disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
