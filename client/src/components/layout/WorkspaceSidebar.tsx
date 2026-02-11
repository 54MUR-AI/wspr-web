import { Plus } from 'lucide-react'
import { useState } from 'react'
import { WsprWorkspace } from '../../lib/supabase'
import CreateWorkspaceModal from '../workspaces/CreateWorkspaceModal'

interface WorkspaceSidebarProps {
  selectedWorkspace: string
  onWorkspaceChange: (workspace: string) => void
  workspaces: WsprWorkspace[]
  userId: string
  onWorkspacesUpdate: () => void
}

export default function WorkspaceSidebar({ selectedWorkspace, onWorkspaceChange, workspaces, userId, onWorkspacesUpdate }: WorkspaceSidebarProps) {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  
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
      <button 
        onClick={() => setShowCreateWorkspace(true)}
        className="w-12 h-12 rounded-xl bg-samurai-grey-darker text-samurai-steel hover:bg-samurai-red hover:text-white transition-all duration-300 flex items-center justify-center group"
        title="Create Workspace"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal 
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        userId={userId}
        onWorkspaceCreated={onWorkspacesUpdate}
      />
    </div>
  )
}
