import { useState, useEffect } from 'react'
import { X, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { isUserOnline, subscribeToOnlineUsers } from '../../services/online.service'

interface ChannelMemberListProps {
  channelId: string
  isOpen: boolean
  onClose: () => void
  onMemberClick?: (userId: string) => void
}

interface MemberProfile {
  id: string
  display_name: string
  avatar_url: string | null
  avatar_color: string | null
}

export default function ChannelMemberList({ channelId, isOpen, onClose, onMemberClick }: ChannelMemberListProps) {
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const unsubscribe = subscribeToOnlineUsers(setOnlineUsers)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!channelId || !isOpen) return

    const loadMembers = async () => {
      setIsLoading(true)

      // First try channel_members table (for private channels)
      const { data: channelMembers } = await supabase
        .from('wspr_channel_members')
        .select('user_id')
        .eq('channel_id', channelId)

      let userIds: string[] = []

      if (channelMembers && channelMembers.length > 0) {
        userIds = channelMembers.map(m => m.user_id)
      } else {
        // For public channels, get unique users who have posted messages
        const { data: messageUsers } = await supabase
          .from('wspr_messages')
          .select('user_id')
          .eq('channel_id', channelId)
          .not('user_id', 'is', null)

        if (messageUsers) {
          userIds = [...new Set(messageUsers.map(m => m.user_id).filter(Boolean))]
        }
      }

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('wspr_profiles')
          .select('id, display_name, avatar_url, avatar_color')
          .in('id', userIds)

        setMembers(profiles || [])
      } else {
        setMembers([])
      }

      setIsLoading(false)
    }

    loadMembers()
  }, [channelId, isOpen])

  if (!isOpen) return null

  // Sort: online first, then alphabetical
  const sortedMembers = [...members].sort((a, b) => {
    const aOnline = onlineUsers.has(a.id) ? 0 : 1
    const bOnline = onlineUsers.has(b.id) ? 0 : 1
    if (aOnline !== bOnline) return aOnline - bOnline
    return a.display_name.localeCompare(b.display_name)
  })

  const onlineCount = members.filter(m => onlineUsers.has(m.id)).length

  return (
    <>
    {/* Mobile backdrop */}
    <div className="sm:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} />
    <div className="fixed sm:relative inset-y-0 right-0 z-50 sm:z-auto w-64 sm:w-60 bg-samurai-black-lighter border-l border-samurai-grey-dark flex flex-col h-full shadow-2xl sm:shadow-none">
      {/* Header */}
      <div className="p-4 border-b border-samurai-grey-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-samurai-red" />
          <span className="text-sm font-semibold text-white">Members</span>
          <span className="text-xs text-samurai-steel">({members.length})</span>
        </div>
        <button onClick={onClose} className="text-samurai-steel hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Online count */}
      <div className="px-4 py-2 text-xs text-samurai-steel">
        {onlineCount} online
      </div>

      {/* Member list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-samurai-red border-t-transparent"></div>
          </div>
        ) : sortedMembers.length === 0 ? (
          <p className="p-4 text-xs text-samurai-steel text-center">No members found</p>
        ) : (
          sortedMembers.map(member => {
            const online = onlineUsers.has(member.id)
            return (
              <button
                key={member.id}
                onClick={() => onMemberClick?.(member.id)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-samurai-grey-darker transition-colors"
              >
                <div className="relative flex-shrink-0">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: member.avatar_color || '#E63946' }}
                    >
                      {member.display_name[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-samurai-black-lighter ${online ? 'bg-green-500' : 'bg-gray-500'}`} />
                </div>
                <span className={`text-sm truncate ${online ? 'text-white' : 'text-samurai-steel'}`}>
                  {member.display_name}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
    </>
  )
}
