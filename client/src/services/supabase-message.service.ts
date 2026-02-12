import { supabase, WsprMessage } from '../lib/supabase'

/**
 * Simple encryption/decryption for messages
 * In production, use proper E2E encryption with user keys
 */
function encryptMessage(content: string, userId: string): string {
  // Simple base64 encoding for now - replace with proper encryption
  return btoa(content)
}

function decryptMessage(encryptedContent: string, userId: string): string {
  try {
    return atob(encryptedContent)
  } catch {
    return encryptedContent // Return as-is if decryption fails
  }
}

/**
 * Get messages for a channel
 */
export async function getChannelMessages(
  channelId: string,
  limit: number = 50,
  offset: number = 0
): Promise<WsprMessage[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_messages')
      .select(`
        *,
        user:wspr_profiles(id, display_name, avatar_url)
      `)
      .eq('channel_id', channelId)
      .is('thread_id', null) // Only get top-level messages
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return (data || []).reverse() // Reverse to show oldest first
  } catch (error) {
    console.error('Message fetch error:', error)
    return []
  }
}

/**
 * Send message to channel
 */
export async function sendChannelMessage(
  channelId: string,
  userId: string,
  content: string,
  threadId?: string
): Promise<WsprMessage | null> {
  try {
    const encryptedContent = encryptMessage(content, userId)

    const { data, error } = await supabase
      .from('wspr_messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        content: encryptedContent,
        is_encrypted: true,
        thread_id: threadId || null
      })
      .select(`
        *,
        user:wspr_profiles(id, display_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Send message error:', error)
    return null
  }
}

/**
 * Get direct messages between two users
 */
export async function getDirectMessages(
  userId: string,
  contactId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_direct_messages')
      .select(`
        *,
        sender:wspr_profiles!wspr_direct_messages_sender_id_fkey(id, display_name, avatar_url),
        recipient:wspr_profiles!wspr_direct_messages_recipient_id_fkey(id, display_name, avatar_url)
      `)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching DMs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('DM fetch error:', error)
    return []
  }
}

/**
 * Send direct message
 */
export async function sendDirectMessage(
  senderId: string,
  recipientId: string,
  content: string
): Promise<any | null> {
  try {
    const encryptedContent = encryptMessage(content, senderId)

    const { data, error } = await supabase
      .from('wspr_direct_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content: encryptedContent,
        is_encrypted: true
      })
      .select(`
        *,
        sender:wspr_profiles!wspr_direct_messages_sender_id_fkey(id, display_name, avatar_url),
        recipient:wspr_profiles!wspr_direct_messages_recipient_id_fkey(id, display_name, avatar_url)
      `)
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
    console.error('Mark read error:', error)
    return false
  }
}

/**
 * Decrypt message content for display
 */
export function decryptMessageContent(message: WsprMessage, userId: string): string {
  if (!message.is_encrypted) {
    return message.content
  }
  return decryptMessage(message.content, userId)
}

/**
 * Edit a message (author only)
 */
export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string
): Promise<{ success: boolean; encryptedContent?: string }> {
  try {
    // Verify user is the author
    const { data: message, error: fetchError } = await supabase
      .from('wspr_messages')
      .select('user_id')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      console.error('Error fetching message:', fetchError)
      return { success: false }
    }

    if (message.user_id !== userId) {
      console.error('Only message author can edit')
      return { success: false }
    }

    // Encrypt and update message
    const encryptedContent = encryptMessage(newContent, userId)
    const { error: updateError } = await supabase
      .from('wspr_messages')
      .update({
        content: encryptedContent,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('Error updating message:', updateError)
      return { success: false }
    }

    return { success: true, encryptedContent }
  } catch (error) {
    console.error('Edit message error:', error)
    return { success: false }
  }
}

/**
 * Delete a message (author or admin/mod in Public channels)
 */
export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<boolean> {
  try {
    console.log('🗑️ Attempting to delete message:', messageId, 'by user:', userId)
    
    // Delete message - RLS policy will handle authorization
    // (allows author to delete own messages, or admin/mod to delete in Public channels)
    const { data: deleteData, error: deleteError } = await supabase
      .from('wspr_messages')
      .delete()
      .eq('id', messageId)
      .select()

    if (deleteError) {
      console.error('❌ Error deleting message from database:', deleteError)
      return false
    }

    console.log('✅ Message deleted successfully from database:', deleteData)
    return true
  } catch (error) {
    console.error('❌ Delete message error:', error)
    return false
  }
}

/**
 * Subscribe to new messages in a channel (real-time)
 */
export function subscribeToChannelMessages(
  channelId: string,
  callback: (message: WsprMessage) => void
) {
  const subscription = supabase
    .channel(`channel:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'wspr_messages',
        filter: `channel_id=eq.${channelId}`
      },
      (payload) => {
        callback(payload.new as WsprMessage)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}
