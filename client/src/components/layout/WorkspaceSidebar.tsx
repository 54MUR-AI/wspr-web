import { Settings, Plus } from 'lucide-react'

interface WorkspaceSidebarProps {
  selectedWorkspace: string
  onWorkspaceChange: (workspace: string) => void
}

export default function WorkspaceSidebar({ selectedWorkspace, onWorkspaceChange }: WorkspaceSidebarProps) {
  const workspaces = [
    { id: 'ronin-media', name: 'RM', color: 'samurai-red' },
    { id: 'personal', name: 'P', color: 'samurai-steel' },
  ]

  return (
    <div className="w-20 bg-samurai-black-light border-r border-samurai-grey-dark flex flex-col items-center py-4 gap-3">
      {/* Workspaces */}
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          onClick={() => onWorkspaceChange(workspace.id)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
            selectedWorkspace === workspace.id
              ? 'bg-samurai-red text-white shadow-lg shadow-samurai-red/50 animate-glow-pulse'
              : 'bg-samurai-grey-darker text-samurai-steel hover:bg-samurai-grey-dark hover:text-white'
          }`}
        >
          {workspace.name}
        </button>
      ))}

      {/* Add Workspace */}
      <button className="w-12 h-12 rounded-xl bg-samurai-grey-darker text-samurai-steel hover:bg-samurai-red hover:text-white transition-all duration-300 flex items-center justify-center group">
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <button className="w-12 h-12 rounded-xl bg-samurai-grey-darker text-samurai-steel hover:bg-samurai-red hover:text-white transition-all duration-300 flex items-center justify-center group">
        <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  )
}
