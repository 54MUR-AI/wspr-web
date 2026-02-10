import { useState } from 'react'
import WorkspaceSidebar from './components/layout/WorkspaceSidebar'
import ChannelList from './components/layout/ChannelList'
import MessageThread from './components/layout/MessageThread'
import './index.css'

function App() {
  const [selectedChannel, setSelectedChannel] = useState<string>('general')
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('ronin-media')

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
      />
    </div>
  )
}

export default App
