import { supabase } from '../lib/supabase'

/**
 * Simple encryption/decryption for DMs (matches channel message approach).
 * In production, replace with proper E2E encryption using user keys.
 */
function encryptDM(content: string): string {
  return btoa(unescape(encodeURIComponent(content)))
}

function decryptDM(encrypted: string): string {
  try {
    return decodeURIComponent(escape(atob(encrypted)))
  } catch {
    return encrypted // Return as-is if decryption fails (legacy plaintext)
  }
}

/**
 * Decrypt a DM message content, handling both encrypted and plaintext messages.
 */
export function decryptDMContent(msg: DirectMessage): string {
  if (msg.is_encrypted) {
    return decryptDM(msg.content)
  }
  return msg.content
}

export interface DirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_encrypted: boolean
  read_at: string | null
  created_at: string
}

export interface DMConversation {
  contact_id: string
  contact_display_name: string
  contact_avatar_url: string | null
  contact_avatar_color: string | null
  last_message: string
  last_message_at: string
  last_message_sender_name: string | null
  unread_count: number
}

/**
 * Get all DM conversations for a user
 */
export async function getDMConversations(userId: string): Promise<DMConversation[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_dm_conversations', { user_id_param: userId })

    if (error) {
      console.error('Error fetching DM conversations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('DM conversations error:', error)
    return []
  }
}

/**
 * Get messages in a DM conversation
 */
export async function getDMMessages(userId: string, contactId: string, limit = 50): Promise<DirectMessage[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching DM messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('DM messages error:', error)
    return []
  }
}

/**
 * Send a direct message
 */
export async function sendDM(senderId: string, recipientId: string, content: string): Promise<DirectMessage | null> {
  try {
    const encryptedContent = encryptDM(content)

    const { data, error } = await supabase
      .from('wspr_direct_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content: encryptedContent,
        is_encrypted: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending DM:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Send DM error:', error)
    return null
  }
}

/**
 * Mark DM as read
 */
export async function markDMAsRead(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)

    if (error) {
      console.error('Error marking DM as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Mark as read error:', error)
    return false
  }
}

/**
 * Mark all DMs from a contact as read
 */
export async function markAllDMsAsRead(userId: string, contactId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('sender_id', contactId)
      .is('read_at', null)

    if (error) {
      console.error('Error marking all DMs as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Mark all as read error:', error)
    return false
  }
}

/**
 * Delete a DM (sender only)
 */
export async function deleteDM(messageId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_direct_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId)

    if (error) {
      console.error('Error deleting DM:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete DM error:', error)
    return false
  }
}

/**
 * Subscribe to new DMs for a user
 */
export function subscribeToDMs(userId: string, callback: (message: DirectMessage) => void) {
  const subscription = supabase
    .channel('dm-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'wspr_direct_messages',
        filter: `recipient_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as DirectMessage)
      }
    )
    .subscribe()

  return subscription
}
