import { Send, Paperclip, Smile, Hash, Menu, Edit2, Trash2, Reply, X, Copy, Users, ArrowDown } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeToTyping, sendTypingEvent } from '../../services/typing.service'
import { socketService, Message } from '../../services/socket'
import { getChannelMessages, sendChannelMessage, subscribeToChannelMessages, decryptMessageContent, editMessage, deleteMessage } from '../../services/supabase-message.service'
import { addAttachment, getMessageAttachments, deleteAttachment, downloadAttachment, Attachment } from '../../services/attachment.service'
import { supabase } from '../../lib/supabase'
import type { WsprMessage } from '../../lib/supabase'
import AttachmentModal from '../attachments/AttachmentModal'
import AttachmentCard from '../attachments/AttachmentCard'
import { isAdminOrModerator } from '../../services/permissions.service'
import { getReactionsForMessages, subscribeToReactions, getMessageReactions } from '../../services/reaction.service'
import type { Reaction } from '../../services/reaction.service'
import ReactionBar from '../reactions/ReactionBar'
import EmojiPicker from '../emoji/EmojiPicker'
import UserProfilePopup from '../profile/UserProfilePopup'
import ChannelMemberList from '../channels/ChannelMemberList'
import MessageContent from '../messages/MessageContent'
import ConfirmDialog from '../modals/ConfirmDialog'

interface MessageThreadProps {
  channelId: string
  userEmail?: string
  userId?: string
  username?: string
  isConnected?: boolean
  onMenuToggle?: () => void
}

export default function MessageThread({ channelId, userEmail, userId, username, isConnected, onMenuToggle }: MessageThreadProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<WsprMessage[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [channelName, setChannelName] = useState('')
  const [channelFolderId, setChannelFolderId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [messageAttachments, setMessageAttachments] = useState<Map<string, Attachment[]>>(new Map())
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ ldgr_file_id: string; filename: string; file_size: number; mime_type: string }>>([])
  const [isAdminOrMod, setIsAdminOrMod] = useState(false)
  const [isPublicWorkspace, setIsPublicWorkspace] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const [messageReactions, setMessageReactions] = useState<Map<string, Reaction[]>>(new Map())
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; displayName: string } | null>(null)
  const [showMemberList, setShowMemberList] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!channelId || !userId) {
      setIsLoading(false)
      setChannelName('')
      return
    }

    // Fetch channel name, folder ID, and workspace info
    const fetchChannelInfo = async () => {
      const { data } = await supabase
        .from('wspr_channels')
        .select('name, ldgr_folder_id, workspace:wspr_workspaces(name)')
        .eq('id', channelId)
        .single()
      
      if (data) {
        setChannelName(data.name)
        setChannelFolderId(data.ldgr_folder_id)
        setIsPublicWorkspace((data as any).workspace?.name === 'Public')
      }
    }

    // Check if user is admin or moderator
    const checkAdminStatus = async () => {
      if (userId) {
        const isAdminMod = await isAdminOrModerator(userId)
        setIsAdminOrMod(isAdminMod)
      }
    }

    // Load message history from Supabase
    const loadMessages = async () => {
      setIsLoading(true)
      setHasMoreMessages(true)
      const messageHistory = await getChannelMessages(channelId, 50)
      setMessages(messageHistory)
      setHasMoreMessages(messageHistory.length >= 50)
      
      // Load attachments for all messages
      const attachmentsMap = new Map<string, Attachment[]>()
      for (const msg of messageHistory) {
        const attachments = await getMessageAttachments(msg.id)
        if (attachments.length > 0) {
          attachmentsMap.set(msg.id, attachments)
        }
      }
      setMessageAttachments(attachmentsMap)

      // Load reactions for all messages
      const reactionsMap = await getReactionsForMessages(messageHistory.map(m => m.id))
      setMessageReactions(reactionsMap)
      
      setIsLoading(false)
      
      // Scroll to bottom after loading
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    fetchChannelInfo()
    checkAdminStatus()
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

    // Subscribe to reaction changes
    const unsubReactions = subscribeToReactions(channelId, async (messageId) => {
      const reactions = await getMessageReactions(messageId)
      setMessageReactions(prev => new Map(prev).set(messageId, reactions))
    })

    return () => {
      unsubscribe()
      unsubReactions()
    }
  }, [channelId, userId])

  // Subscribe to typing indicators for this channel
  useEffect(() => {
    if (!channelId || !userId) return

    const unsubscribeTyping = subscribeToTyping(
      `channel:${channelId}`,
      userId,
      (uid, name) => setTypingUsers(prev => new Map(prev).set(uid, name)),
      (uid) => setTypingUsers(prev => { const next = new Map(prev); next.delete(uid); return next })
    )

    return unsubscribeTyping
  }, [channelId, userId])

  const handleTyping = useCallback(() => {
    if (!channelId || !userId) return
    sendTypingEvent(`channel:${channelId}`, userId, username || 'Someone', true)
  }, [channelId, userId, username])

  // Load older messages when scrolling to top
  const loadOlderMessages = useCallback(async () => {
    if (!channelId || !hasMoreMessages || isLoadingMore || messages.length === 0) return
    setIsLoadingMore(true)
    const olderMessages = await getChannelMessages(channelId, 50, messages.length)
    if (olderMessages.length < 50) setHasMoreMessages(false)
    if (olderMessages.length > 0) {
      setMessages(prev => [...olderMessages, ...prev])
      // Load reactions for older messages
      const reactionsMap = await getReactionsForMessages(olderMessages.map(m => m.id))
      setMessageReactions(prev => {
        const next = new Map(prev)
        for (const [k, v] of reactionsMap) next.set(k, v)
        return next
      })
    }
    setIsLoadingMore(false)
  }, [channelId, hasMoreMessages, isLoadingMore, messages.length])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      loadOlderMessages()
    }
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    setShowScrollBottom(distanceFromBottom > 200)
  }, [loadOlderMessages, hasMoreMessages, isLoadingMore])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || !channelId || !userId) return

    // Stop typing indicator on send
    sendTypingEvent(`channel:${channelId}`, userId, username || '', false)

    const newMessage = await sendChannelMessage(channelId, userId, message, replyingTo?.id)
    if (newMessage) {
      setReplyingTo(null)
      // Add attachments if any
      if (pendingAttachments.length > 0) {
        for (const attachment of pendingAttachments) {
          await addAttachment(
            newMessage.id,
            attachment.ldgr_file_id,
            attachment.filename,
            attachment.file_size,
            attachment.mime_type,
            userId
          )
        }
        // Fetch attachments for the new message
        const attachments = await getMessageAttachments(newMessage.id)
        setMessageAttachments(prev => new Map(prev).set(newMessage.id, attachments))
        setPendingAttachments([])
      }
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, newMessage])
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

    const success = await deleteAttachment(attachmentId, userId)
    if (success) {
      // Update attachments map
      const attachments = await getMessageAttachments(messageId)
      setMessageAttachments(prev => new Map(prev).set(messageId, attachments))
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
    if (!userId) return
    const success = await deleteMessage(messageId, userId)
    if (success) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    }
    setDeleteConfirmId(null)
  }

  const startEdit = (msg: WsprMessage) => {
    setEditingMessageId(msg.id)
    setEditingContent(userId ? decryptMessageContent(msg, userId) : msg.content)
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === 'Escape') {
      if (editingMessageId) cancelEdit()
      else if (replyingTo) setReplyingTo(null)
      else if (showEmojiPicker) setShowEmojiPicker(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatFullTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="flex-1 flex flex-col bg-samurai-black">
      {/* Channel Header */}
      <div className="h-16 border-b border-samurai-grey-dark px-4 sm:px-6 flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => onMenuToggle ? onMenuToggle() : setShowMobileMenu(!showMobileMenu)}
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
        
        {/* Members Toggle */}
        {channelId && (
          <button
            onClick={() => setShowMemberList(!showMemberList)}
            className={`p-2 rounded-lg transition-colors ${showMemberList ? 'bg-samurai-red text-white' : 'hover:bg-samurai-grey-darker text-samurai-steel hover:text-white'}`}
            title="Toggle member list"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content Row: Messages + Member List */}
      <div className="flex flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {isLoadingMore && (
          <div className="text-center py-2">
            <span className="text-xs text-samurai-steel animate-pulse">Loading older messages...</span>
          </div>
        )}
        {!hasMoreMessages && messages.length > 0 && (
          <div className="text-center py-2">
            <span className="text-xs text-samurai-steel">Beginning of conversation</span>
          </div>
        )}
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
            {messages.map((msg, index) => {
              const displayName = (msg as any).user?.display_name || 'Unknown'
              const decryptedContent = userId ? decryptMessageContent(msg, userId) : msg.content
              const isAuthor = msg.user_id === userId
              const isEditing = editingMessageId === msg.id
              const canDelete = isAuthor || (isAdminOrMod && isPublicWorkspace)

              // Date separator
              const msgDate = new Date(msg.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              const prevDate = index > 0 ? new Date(messages[index - 1].created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null
              const showDateSeparator = index === 0 || msgDate !== prevDate
              
              const avatarUrl = (msg as any).user?.avatar_url
              const avatarColor = (msg as any).user?.avatar_color || '#E63946'

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
                  {displayName[0].toUpperCase()}
                </div>
              )

              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-samurai-grey-dark" />
                      <span className="text-xs text-samurai-steel font-medium px-2">{msgDate}</span>
                      <div className="flex-1 h-px bg-samurai-grey-dark" />
                    </div>
                  )}
                <div className={`flex gap-3 group hover:bg-samurai-black-light px-2 sm:px-4 py-2 -mx-2 sm:-mx-4 rounded-lg transition-colors ${!isAuthor ? 'flex-row-reverse' : ''}`}>
                  <div className="relative flex-shrink-0">
                    <button onClick={() => setProfileUserId(msg.user_id)} className="cursor-pointer">
                      {avatar}
                    </button>
                    {profileUserId === msg.user_id && msg.user_id && (
                      <UserProfilePopup
                        userId={msg.user_id}
                        onClose={() => setProfileUserId(null)}
                        align={!isAuthor ? 'right' : 'left'}
                        onStartDM={(uid) => {
                          // Navigate to DM with this user
                          window.dispatchEvent(new CustomEvent('wspr:navigate', { detail: { channel: `dm-${uid}` } }))
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-baseline gap-2 mb-1 ${!isAuthor ? 'flex-row-reverse justify-start' : ''}`}>
                      <span className="font-semibold text-white truncate">{displayName}</span>
                      <span className="text-xs text-samurai-steel flex-shrink-0 cursor-default" title={formatFullTimestamp(msg.created_at)}>{formatTime(msg.created_at)}</span>
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
                      <div className="space-y-2">
                        {/* Quoted parent message */}
                        {msg.thread_id && (() => {
                          const parentMsg = messages.find(m => m.id === msg.thread_id)
                          if (!parentMsg) return null
                          const parentName = (parentMsg as any).user?.display_name || 'Unknown'
                          const parentContent = userId ? decryptMessageContent(parentMsg, userId) : parentMsg.content
                          return (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-samurai-black/40 border-l-2 border-samurai-steel/30 rounded text-xs">
                              <Reply className="w-3 h-3 text-samurai-steel flex-shrink-0" />
                              <span className="text-samurai-steel font-medium">{parentName}:</span>
                              <span className="text-samurai-steel/70 truncate">{parentContent}</span>
                            </div>
                          )
                        })()}
                        <div className={`flex items-start gap-2 ${!isAuthor ? 'justify-end' : ''}`}>
                          <MessageContent content={decryptedContent} className={`text-samurai-steel-light break-words flex-1 ${!isAuthor ? 'text-right' : ''}`} />
                          {isAuthor && (
                            <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() => setReplyingTo({ id: msg.id, content: decryptedContent, displayName })}
                                className="p-1 hover:bg-samurai-grey-darker rounded"
                                title="Reply"
                              >
                                <Reply className="w-3 h-3 text-samurai-steel hover:text-white" />
                              </button>
                              <button
                                onClick={() => navigator.clipboard.writeText(decryptedContent)}
                                className="p-1 hover:bg-samurai-grey-darker rounded"
                                title="Copy text"
                              >
                                <Copy className="w-3 h-3 text-samurai-steel hover:text-white" />
                              </button>
                              <button
                                onClick={() => startEdit(msg)}
                                className="p-1 hover:bg-samurai-grey-darker rounded"
                                title="Edit message"
                              >
                                <Edit2 className="w-3 h-3 text-samurai-steel hover:text-white" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(msg.id)}
                                className="p-1 hover:bg-samurai-grey-darker rounded"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3 text-samurai-steel hover:text-samurai-red" />
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Attachments */}
                        {messageAttachments.get(msg.id) && messageAttachments.get(msg.id)!.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {messageAttachments.get(msg.id)!.map(attachment => (
                              <AttachmentCard
                                key={attachment.id}
                                attachment={attachment}
                                onDownload={downloadAttachment}
                                onDelete={(id) => handleDeleteAttachment(id, msg.id)}
                                canDelete={isAuthor}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!isAuthor && (
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 self-center">
                      <button
                        onClick={() => setReplyingTo({ id: msg.id, content: decryptedContent, displayName })}
                        className="p-1 hover:bg-samurai-grey-darker rounded"
                        title="Reply"
                      >
                        <Reply className="w-3 h-3 text-samurai-steel hover:text-white" />
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(decryptedContent)}
                        className="p-1 hover:bg-samurai-grey-darker rounded"
                        title="Copy text"
                      >
                        <Copy className="w-3 h-3 text-samurai-steel hover:text-white" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteConfirmId(msg.id)}
                          className="p-1 hover:bg-samurai-grey-darker rounded"
                          title="Delete message (Admin/Mod)"
                        >
                          <Trash2 className="w-3 h-3 text-samurai-steel hover:text-samurai-red" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className={`flex ${!isAuthor ? 'justify-end pr-1 sm:pr-3' : 'justify-start pl-1 sm:pl-3'} px-2 sm:px-4 -mx-2 sm:-mx-4 -mt-1`}>
                  <ReactionBar
                    messageId={msg.id}
                    userId={userId || ''}
                    reactions={messageReactions.get(msg.id) || []}
                    isAuthor={isAuthor}
                    onReactionChange={async () => {
                      const reactions = await getMessageReactions(msg.id)
                      setMessageReactions(prev => new Map(prev).set(msg.id, reactions))
                    }}
                  />
                </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to Bottom */}
      {showScrollBottom && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute -top-12 right-6 p-2 bg-samurai-red hover:bg-samurai-red-dark rounded-full shadow-lg transition-all z-10"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 sm:px-6 py-1">
          <span className="text-xs text-samurai-steel italic">
            {Array.from(typingUsers.values()).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing
            <span className="animate-pulse">...</span>
          </span>
        </div>
      )}

      {/* Message Input */}
      <div className="p-3 sm:p-4 border-t border-samurai-grey-dark">
        <div className="glass-card rounded-xl p-2 sm:p-3">
          {/* Reply Preview */}
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-samurai-black/50 border-l-2 border-samurai-red rounded">
              <Reply className="w-3 h-3 text-samurai-red flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-samurai-red font-medium">{replyingTo.displayName}</span>
                <p className="text-xs text-samurai-steel truncate">{replyingTo.content}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-samurai-steel hover:text-white flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
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
              className="p-1.5 sm:p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors"
              disabled={!channelId}
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-samurai-steel hover:text-white transition-colors" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => { setMessage(e.target.value); if (e.target.value.trim()) handleTyping() }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${channelName ? '#' + channelName : ''}`}
              disabled={!channelId}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-samurai-steel text-sm sm:text-base px-2 disabled:opacity-50"
            />
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors"
              >
                <Smile className="w-5 h-5 text-samurai-steel hover:text-white transition-colors" />
              </button>
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={(emoji) => setMessage(prev => prev + emoji)}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
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

      </div>{/* end messages column */}

      {/* Member List Panel */}
      <ChannelMemberList
        channelId={channelId}
        isOpen={showMemberList}
        onClose={() => setShowMemberList(false)}
        onMemberClick={(uid) => setProfileUserId(uid)}
      />
      </div>{/* end content row */}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onAttachFile={handleAttachFile}
        userId={userId || ''}
        channelFolderId={channelFolderId}
      />
    </div>
  )
}
