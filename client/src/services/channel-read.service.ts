import { supabase } from '../lib/supabase'

/**
 * Get unread message counts for all channels in a workspace
 */
export async function getChannelUnreadCounts(
  userId: string,
  workspaceId: string
): Promise<Map<string, number>> {
  try {
    const { data, error } = await supabase.rpc('get_channel_unread_counts', {
      p_user_id: userId,
      p_workspace_id: workspaceId
    })

    if (error) {
      console.error('Error fetching unread counts:', error)
      return new Map()
    }

    const counts = new Map<string, number>()
    for (const row of data || []) {
      if (row.unread_count > 0) {
        counts.set(row.channel_id, row.unread_count)
      }
    }
    return counts
  } catch (error) {
    console.error('Unread counts error:', error)
    return new Map()
  }
}

/**
 * Mark a channel as read for the current user
 */
export async function markChannelRead(
  userId: string,
  channelId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('mark_channel_read', {
      p_user_id: userId,
      p_channel_id: channelId
    })

    if (error) {
      console.error('Error marking channel read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Mark channel read error:', error)
    return false
  }
}
