import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import WorkspaceSidebar from './components/layout/WorkspaceSidebar'
import ChannelList from './components/layout/ChannelList'
import MessageThread from './components/layout/MessageThread'
import DMThread from './components/layout/DMThread'
import SettingsModal from './components/settings/SettingsModal'
import { authManager } from './utils/auth'
import { socketService } from './services/socket'
import { getOrCreateDefaultWorkspace, getUserWorkspaces } from './services/workspace.service'
import { joinPresence, leavePresence } from './services/online.service'
import { startNotifications } from './services/notification.service'
import { getOrCreateDefaultChannels } from './services/channel.service'
import { supabase, WsprWorkspace } from './lib/supabase'
import './index.css'

// WSPR v2.0 - Samurai Redesign
function App() {
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [selectedWorkspace, setSelectedWorkspace] = useState<WsprWorkspace | null>(null)
  const [workspaces, setWorkspaces] = useState<WsprWorkspace[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => {
    console.log('WSPR: Setting up message listener')
    
    // Listen for messages from RMG parent window
    const handleMessage = async (event: MessageEvent) => {
      console.log('WSPR: Message received from origin:', event.origin, 'data:', event.data)
      
      // Accept messages from RMG domains
      const allowedOrigins = ['https://roninmediagroup.com', 'https://roninmedia.studio', 'http://localhost:5173', 'http://localhost:3000']
      if (!allowedOrigins.includes(event.origin)) {
        console.log('WSPR: Message rejected - origin not allowed:', event.origin)
        return
      }

      console.log('WSPR: Message accepted, type:', event.data.type)

      if (event.data.type === 'RMG_TOGGLE_SETTINGS') {
        console.log('WSPR: Toggling settings modal')
        setShowSettings(prev => !prev)
      } else if (event.data.type === 'RMG_AUTH_TOKEN' && event.data.authToken) {
        try {
          const authData = JSON.parse(event.data.authToken)
          if (authData.access_token) {
            // Clear any existing cached session first
            await supabase.auth.signOut()
            
            // Then set the new session from RMG
            await supabase.auth.setSession({
              access_token: authData.access_token,
              refresh_token: authData.refresh_token
            })
            console.log('Supabase session set, reinitializing...')
            // Reinitialize now that we have auth
            initializeUser()
          }
        } catch (e) {
          console.error('Failed to set Supabase session:', e)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    const initializeUser = async () => {
      const user = authManager.getUser()
      if (user) {
        setIsAuthenticated(true)
        setUserEmail(user.email)
        setUsername(user.username)
        
        // Check if we have a Supabase session, if not try to get one from RMG
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // Request auth token from parent and wait for it
          window.parent.postMessage({ type: 'WSPR_REQUEST_AUTH' }, '*')
          console.log('Waiting for Supabase auth session...')
          setIsInitializing(false)
          return
        }

        console.log('Supabase session authenticated:', session.user.id)

        // Use the authenticated session user ID for all database operations
        const authenticatedUserId = session.user.id
        setUserId(authenticatedUserId)

        // Fetch current display name from RMG auth.users table (source of truth)
        // This ensures we always get the latest display name, not stale JWT metadata
        let displayName = 'Unknown'
        try {
          const { data: authUser, error: authError } = await supabase
            .rpc('get_user_display_names', { user_ids: [authenticatedUserId] })
          
          if (authError) {
            console.warn('⚠️ Could not fetch display name from auth.users, falling back to metadata:', authError)
            displayName = session.user.user_metadata?.display_name || user.username || user.email?.split('@')[0] || 'Unknown'
          } else if (authUser && authUser.length > 0) {
            displayName = authUser[0].display_name || user.username || user.email?.split('@')[0] || 'Unknown'
            console.log('✅ Fetched current display name from RMG:', displayName)
          } else {
            console.warn('⚠️ No display name found in auth.users, using fallback')
            displayName = session.user.user_metadata?.display_name || user.username || user.email?.split('@')[0] || 'Unknown'
          }
        } catch (e) {
          console.error('❌ Error fetching display name:', e)
          displayName = session.user.user_metadata?.display_name || user.username || user.email?.split('@')[0] || 'Unknown'
        }
        
        console.log('🔍 WSPR Profile Sync Debug:', {
          sessionUserId: session.user.id,
          fetchedDisplayName: displayName,
          fallbackMetadata: session.user.user_metadata?.display_name,
          urlUsername: user.username,
          emailPrefix: user.email?.split('@')[0]
        })

        // Sync RMG user data to wspr_profiles (for contacts to work)
        try {
          const { data: upsertData, error: upsertError } = await supabase
            .from('wspr_profiles')
            .upsert({
              id: authenticatedUserId,
              display_name: displayName,
              avatar_url: session.user.user_metadata?.avatar_url || null,
              avatar_color: session.user.user_metadata?.avatar_color || '#E63946',
              status: 'online',
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .select()
          
          if (upsertError) {
            console.error('❌ Profile sync error:', upsertError)
          } else {
            console.log('✅ Profile synced successfully:', upsertData)
          }
        } catch (e) {
          console.error('Failed to sync profile:', e)
        }

        // Join presence channel so other users can see we're online
        joinPresence(authenticatedUserId, displayName)

        // Start browser notifications for new DMs + title badge
        startNotifications(authenticatedUserId)

        // Ensure Drops folder exists in LDGR
        try {
          const { data: dropsFolderId, error: dropsError } = await supabase
            .rpc('ensure_drops_folder', { user_id_param: authenticatedUserId })
          
          if (dropsError) {
            console.warn('⚠️ Could not ensure Drops folder:', dropsError)
          } else {
            console.log('📂 Drops folder:', dropsFolderId)
          }
        } catch (e) {
          console.warn('Drops folder creation skipped:', e)
        }
        
        // Get or create default WSPR workspace
        const defaultWorkspace = await getOrCreateDefaultWorkspace(authenticatedUserId)
        if (defaultWorkspace) {
          setSelectedWorkspace(defaultWorkspace)
          
          // Get or create default channels
          const channels = await getOrCreateDefaultChannels(defaultWorkspace.id, authenticatedUserId)
          if (channels.length > 0) {
            setSelectedChannel(channels[0].id)
          }
        }
        
        // Load all user workspaces
        const userWorkspaces = await getUserWorkspaces(authenticatedUserId)
        setWorkspaces(userWorkspaces)
        
        // Connect to Socket.IO
        socketService.connect(authenticatedUserId, user.email)
        setIsConnected(true)
        
        setIsInitializing(false)
      }
    }

    initializeUser()
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Show auth required screen if not authenticated from RMG
  if (!isAuthenticated) {
    return (
      <div className="bg-samurai-black flex items-center justify-center p-4 py-32">
        <div className="text-center">
          <Lock className="w-16 h-16 text-samurai-red mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2 neon-text">WSPR</h1>
          <p className="text-white/70 mb-6">Please sign in to access WSPR</p>
        </div>
      </div>
    )
  }

  if (isInitializing) {
    return (
      <div className="flex h-screen bg-samurai-black text-white items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-samurai-red border-t-transparent mb-4"></div>
          <p className="text-samurai-steel">Initializing WSPR...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-samurai-black text-white overflow-hidden">
      {/* Left Sidebar - Workspace Switcher - Hidden on mobile */}
      <div className="hidden md:block">
        <WorkspaceSidebar 
          selectedWorkspace={selectedWorkspace?.id || ''}
          onWorkspaceChange={(workspaceId) => {
            const workspace = workspaces.find(w => w.id === workspaceId)
            if (workspace) {
              setSelectedWorkspace(workspace)
              setSelectedChannel('') // Clear channel when switching workspaces
            }
          }}
          workspaces={workspaces}
          userId={userId}
          onWorkspacesUpdate={async () => {
            const userWorkspaces = await getUserWorkspaces(userId)
            setWorkspaces(userWorkspaces)
          }}
        />
      </div>

      {/* Middle Sidebar - Channels/DMs - Hidden on mobile, shown on tablet+ */}
      <div className="hidden sm:block">
        <ChannelList 
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
          workspaceId={selectedWorkspace?.id || ''}
          userId={userId}
          workspaceName={selectedWorkspace?.name}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div className="bg-samurai-black-lighter w-72 h-full shadow-2xl overflow-y-auto">
            <ChannelList
              selectedChannel={selectedChannel}
              onChannelSelect={(ch) => { setSelectedChannel(ch); setShowMobileSidebar(false) }}
              workspaceId={selectedWorkspace?.id || ''}
              userId={userId}
              workspaceName={selectedWorkspace?.name}
            />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
        </div>
      )}

      {/* Main Content - Messages or DMs - Full width on mobile */}
      {selectedChannel.startsWith('dm-') ? (
        <DMThread
          contactId={selectedChannel.replace('dm-', '')}
          userId={userId}
          username={username}
          isConnected={isConnected}
          onMenuToggle={() => setShowMobileSidebar(true)}
        />
      ) : (
        <MessageThread 
          channelId={selectedChannel}
          userId={userId}
          userEmail={userEmail}
          username={username}
          isConnected={isConnected}
          onMenuToggle={() => setShowMobileSidebar(true)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userEmail={userEmail}
      />
    </div>
  )
}

export default App
