import { X } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export default function SettingsModal({ isOpen, onClose, userEmail }: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-samurai-grey-darker border border-samurai-grey-dark rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-samurai-grey-dark flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-samurai-grey-dark rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-samurai-steel hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-samurai-steel mb-2">
              Email
            </label>
            <input
              type="email"
              value={userEmail || ''}
              disabled
              className="w-full px-4 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white disabled:opacity-50"
            />
            <p className="text-xs text-samurai-steel mt-1">Managed by RMG profile</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
            <div>
              <p className="text-white font-semibold">Desktop Notifications</p>
              <p className="text-sm text-samurai-steel">Receive notifications for new messages</p>
            </div>
            <input type="checkbox" className="w-4 h-4" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
            <div>
              <p className="text-white font-semibold">Sound Alerts</p>
              <p className="text-sm text-samurai-steel">Play sound for new messages</p>
            </div>
            <input type="checkbox" className="w-4 h-4" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
            <div>
              <p className="text-white font-semibold">End-to-End Encryption</p>
              <p className="text-sm text-samurai-steel">All messages are encrypted</p>
            </div>
            <div className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-semibold">
              Enabled
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-samurai-grey-dark flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-samurai-grey-dark hover:bg-samurai-grey text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
