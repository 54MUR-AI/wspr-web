import { File, Download, X } from 'lucide-react'

interface AttachmentData {
  id: string
  ldgr_file_id: string
  filename: string
  file_size: number
  mime_type: string | null
}

interface AttachmentCardProps {
  attachment: AttachmentData
  onDownload: (ldgrFileId: string, filename: string) => void
  onDelete?: (attachmentId: string) => void
  canDelete: boolean
}

export default function AttachmentCard({ attachment, onDownload, onDelete, canDelete }: AttachmentCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimeType: string | null): string => {
    if (!mimeType) return '📄'
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📕'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
    if (mimeType.includes('text')) return '📝'
    return '📄'
  }

  return (
    <div className="glass-card rounded-lg p-3 flex items-center gap-3 hover:bg-samurai-grey-darker transition-colors group">
      <div className="text-2xl flex-shrink-0">
        {getFileIcon(attachment.mime_type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-samurai-steel">{formatFileSize(attachment.file_size)}</p>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onDownload(attachment.ldgr_file_id, attachment.filename)}
          className="p-2 hover:bg-samurai-grey-dark rounded-lg transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4 text-samurai-steel hover:text-white" />
        </button>
        
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(attachment.id)}
            className="p-2 hover:bg-samurai-grey-dark rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Delete attachment"
          >
            <X className="w-4 h-4 text-samurai-steel hover:text-samurai-red" />
          </button>
        )}
      </div>
    </div>
  )
}
