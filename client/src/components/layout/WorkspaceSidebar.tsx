import { Settings, Plus } from 'lucide-react'
import { useState } from 'react'
import { WsprWorkspace } from '../../lib/supabase'
import SettingsModal from '../settings/SettingsModal'

interface WorkspaceSidebarProps {
  selectedWorkspace: string
  onWorkspaceChange: (workspace: string) => void
  workspaces: WsprWorkspace[]
  userId: string
  userEmail?: string
}

export default function WorkspaceSidebar({ selectedWorkspace, onWorkspaceChange, workspaces, userId, userEmail }: WorkspaceSidebarProps) {
  const [showSettings, setShowSettings] = useState(false)
  
  const getWorkspaceInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="w-20 bg-samurai-black-light border-r border-samurai-grey-dark flex flex-col items-center py-4 gap-3">
      {/* Workspaces */}
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          onClick={() => onWorkspaceChange(workspace.id)}
          title={workspace.name}
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            selectedWorkspace === workspace.id
              ? 'bg-samurai-red text-white shadow-lg shadow-samurai-red/50 animate-glow-pulse'
              : 'bg-samurai-grey-darker text-samurai-steel hover:bg-samurai-grey-dark hover:text-white'
          }`}
        >
          {getWorkspaceInitials(workspace.name)}
        </button>
      ))}

      {/* Add Workspace */}
      <button className="w-12 h-12 rounded-xl bg-samurai-grey-darker text-samurai-steel hover:bg-samurai-red hover:text-white transition-all duration-300 flex items-center justify-center group">
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <button 
        onClick={() => setShowSettings(true)}
        className="w-12 h-12 rounded-xl bg-samurai-red text-white hover:bg-samurai-red-dark shadow-lg shadow-samurai-red/50 transition-all duration-300 flex items-center justify-center group animate-glow-pulse"
        title="Settings"
      >
        <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userEmail={userEmail}
        userId={userId}
      />
    </div>
  )
}
