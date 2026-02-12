import { Send, Paperclip, Smile, Menu, Trash2, MessageSquare } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getDMMessages, sendDM, markAllDMsAsRead, deleteDM, subscribeToDMs } from '../../services/dm.service'
import type { DirectMessage } from '../../services/dm.service'
import { addDMAttachment, getDMMessageAttachments, deleteDMAttachment, downloadDMAttachment, createFileShare } from '../../services/dm-attachment.service'
import type { DMAttachment } from '../../services/dm-attachment.service'
import { supabase } from '../../lib/supabase'
import AttachmentModal from '../attachments/AttachmentModal'
import AttachmentCard from '../attachments/AttachmentCard'

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
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [messageAttachments, setMessageAttachments] = useState<Map<string, DMAttachment[]>>(new Map())
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ ldgr_file_id: string; filename: string; file_size: number; mime_type: string }>>([])
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

  // Load attachments for all messages
  useEffect(() => {
    if (messages.length === 0) return

    const loadAttachments = async () => {
      const attachmentMap = new Map<string, DMAttachment[]>()
      for (const msg of messages) {
        const attachments = await getDMMessageAttachments(msg.id)
        if (attachments.length > 0) {
          attachmentMap.set(msg.id, attachments)
        }
      }
      setMessageAttachments(attachmentMap)
    }

    loadAttachments()
  }, [messages.length])

  const handleSend = async () => {
    if ((!message.trim() && pendingAttachments.length === 0) || !contactId || !userId) return

    const content = message.trim() || (pendingAttachments.length > 0 ? `Shared ${pendingAttachments.length} file${pendingAttachments.length > 1 ? 's' : ''}` : '')
    const newMessage = await sendDM(userId, contactId, content)
    if (newMessage) {
      // Add attachments if any
      if (pendingAttachments.length > 0) {
        for (const attachment of pendingAttachments) {
          await addDMAttachment(
            newMessage.id,
            attachment.ldgr_file_id,
            attachment.filename,
            attachment.file_size,
            attachment.mime_type,
            userId
          )
          // Create file share record for recipient's Drops folder
          await createFileShare(
            attachment.ldgr_file_id,
            contactId,
            userId,
            'dm',
            contactId
          )
        }
        const attachments = await getDMMessageAttachments(newMessage.id)
        setMessageAttachments(prev => new Map(prev).set(newMessage.id, attachments))
        setPendingAttachments([])
      }
      // Optimistically add to UI
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
      setMessage('')
    }
  }

  const handleAttachFile = (file: { ldgr_file_id: string; filename: string; file_size: number; mime_type: string }) => {
    setPendingAttachments(prev => [...prev, file])
  }

  const handleRemovePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteAttachment = async (attachmentId: string, messageId: string) => {
    if (!userId || !confirm('Delete this attachment?')) return
    const success = await deleteDMAttachment(attachmentId, userId)
    if (success) {
      const attachments = await getDMMessageAttachments(messageId)
      setMessageAttachments(prev => new Map(prev).set(messageId, attachments))
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
                  <div className={`flex-1 min-w-0 ${!isSender ? 'flex flex-col items-end' : ''}`}>
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
                      <p className={`text-samurai-steel-light break-words ${isSender ? 'flex-1' : ''}`}>{msg.content}</p>
                    </div>
                    {/* DM Attachments */}
                    {messageAttachments.get(msg.id) && messageAttachments.get(msg.id)!.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {messageAttachments.get(msg.id)!.map(attachment => (
                          <AttachmentCard
                            key={attachment.id}
                            attachment={attachment}
                            onDownload={downloadDMAttachment}
                            onDelete={(id) => handleDeleteAttachment(id, msg.id)}
                            canDelete={isSender}
                          />
                        ))}
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
          {/* Pending Attachments */}
          {pendingAttachments.length > 0 && (
            <div className="mb-2 space-y-2">
              {pendingAttachments.map((attachment, index) => (
                <div key={index} className="glass-card p-2 rounded flex items-center gap-2">
                  <span className="text-sm text-white truncate flex-1">{attachment.filename}</span>
                  <button
                    onClick={() => handleRemovePendingAttachment(index)}
                    className="text-samurai-red hover:text-samurai-red-dark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setShowAttachmentModal(true)}
              className="hidden sm:block p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5 text-samurai-steel hover:text-white transition-colors" />
            </button>
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
              disabled={!message.trim() && pendingAttachments.length === 0}
              className="p-2 sm:p-2 bg-samurai-red hover:bg-samurai-red-dark disabled:bg-samurai-grey-dark disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onAttachFile={handleAttachFile}
        userId={userId}
      />
    </div>
  )
}
