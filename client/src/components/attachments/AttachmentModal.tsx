import { X, Upload, FolderOpen } from 'lucide-react'
import { useState } from 'react'

interface AttachmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAttachFile: (file: { ldgr_file_id: string; filename: string; file_size: number; mime_type: string }) => void
  userId: string
}

export default function AttachmentModal({ isOpen, onClose, onAttachFile, userId }: AttachmentModalProps) {
  const [activeTab, setActiveTab] = useState<'ldgr' | 'upload'>('ldgr')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  if (!isOpen) return null

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    
    // Send file to RMG for LDGR upload
    window.parent.postMessage({
      type: 'WSPR_UPLOAD_FILE',
      file: {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      },
      userId: userId
    }, '*')

    // Listen for response
    const handleResponse = (event: MessageEvent) => {
      if (event.data.type === 'LDGR_FILE_UPLOADED') {
        onAttachFile({
          ldgr_file_id: event.data.fileId,
          filename: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type
        })
        setIsUploading(false)
        setSelectedFile(null)
        onClose()
        window.removeEventListener('message', handleResponse)
      } else if (event.data.type === 'LDGR_FILE_UPLOAD_ERROR') {
        alert('Failed to upload file: ' + event.data.error)
        setIsUploading(false)
        window.removeEventListener('message', handleResponse)
      }
    }

    window.addEventListener('message', handleResponse)
  }

  const handleBrowseLDGR = () => {
    // Request LDGR file browser from RMG
    window.parent.postMessage({
      type: 'WSPR_BROWSE_LDGR',
      userId: userId
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
        onClose()
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

        {/* Tabs */}
        <div className="flex border-b border-samurai-grey-dark">
          <button
            onClick={() => setActiveTab('ldgr')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'ldgr'
                ? 'text-samurai-red border-b-2 border-samurai-red'
                : 'text-samurai-steel hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-2" />
            LDGR Files
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'text-samurai-red border-b-2 border-samurai-red'
                : 'text-samurai-steel hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'ldgr' ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-samurai-steel" />
              <p className="text-samurai-steel mb-6">Browse your LDGR files</p>
              <button
                onClick={handleBrowseLDGR}
                className="btn-primary"
              >
                Open LDGR Browser
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-samurai-grey-dark rounded-xl p-8 text-center hover:border-samurai-red transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-samurai-steel" />
                <p className="text-white mb-2">Choose a file to upload</p>
                <p className="text-sm text-samurai-steel mb-4">File will be stored in the channel's LDGR folder</p>
                <input
                  type="file"
                  onChange={handleLocalFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="btn-secondary cursor-pointer inline-block"
                >
                  Select File
                </label>
              </div>

              {selectedFile && (
                <div className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{selectedFile.name}</p>
                      <p className="text-sm text-samurai-steel">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-samurai-red hover:text-samurai-red-dark"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'upload' && selectedFile && (
          <div className="p-6 border-t border-samurai-grey-dark flex justify-end gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="btn-primary"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload & Attach'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
