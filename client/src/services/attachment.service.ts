import { supabase } from '../lib/supabase'

export interface Attachment {
  id: string
  message_id: string
  ldgr_file_id: string
  filename: string
  file_size: number
  mime_type: string | null
  uploaded_by: string
  created_at: string
}

/**
 * Add attachment to a message
 */
export async function addAttachment(
  messageId: string,
  ldgrFileId: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  userId: string
): Promise<Attachment | null> {
  try {
    const { data, error } = await supabase
      .from('wspr_attachments')
      .insert({
        message_id: messageId,
        ldgr_file_id: ldgrFileId,
        filename: filename,
        file_size: fileSize,
        mime_type: mimeType,
        uploaded_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding attachment:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Add attachment error:', error)
    return null
  }
}

/**
 * Get attachments for a message
 */
export async function getMessageAttachments(messageId: string): Promise<Attachment[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching attachments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Fetch attachments error:', error)
    return []
  }
}

/**
 * Delete attachment
 */
export async function deleteAttachment(attachmentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('uploaded_by', userId)

    if (error) {
      console.error('Error deleting attachment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete attachment error:', error)
    return false
  }
}

/**
 * Download attachment from LDGR
 */
export function downloadAttachment(ldgrFileId: string, filename: string) {
  // Send message to RMG to download file from LDGR
  window.parent.postMessage({
    type: 'WSPR_DOWNLOAD_FILE',
    fileId: ldgrFileId,
    filename: filename
  }, '*')
}
