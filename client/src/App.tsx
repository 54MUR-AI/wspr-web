import { useState, useEffect } from 'react'
import WorkspaceSidebar from './components/layout/WorkspaceSidebar'
import ChannelList from './components/layout/ChannelList'
import MessageThread from './components/layout/MessageThread'
import { authManager } from './utils/auth'
import { socketService } from './services/socket'
import './index.css'

// WSPR v2.0 - Samurai Redesign
function App() {
  const [selectedChannel, setSelectedChannel] = useState<string>('general')
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('ronin-media')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const user = authManager.getUser()
    if (user) {
      setIsAuthenticated(true)
      setUserEmail(user.email)
      setUserId(user.userId)
      
      // Connect to Socket.IO
      socketService.connect(user.userId, user.email)
      setIsConnected(true)
      
      return () => {
        socketService.disconnect()
      }
    }
  }, [])

  // Show auth required screen if not authenticated from RMG
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen text-white items-center justify-center p-4" style={{ backgroundColor: '#FF1493' }}>
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

  return (
    <div className="flex h-screen bg-samurai-black text-white overflow-hidden">
      {/* Left Sidebar - Workspace Switcher - Hidden on mobile */}
      <div className="hidden md:block">
        <WorkspaceSidebar 
          selectedWorkspace={selectedWorkspace}
          onWorkspaceChange={setSelectedWorkspace}
        />
      </div>

      {/* Middle Sidebar - Channels/DMs - Hidden on mobile, shown on tablet+ */}
      <div className="hidden sm:block">
        <ChannelList 
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
          workspaceName={selectedWorkspace}
        />
      </div>

      {/* Main Content - Messages - Full width on mobile */}
      <MessageThread 
        channelName={selectedChannel}
        userEmail={userEmail}
        userId={userId}
        isConnected={isConnected}
      />
    </div>
  )
}

export default App
