import { Hash, Users, Lock, Plus, ChevronDown, Search, UserPlus, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getWorkspaceChannels, deleteChannel } from '../../services/channel.service'
import { getContacts } from '../../services/contact.service'
import { WsprChannel } from '../../lib/supabase'
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
  const [contacts, setContacts] = useState<any[]>([])
  const [showFindContacts, setShowFindContacts] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [deletingChannel, setDeletingChannel] = useState<string | null>(null)

  useEffect(() => {
    if (workspaceId) {
      loadChannels()
    }
  }, [workspaceId])

  useEffect(() => {
    if (userId) {
      loadContacts()
    }
  }, [userId])

  const loadChannels = async () => {
    const channelData = await getWorkspaceChannels(workspaceId)
    setChannels(channelData)
  }

  const loadContacts = async () => {
    const contactData = await getContacts(userId)
    setContacts(contactData)
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
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-sm text-white placeholder-samurai-steel focus:outline-none focus:border-samurai-red transition-colors"
          />
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
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onChannelSelect(`dm-${contact.contact_id}`)}
                  className={`w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
                    selectedChannel === `dm-${contact.contact_id}`
                      ? 'bg-samurai-red text-white font-semibold'
                      : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <div className="w-6 h-6 bg-samurai-red rounded-full flex items-center justify-center text-xs font-bold">
                      {contact.profile.display_name.charAt(0).toUpperCase()}
                    </div>
                    {contact.profile.status === 'online' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-samurai-black-lighter" />
                    )}
                  </div>
                  <span>{contact.profile.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Find Contacts Modal */}
      <FindContactsModal 
        isOpen={showFindContacts}
        onClose={() => setShowFindContacts(false)}
        currentUserId={userId}
        onContactAdded={loadContacts}
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
