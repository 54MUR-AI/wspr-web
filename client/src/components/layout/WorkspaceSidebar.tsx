import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { WsprWorkspace } from '../../lib/supabase'
import CreateWorkspaceModal from '../workspaces/CreateWorkspaceModal'
import { deleteWorkspace } from '../../services/workspace.service'

interface WorkspaceSidebarProps {
  selectedWorkspace: string
  onWorkspaceChange: (workspace: string) => void
  workspaces: WsprWorkspace[]
  userId: string
  onWorkspacesUpdate: () => void
}

export default function WorkspaceSidebar({ selectedWorkspace, onWorkspaceChange, workspaces, userId, onWorkspacesUpdate }: WorkspaceSidebarProps) {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [deletingWorkspace, setDeletingWorkspace] = useState<string | null>(null)
  
  const getWorkspaceInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Delete "${workspaceName}" workspace? All channels, messages, and files will be permanently deleted.`)) {
      return
    }

    setDeletingWorkspace(workspaceId)
    const success = await deleteWorkspace(workspaceId, userId)
    
    if (success) {
      onWorkspacesUpdate()
      if (selectedWorkspace === workspaceId) {
        onWorkspaceChange('')
      }
    } else {
      alert('Failed to delete workspace')
    }
    
    setDeletingWorkspace(null)
  }

  return (
    <div className="w-20 bg-samurai-black-light border-r border-samurai-grey-dark flex flex-col items-center py-4 gap-3">
      {/* Workspaces */}
      {workspaces.map((workspace) => (
        <div key={workspace.id} className="relative group">
          <button
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
          <button
            onClick={(e) => handleDeleteWorkspace(workspace.id, workspace.name, e)}
            className="absolute -top-1 -right-1 w-5 h-5 bg-samurai-black border border-samurai-red rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity z-10"
          >
            <Trash2 className="w-3 h-3 text-samurai-red" />
          </button>
        </div>
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
