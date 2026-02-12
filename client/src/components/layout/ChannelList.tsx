import { Hash, Users, Lock, Plus, ChevronDown, Search, UserPlus, Trash2, X, MessageSquare } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getWorkspaceChannels, deleteChannel } from '../../services/channel.service'
import { getDMConversations } from '../../services/dm.service'
import type { DMConversation } from '../../services/dm.service'
import { WsprChannel, supabase } from '../../lib/supabase'
import { subscribeToOnlineUsers } from '../../services/online.service'
import { searchMessages } from '../../services/search.service'
import type { SearchResult } from '../../services/search.service'
import FindContactsModal from '../contacts/FindContactsModal'
import CreateChannelModal from '../channels/CreateChannelModal'

interface ChannelListProps {
  selectedChannel: string
  onChannelSelect: (channel: string) => void
  workspaceId: string
  userId: string
  workspaceName?: string
}

export default function ChannelList({ selectedChannel, onChannelSelect, workspaceId, userId, workspaceName }: ChannelListProps) {
  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const [dmsExpanded, setDmsExpanded] = useState(true)
  const [channels, setChannels] = useState<WsprChannel[]>([])
  const [dmConversations, setDmConversations] = useState<DMConversation[]>([])
  const [showFindContacts, setShowFindContacts] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [deletingChannel, setDeletingChannel] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!value.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    setIsSearching(true)
    setShowSearchResults(true)
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchMessages(value, userId)
      setSearchResults(results)
      setIsSearching(false)
    }, 300)
  }, [userId])

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'channel' && result.channel_id) {
      onChannelSelect(result.channel_id)
    } else if (result.type === 'dm' && result.contact_id) {
      onChannelSelect(`dm-${result.contact_id}`)
    }
    setSearchQuery('')
    setShowSearchResults(false)
    setSearchResults([])
  }

  // Subscribe to online presence
  useEffect(() => {
    const unsubscribe = subscribeToOnlineUsers(setOnlineUsers)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (workspaceId) {
      loadChannels()
    }
  }, [workspaceId])

  const loadDMConversations = useCallback(async () => {
    const conversations = await getDMConversations(userId)
    setDmConversations(conversations)
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadDMConversations()
    }
  }, [userId, loadDMConversations])

  // Real-time subscription for DM list updates
  useEffect(() => {
    if (!userId) return

    const subscription = supabase
      .channel('dm-list-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wspr_direct_messages',
          filter: `recipient_id=eq.${userId}`
        },
        () => {
          loadDMConversations()
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
        () => {
          loadDMConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userId, loadDMConversations])

  const loadChannels = async () => {
    const channelData = await getWorkspaceChannels(workspaceId)
    setChannels(channelData)
  }

  const handleDeleteChannel = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Delete this channel? All messages and files will be permanently deleted.')) {
      return
    }

    setDeletingChannel(channelId)
    const success = await deleteChannel(channelId, userId)
    
    if (success) {
      loadChannels()
      if (selectedChannel === channelId) {
        onChannelSelect('')
      }
    } else {
      alert('Failed to delete channel')
    }
    
    setDeletingChannel(null)
  }

  return (
    <div className="w-64 bg-samurai-black-lighter border-r border-samurai-grey-dark flex flex-col">
      {/* Workspace Header */}
      <div className="p-4 border-b border-samurai-grey-dark">
        <h2 className="text-xl font-bold text-white mb-2">
          {workspaceName || 'WSPR'}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-samurai-steel" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true) }}
            className="w-full pl-10 pr-8 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-sm text-white placeholder-samurai-steel focus:outline-none focus:border-samurai-red transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setShowSearchResults(false); setSearchResults([]) }}
              className="absolute right-2 top-2 text-samurai-steel hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-samurai-grey-dark border border-samurai-grey rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-sm text-samurai-steel">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-center text-sm text-samurai-steel">No results found</div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left px-3 py-2 hover:bg-samurai-grey-darker transition-colors border-b border-samurai-grey-dark/50 last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {result.type === 'channel' ? (
                        <Hash className="w-3 h-3 text-samurai-steel flex-shrink-0" />
                      ) : (
                        <MessageSquare className="w-3 h-3 text-samurai-steel flex-shrink-0" />
                      )}
                      <span className="text-xs text-samurai-red font-medium truncate">
                        {result.type === 'channel' ? `#${result.channel_name}` : result.contact_display_name}
                      </span>
                      <span className="text-xs text-samurai-steel ml-auto flex-shrink-0">
                        {new Date(result.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-samurai-steel-light truncate">
                      {result.type === 'channel' && result.user_display_name && (
                        <span className="text-white font-medium">{result.user_display_name}: </span>
                      )}
                      {result.content}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Channels Section */}
        <div className="p-2">
          <button
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className="w-full flex items-center justify-between px-2 py-1 text-samurai-steel hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2">
              <ChevronDown className={`w-4 h-4 transition-transform ${channelsExpanded ? '' : '-rotate-90'}`} />
              <span className="text-sm font-semibold">Channels</span>
            </div>
            <Plus 
              className="w-4 h-4 text-samurai-red hover:text-samurai-red-dark transition-colors cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation()
                setShowCreateChannel(true)
              }}
            />
          </button>

          {channelsExpanded && (
            <div className="mt-1 space-y-0.5">
              {channels.map((channel) => (
                <div key={channel.id} className="group relative">
                  <button
                    onClick={() => onChannelSelect(channel.id)}
                    className={`w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
                      selectedChannel === channel.id
                        ? 'bg-samurai-red text-white font-semibold'
                        : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
                    }`}
                  >
                    {channel.is_private ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                    <span className="flex-1 text-left">{channel.name}</span>
                    <Trash2 
                      className="w-3.5 h-3.5 opacity-40 hover:opacity-100 text-samurai-steel hover:text-samurai-red transition-all cursor-pointer flex-shrink-0"
                      onClick={(e) => handleDeleteChannel(channel.id, e)}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div className="p-2">
          <button
            onClick={() => setDmsExpanded(!dmsExpanded)}
            className="w-full flex items-center justify-between px-2 py-1 text-samurai-steel hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2">
              <ChevronDown className={`w-4 h-4 transition-transform ${dmsExpanded ? '' : '-rotate-90'}`} />
              <span className="text-sm font-semibold">Direct Messages</span>
            </div>
            <UserPlus 
              className="w-4 h-4 text-samurai-red hover:text-samurai-red-dark transition-colors cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation()
                setShowFindContacts(true)
              }}
            />
          </button>

          {dmsExpanded && (
            <div className="mt-1 space-y-0.5">
              {dmConversations.map((conversation) => (
                <button
                  key={conversation.contact_id}
                  onClick={() => onChannelSelect(`dm-${conversation.contact_id}`)}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedChannel === `dm-${conversation.contact_id}`
                      ? 'bg-samurai-red text-white'
                      : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {conversation.contact_avatar_url ? (
                      <img
                        src={conversation.contact_avatar_url}
                        alt={conversation.contact_display_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: conversation.contact_avatar_color || '#E63946' }}
                      >
                        {conversation.contact_display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-samurai-black-lighter ${onlineUsers.has(conversation.contact_id) ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className={`truncate ${selectedChannel === `dm-${conversation.contact_id}` ? 'font-semibold' : ''}`}>
                        {conversation.contact_display_name}
                      </span>
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-samurai-red text-white text-xs rounded-full font-bold flex-shrink-0">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-xs truncate opacity-70 mt-0.5">
                        {conversation.last_message_sender_name ? `${conversation.last_message_sender_name}: ` : ''}{conversation.last_message}
                      </p>
                    )}
                  </div>
                </button>
              ))}
              {dmConversations.length === 0 && (
                <p className="px-4 py-2 text-xs text-samurai-steel text-center">
                  No conversations yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Find Contacts Modal */}
      <FindContactsModal 
        isOpen={showFindContacts}
        onClose={() => {
          setShowFindContacts(false)
          loadDMConversations()
        }}
        currentUserId={userId}
        onStartDM={(contactId) => {
          onChannelSelect(`dm-${contactId}`)
          setShowFindContacts(false)
          loadDMConversations()
        }}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal 
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        workspaceId={workspaceId}
        userId={userId}
        onChannelCreated={loadChannels}
      />
    </div>
  )
}
