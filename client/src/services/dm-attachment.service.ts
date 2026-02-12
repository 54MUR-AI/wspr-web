import { supabase } from '../lib/supabase'

export interface DMAttachment {
  id: string
  dm_message_id: string
  ldgr_file_id: string
  filename: string
  file_size: number
  mime_type: string | null
  uploaded_by: string
  created_at: string
}

/**
 * Add attachment to a DM message
 */
export async function addDMAttachment(
  dmMessageId: string,
  ldgrFileId: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  userId: string
): Promise<DMAttachment | null> {
  try {
    const { data, error } = await supabase
      .from('wspr_dm_attachments')
      .insert({
        dm_message_id: dmMessageId,
        ldgr_file_id: ldgrFileId,
        filename: filename,
        file_size: fileSize,
        mime_type: mimeType,
        uploaded_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding DM attachment:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Add DM attachment error:', error)
    return null
  }
}

/**
 * Get attachments for a DM message
 */
export async function getDMMessageAttachments(dmMessageId: string): Promise<DMAttachment[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_dm_attachments')
      .select('*')
      .eq('dm_message_id', dmMessageId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching DM attachments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Fetch DM attachments error:', error)
    return []
  }
}

/**
 * Delete a DM attachment
 */
export async function deleteDMAttachment(attachmentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_dm_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('uploaded_by', userId)

    if (error) {
      console.error('Error deleting DM attachment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete DM attachment error:', error)
    return false
  }
}

/**
 * Create a file share record (for Drops folder tracking)
 */
export async function createFileShare(
  fileId: string,
  sharedWithUserId: string,
  sharedByUserId: string,
  shareContext: 'dm' | 'channel',
  contextId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_file_shares')
      .insert({
        file_id: fileId,
        shared_with_user_id: sharedWithUserId,
        shared_by_user_id: sharedByUserId,
        share_context: shareContext,
        context_id: contextId
      })

    if (error) {
      // Ignore duplicate share errors
      if (error.code === '23505') return true
      console.error('Error creating file share:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Create file share error:', error)
    return false
  }
}

/**
 * Download DM attachment from LDGR via RMG bridge
 */
export function downloadDMAttachment(ldgrFileId: string, filename: string) {
  window.parent.postMessage({
    type: 'WSPR_DOWNLOAD_FILE',
    fileId: ldgrFileId,
    filename: filename
  }, '*')
}
