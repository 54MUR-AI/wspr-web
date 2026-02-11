import { X } from 'lucide-react'
import { useState } from 'react'
import { createChannel } from '../../services/channel.service'

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  userId: string
  onChannelCreated: () => void
}

export default function CreateChannelModal({ isOpen, onClose, workspaceId, userId, onChannelCreated }: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!channelName.trim()) return

    setIsCreating(true)
    try {
      await createChannel(
        workspaceId,
        userId,
        channelName,
        description || undefined,
        isPrivate
      )

      setChannelName('')
      setDescription('')
      setIsPrivate(false)
      onChannelCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create channel:', error)
      alert('Failed to create channel. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-samurai-black-lighter border border-samurai-grey-dark rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-samurai-grey-dark flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create Channel</h2>
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
              Channel Name
            </label>
            <div className="flex items-center gap-2">
              <span className="text-samurai-steel">#</span>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="channel-name"
                className="flex-1 px-4 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white focus:outline-none focus:border-samurai-red transition-colors"
                autoFocus
              />
            </div>
            <p className="text-xs text-samurai-steel-dark mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-samurai-steel mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              rows={3}
              className="w-full px-4 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white focus:outline-none focus:border-samurai-red transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-samurai-black rounded-lg">
            <input
              type="checkbox"
              id="private-channel"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="private-channel" className="flex-1">
              <p className="text-white font-semibold">Private Channel</p>
              <p className="text-sm text-samurai-steel">Only invited members can see this channel</p>
            </label>
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
            disabled={!channelName.trim() || isCreating}
            className="px-6 py-2 bg-samurai-red hover:bg-samurai-red-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </div>
    </div>
  )
}
