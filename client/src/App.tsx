import { useState, useEffect } from 'react'
import WorkspaceSidebar from './components/layout/WorkspaceSidebar'
import ChannelList from './components/layout/ChannelList'
import MessageThread from './components/layout/MessageThread'
import { authManager } from './utils/auth'
import './index.css'

function App() {
  const [selectedChannel, setSelectedChannel] = useState<string>('general')
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('ronin-media')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const user = authManager.getUser()
    if (user) {
      setIsAuthenticated(true)
      setUserEmail(user.email)
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

  return (
    <div className="flex h-screen bg-samurai-black text-white overflow-hidden">
      {/* Left Sidebar - Workspace Switcher */}
      <WorkspaceSidebar 
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
      />

      {/* Middle Sidebar - Channels/DMs */}
      <ChannelList 
        selectedChannel={selectedChannel}
        onChannelSelect={setSelectedChannel}
        workspaceName={selectedWorkspace}
      />

      {/* Main Content - Messages */}
      <MessageThread 
        channelName={selectedChannel}
        userEmail={userEmail}
      />
    </div>
  )
}

export default App
