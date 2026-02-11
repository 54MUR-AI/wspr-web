import { X } from 'lucide-react'
import { useState } from 'react'
import { createWorkspace } from '../../services/workspace.service'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onWorkspaceCreated: () => void
}

export default function CreateWorkspaceModal({ isOpen, onClose, userId, onWorkspaceCreated }: CreateWorkspaceModalProps) {
  const [workspaceName, setWorkspaceName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!workspaceName.trim()) return

    setIsCreating(true)
    try {
      const workspace = await createWorkspace(
        userId,
        workspaceName,
        description || undefined,
        false // isPublic
      )

      if (!workspace) {
        throw new Error('Failed to create workspace')
      }

      // LDGR folder creation is already handled in workspace.service.ts
      // No need to send duplicate message here

      setWorkspaceName('')
      setDescription('')
      onWorkspaceCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create workspace:', error)
      alert('Failed to create workspace. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-samurai-black-lighter border border-samurai-grey-dark rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-samurai-grey-dark flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create Workspace</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-samurai-steel hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-samurai-steel mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g., Marketing Team"
              className="w-full px-4 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white focus:outline-none focus:border-samurai-red transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-samurai-steel mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this workspace for?"
              rows={3}
              className="w-full px-4 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white focus:outline-none focus:border-samurai-red transition-colors resize-none"
            />
          </div>

          <div className="p-4 bg-samurai-black rounded-lg border border-samurai-grey-dark">
            <p className="text-sm text-samurai-steel">
              <span className="text-white font-semibold">LDGR Integration:</span> A shared folder will be created in LDGR for this workspace. All members will have access to share files.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-samurai-grey-dark flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-samurai-grey-darker hover:bg-samurai-grey-dark text-white rounded-lg transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!workspaceName.trim() || isCreating}
            className="px-6 py-2 bg-samurai-red hover:bg-samurai-red-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </div>
    </div>
  )
}
