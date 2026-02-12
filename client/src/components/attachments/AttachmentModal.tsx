import { X, Upload, FolderOpen } from 'lucide-react'
import { useState } from 'react'

interface AttachmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAttachFile: (file: { ldgr_file_id: string; filename: string; file_size: number; mime_type: string }) => void
  userId: string
  channelFolderId?: string | null
}

export default function AttachmentModal({ isOpen, onClose, onAttachFile, userId, channelFolderId }: AttachmentModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleBrowseLDGR = () => {
    setIsLoading(true)
    // Request LDGR file browser from RMG
    window.parent.postMessage({
      type: 'WSPR_BROWSE_LDGR',
      userId: userId,
      channelFolderId: channelFolderId
    }, '*')

    // Listen for file selection
    const handleSelection = (event: MessageEvent) => {
      if (event.data.type === 'LDGR_FILE_SELECTED') {
        onAttachFile({
          ldgr_file_id: event.data.fileId,
          filename: event.data.filename,
          file_size: event.data.fileSize,
          mime_type: event.data.mimeType
        })
        setIsLoading(false)
        onClose()
        window.removeEventListener('message', handleSelection)
      } else if (event.data.type === 'LDGR_BROWSE_CANCELLED') {
        setIsLoading(false)
        window.removeEventListener('message', handleSelection)
      }
    }

    window.addEventListener('message', handleSelection)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-samurai-grey-dark">
          <h2 className="text-xl font-bold text-white">Attach File</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-samurai-grey-darker rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-samurai-steel" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-samurai-steel" />
            <p className="text-white mb-2">Share a file from your LDGR</p>
            <p className="text-sm text-samurai-steel mb-6">
              Select an existing file to share in this channel
            </p>
            <button
              onClick={handleBrowseLDGR}
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Opening LDGR...' : 'Browse LDGR Files'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
