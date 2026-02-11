import { useState, useEffect } from 'react'
import WorkspaceSidebar from './components/layout/WorkspaceSidebar'
import ChannelList from './components/layout/ChannelList'
import MessageThread from './components/layout/MessageThread'
import SettingsModal from './components/settings/SettingsModal'
import { authManager } from './utils/auth'
import { socketService } from './services/socket'
import { getOrCreateDefaultWorkspace, getUserWorkspaces } from './services/workspace.service'
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
        setUserId(user.userId)
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

        // Get display name from RMG auth metadata (source of truth)
        const displayName = session.user.user_metadata?.display_name || user.username || user.email?.split('@')[0] || 'Unknown'

        // Sync RMG user data to wspr_profiles (for contacts to work)
        try {
          await supabase
            .from('wspr_profiles')
            .upsert({
              id: authenticatedUserId,
              display_name: displayName,
              email: user.email,
              status: 'online',
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
          console.log('Profile synced successfully with display name:', displayName)
        } catch (e) {
          console.error('Failed to sync profile:', e)
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
      <div className="flex h-screen bg-samurai-black text-white items-center justify-center p-4">
        <div className="glass-card p-12 rounded-xl max-w-md text-center">
          <div className="w-20 h-20 bg-samurai-red rounded-full mx-auto mb-6 flex items-center justify-center animate-glow-pulse">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-4xl font-bold neon-text mb-4">WSPR</h1>
          <p className="text-xl text-samurai-steel mb-6">Web Secure P2P Relay</p>
          <p className="text-samurai-steel-light mb-8">
            This application must be accessed through the RMG portal.
          </p>
          <a
            href="https://roninmediagroup.com/#/wspr"
            className="btn-primary inline-block"
          >
            Go to RMG Portal
          </a>
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
            if (workspace) setSelectedWorkspace(workspace)
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

      {/* Main Content - Messages - Full width on mobile */}
      <MessageThread 
        channelId={selectedChannel}
        userId={userId}
        userEmail={userEmail}
        username={username}
        isConnected={isConnected}
      />

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
