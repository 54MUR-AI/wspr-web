import { Hash, Users, Lock, Plus, ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'

interface ChannelListProps {
  selectedChannel: string
  onChannelSelect: (channel: string) => void
  workspaceName: string
}

export default function ChannelList({ selectedChannel, onChannelSelect, workspaceName }: ChannelListProps) {
  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const [dmsExpanded, setDmsExpanded] = useState(true)

  const channels = [
    { id: 'general', name: 'general', isPrivate: false },
    { id: 'random', name: 'random', isPrivate: false },
    { id: 'dev-team', name: 'dev-team', isPrivate: true },
  ]

  const directMessages = [
    { id: 'dm-alice', name: 'Alice', online: true },
    { id: 'dm-bob', name: 'Bob', online: false },
    { id: 'dm-charlie', name: 'Charlie', online: true },
  ]

  return (
    <div className="w-64 bg-samurai-black-lighter border-r border-samurai-grey-dark flex flex-col">
      {/* Workspace Header */}
      <div className="p-4 border-b border-samurai-grey-dark">
        <h2 className="text-xl font-bold neon-text mb-2">
          {workspaceName === 'ronin-media' ? 'RONIN MEDIA' : 'Personal'}
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
            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {channelsExpanded && (
            <div className="mt-1 space-y-0.5">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect(channel.id)}
                  className={`w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
                    selectedChannel === channel.id
                      ? 'bg-samurai-red text-white font-semibold'
                      : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
                  }`}
                >
                  {channel.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                  <span>{channel.name}</span>
                </button>
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
            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {dmsExpanded && (
            <div className="mt-1 space-y-0.5">
              {directMessages.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => onChannelSelect(dm.id)}
                  className={`w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
                    selectedChannel === dm.id
                      ? 'bg-samurai-red text-white font-semibold'
                      : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <Users className="w-4 h-4" />
                    {dm.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-samurai-black-lighter" />
                    )}
                  </div>
                  <span>{dm.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
