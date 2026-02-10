# WSPR + LDGR Integration Plan

## Overview
WSPR will integrate with LDGR for secure, encrypted file storage and sharing within messages. Users can upload files to LDGR directly from WSPR and share them as message attachments.

---

## Architecture

### File Upload Flow
```
User selects file in WSPR
    ↓
File encrypted client-side (Web Crypto API)
    ↓
Upload to LDGR via API
    ↓
LDGR returns file ID + metadata
    ↓
WSPR stores reference in message
    ↓
Recipients can download via LDGR
```

### Authentication
- WSPR passes RMG user credentials to LDGR
- LDGR validates user has access to workspace
- Files are scoped to user's LDGR folders

---

## Implementation

### 1. LDGR API Client (WSPR Frontend)
```typescript
// client/src/services/ldgr.service.ts

export interface LDGRFile {
  id: string
  name: string
  size: number
  mimeType: string
  uploadedAt: string
  downloadUrl: string
}

export class LDGRService {
  private static LDGR_API = 'https://ldgr-api.onrender.com'
  
  async uploadFile(file: File, userId: string): Promise<LDGRFile> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('folder', 'wspr-attachments')
    
    const response = await fetch(`${LDGRService.LDGR_API}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    
    return response.json()
  }
  
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(
      `${LDGRService.LDGR_API}/download/${fileId}`,
      { credentials: 'include' }
    )
    return response.blob()
  }
  
  async deleteFile(fileId: string): Promise<void> {
    await fetch(`${LDGRService.LDGR_API}/delete/${fileId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
  }
}

export const ldgrService = new LDGRService()
```

### 2. File Attachment Component
```typescript
// client/src/components/FileAttachment.tsx

interface FileAttachmentProps {
  file: LDGRFile
  onDownload: () => void
  onDelete?: () => void
}

export function FileAttachment({ file, onDownload, onDelete }: FileAttachmentProps) {
  return (
    <div className="glass-card p-3 rounded-lg flex items-center gap-3">
      <Paperclip className="w-5 h-5 text-samurai-red" />
      <div className="flex-1">
        <p className="font-semibold text-white">{file.name}</p>
        <p className="text-xs text-samurai-steel">
          {formatFileSize(file.size)} • {file.mimeType}
        </p>
      </div>
      <button onClick={onDownload} className="btn-secondary">
        Download
      </button>
      {onDelete && (
        <button onClick={onDelete} className="text-samurai-red hover:text-samurai-red-dark">
          <Trash className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
```

### 3. Message Schema Update
```typescript
interface Message {
  id: string
  author: string
  content: string
  timestamp: string
  avatar: string
  attachments?: LDGRFile[]  // NEW: LDGR file references
}
```

### 4. Upload UI in MessageThread
```typescript
// Add to MessageThread.tsx

const [selectedFiles, setSelectedFiles] = useState<File[]>([])
const [uploading, setUploading] = useState(false)

const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    setSelectedFiles(Array.from(e.target.files))
  }
}

const handleSend = async () => {
  if (!message.trim() && selectedFiles.length === 0) return
  
  setUploading(true)
  const attachments: LDGRFile[] = []
  
  // Upload files to LDGR
  for (const file of selectedFiles) {
    const uploaded = await ldgrService.uploadFile(file, userId)
    attachments.push(uploaded)
  }
  
  // Send message with LDGR file references
  await sendMessage({
    content: message,
    attachments
  })
  
  setMessage('')
  setSelectedFiles([])
  setUploading(false)
}
```

---

## Database Schema (Supabase)

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  attachments JSONB,  -- Array of LDGR file references
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Example Attachment JSON
```json
{
  "attachments": [
    {
      "id": "ldgr_abc123",
      "name": "design.pdf",
      "size": 2048576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-02-10T05:30:00Z",
      "downloadUrl": "https://ldgr-api.onrender.com/download/ldgr_abc123"
    }
  ]
}
```

---

## Security Considerations

### 1. File Access Control
- LDGR validates user has access to workspace
- Files are encrypted at rest in LDGR
- Download URLs are time-limited (1 hour expiry)

### 2. File Size Limits
- Max file size: 100MB per file
- Max 10 files per message
- Total workspace quota enforced by LDGR

### 3. Malware Scanning
- LDGR scans files on upload (ClamAV)
- Reject files with detected threats
- Quarantine suspicious files

---

## User Experience

### Upload Flow
1. User clicks paperclip icon in message input
2. File picker opens
3. User selects files (multi-select supported)
4. Preview thumbnails shown below input
5. User types message (optional)
6. Click send → files upload to LDGR → message sent
7. Recipients see file attachments with download buttons

### Download Flow
1. Recipient clicks "Download" on attachment
2. LDGR validates recipient has access
3. File downloads directly from LDGR
4. Browser saves file to Downloads folder

---

## Future Enhancements

### Phase 2
- [ ] Drag-and-drop file upload
- [ ] Image/video preview in chat
- [ ] File search across all messages
- [ ] Bulk file operations (download all, delete all)

### Phase 3
- [ ] Real-time file sync (like Dropbox)
- [ ] Version control for files
- [ ] Collaborative editing (Google Docs-like)
- [ ] File comments and annotations

---

## Implementation Timeline

**Week 1:** LDGR API client + basic upload/download
**Week 2:** UI components + message schema updates
**Week 3:** Security hardening + testing
**Week 4:** Production deployment + monitoring

---

## Dependencies

- LDGR API must be deployed and accessible
- Supabase database schema updated
- RMG auth integration complete (✅ Done)
- WSPR backend deployed to Render (⏳ In Progress)

---

## Testing Checklist

- [ ] Upload file to LDGR from WSPR
- [ ] Download file from WSPR message
- [ ] Delete file from LDGR
- [ ] File access control (unauthorized user blocked)
- [ ] Large file upload (100MB)
- [ ] Multiple files in single message
- [ ] File preview for images/videos
- [ ] Mobile responsiveness
