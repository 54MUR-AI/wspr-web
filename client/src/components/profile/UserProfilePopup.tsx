import { useState, useEffect } from 'react'
import { X, MessageSquare, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { isUserOnline } from '../../services/online.service'

interface UserProfilePopupProps {
  userId: string
  onClose: () => void
  onStartDM?: (userId: string) => void
  align?: 'left' | 'right'
}

interface ProfileData {
  id: string
  display_name: string
  avatar_url: string | null
  avatar_color: string | null
  status: string | null
  updated_at: string | null
}

export default function UserProfilePopup({ userId, onClose, onStartDM, align = 'left' }: UserProfilePopupProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('wspr_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(data)
      setIsLoading(false)
    }
    fetchProfile()
  }, [userId])

  const online = isUserOnline(userId)

  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className={`absolute z-50 bg-samurai-grey-dark border border-samurai-grey rounded-xl shadow-2xl p-4 w-64 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-samurai-grey-darker" />
            <div className="h-4 w-24 bg-samurai-grey-darker rounded" />
          </div>
        </div>
      </>
    )
  }

  if (!profile) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className={`absolute z-50 bg-samurai-grey-dark border border-samurai-grey rounded-xl shadow-2xl w-64 overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}>
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-samurai-red to-samurai-red-dark" />

        {/* Avatar */}
        <div className="flex justify-center -mt-10">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-20 h-20 rounded-full object-cover border-4 border-samurai-grey-dark"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-samurai-grey-dark"
                style={{ backgroundColor: profile.avatar_color || '#E63946' }}
              >
                {profile.display_name[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-samurai-grey-dark ${online ? 'bg-green-500' : 'bg-gray-500'}`} />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 text-center">
          <h3 className="text-lg font-bold text-white">{profile.display_name}</h3>
          <span className={`text-xs ${online ? 'text-green-500' : 'text-samurai-steel'}`}>
            {online ? 'Online' : 'Offline'}
          </span>

          {/* Actions */}
          {onStartDM && (
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={() => { onStartDM(userId); onClose() }}
                className="flex items-center gap-1.5 px-4 py-2 bg-samurai-red hover:bg-samurai-red-dark text-white text-sm font-medium rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
