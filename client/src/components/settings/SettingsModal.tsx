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
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-samurai-red text-white'
                  : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'notifications'
                  ? 'bg-samurai-red text-white'
                  : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'privacy'
                  ? 'bg-samurai-red text-white'
                  : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span>Privacy & Security</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'appearance'
                  ? 'bg-samurai-red text-white'
                  : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
              }`}
            >
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'data'
                  ? 'bg-samurai-red text-white'
                  : 'text-samurai-steel hover:bg-samurai-grey-darker hover:text-white'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Data & Storage</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Profile Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-samurai-steel mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={userEmail || ''}
                        disabled
                        className="w-full px-4 py-2 bg-samurai-grey-darker border border-samurai-grey-dark rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-samurai-steel mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter display name"
                        className="w-full px-4 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white focus:outline-none focus:border-samurai-red transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-samurai-steel mb-2">
                        Status
                      </label>
                      <select className="w-full px-4 py-2 bg-samurai-black border border-samurai-grey-dark rounded-lg text-white focus:outline-none focus:border-samurai-red transition-colors">
                        <option value="online">Online</option>
                        <option value="away">Away</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
                      <div>
                        <p className="text-white font-semibold">Desktop Notifications</p>
                        <p className="text-sm text-samurai-steel">Receive notifications on your desktop</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
                      <div>
                        <p className="text-white font-semibold">Sound Alerts</p>
                        <p className="text-sm text-samurai-steel">Play sound for new messages</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
                      <div>
                        <p className="text-white font-semibold">Message Previews</p>
                        <p className="text-sm text-samurai-steel">Show message content in notifications</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Privacy & Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
                      <div>
                        <p className="text-white font-semibold">End-to-End Encryption</p>
                        <p className="text-sm text-samurai-steel">All messages are encrypted</p>
                      </div>
                      <div className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-semibold">
                        Enabled
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
                      <div>
                        <p className="text-white font-semibold">Read Receipts</p>
                        <p className="text-sm text-samurai-steel">Let others know when you've read their messages</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-samurai-black rounded-lg">
                      <div>
                        <p className="text-white font-semibold">Online Status</p>
                        <p className="text-sm text-samurai-steel">Show when you're online</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Appearance</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-samurai-steel mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-samurai-black border-2 border-samurai-red rounded-lg cursor-pointer">
                          <div className="w-full h-20 bg-gradient-to-br from-samurai-black to-samurai-grey-darker rounded mb-2"></div>
                          <p className="text-white font-semibold">Samurai Dark</p>
                          <p className="text-xs text-samurai-steel">Current theme</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Data & Storage</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-samurai-black rounded-lg">
                      <p className="text-white font-semibold mb-2">Storage Usage</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-samurai-grey-darker rounded-full overflow-hidden">
                          <div className="h-full w-1/4 bg-samurai-red"></div>
                        </div>
                        <span className="text-sm text-samurai-steel">25%</span>
                      </div>
                      <p className="text-sm text-samurai-steel mt-2">2.5 GB of 10 GB used</p>
                    </div>
                    <button className="w-full px-4 py-3 bg-samurai-grey-darker hover:bg-samurai-grey-dark text-white rounded-lg transition-colors">
                      Clear Cache
                    </button>
                    <button className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      Delete All Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-samurai-grey-dark flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-samurai-grey-darker hover:bg-samurai-grey-dark text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button className="px-6 py-2 bg-samurai-red hover:bg-samurai-red-dark text-white rounded-lg transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
