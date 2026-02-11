import { useState, useEffect } from 'react'
import WorkspaceSidebar from './components/layout/WorkspaceSidebar'
import ChannelList from './components/layout/ChannelList'
import MessageThread from './components/layout/MessageThread'
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
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeUser = async () => {
      const user = authManager.getUser()
      if (user) {
        setIsAuthenticated(true)
        setUserEmail(user.email)
        setUserId(user.userId)
        
        // Check if we have a Supabase session, if not try to get one from RMG
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // Listen for auth token from RMG parent window
          window.addEventListener('message', async (event) => {
            if (event.data.type === 'RMG_AUTH_TOKEN' && event.data.authToken) {
              try {
                const authData = JSON.parse(event.data.authToken)
                if (authData.access_token) {
                  await supabase.auth.setSession({
                    access_token: authData.access_token,
                    refresh_token: authData.refresh_token
                  })
                }
              } catch (e) {
                console.error('Failed to set Supabase session:', e)
              }
            }
          })
          
          // Request auth token from parent
          window.parent.postMessage({ type: 'WSPR_REQUEST_AUTH' }, '*')
        }
        
        // Get or create default WSPR workspace
        const defaultWorkspace = await getOrCreateDefaultWorkspace(user.userId)
        if (defaultWorkspace) {
          setSelectedWorkspace(defaultWorkspace)
          
          // Get or create default channels
          const channels = await getOrCreateDefaultChannels(defaultWorkspace.id, user.userId)
          if (channels.length > 0) {
            setSelectedChannel(channels[0].id)
          }
        }
        
        // Load all user workspaces
        const userWorkspaces = await getUserWorkspaces(user.userId)
        setWorkspaces(userWorkspaces)
        
        // Connect to Socket.IO
        socketService.connect(user.userId, user.email)
        setIsConnected(true)
        
        setIsInitializing(false)
      }
    }

    initializeUser()
    
    return () => {
      const user = authManager.getUser()
      if (user) {
        // Set status to offline on unmount
        updateStatus(user.userId, 'offline')
        socketService.disconnect()
      }
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
        />
      </div>

      {/* Middle Sidebar - Channels/DMs - Hidden on mobile, shown on tablet+ */}
      <div className="hidden sm:block">
        <ChannelList 
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
          workspaceId={selectedWorkspace?.id || ''}
          userId={userId}
        />
      </div>

      {/* Main Content - Messages - Full width on mobile */}
      <MessageThread 
        channelId={selectedChannel}
        userEmail={userEmail}
        userId={userId}
        isConnected={isConnected}
      />
    </div>
  )
}

export default App
