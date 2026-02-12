import { supabase } from '../lib/supabase'

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

/**
 * Get all reactions for a message
 */
export async function getMessageReactions(messageId: string): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from('wspr_reactions')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching reactions:', error)
    return []
  }
  return data || []
}

/**
 * Get reactions for multiple messages at once
 */
export async function getReactionsForMessages(messageIds: string[]): Promise<Map<string, Reaction[]>> {
  if (messageIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('wspr_reactions')
    .select('*')
    .in('message_id', messageIds)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching reactions:', error)
    return new Map()
  }

  const map = new Map<string, Reaction[]>()
  for (const reaction of data || []) {
    const existing = map.get(reaction.message_id) || []
    existing.push(reaction)
    map.set(reaction.message_id, existing)
  }
  return map
}

/**
 * Toggle a reaction on a message (add if not present, remove if already reacted)
 */
export async function toggleReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
  // Check if user already reacted with this emoji
  const { data: existing } = await supabase
    .from('wspr_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from('wspr_reactions')
      .delete()
      .eq('id', existing.id)

    if (error) {
      console.error('Error removing reaction:', error)
      return false
    }
    return true
  } else {
    // Add reaction
    const { error } = await supabase
      .from('wspr_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji: emoji
      })

    if (error) {
      console.error('Error adding reaction:', error)
      return false
    }
    return true
  }
}

/**
 * Subscribe to reaction changes for a channel's messages
 */
export function subscribeToReactions(
  channelId: string,
  onReactionChange: (messageId: string) => void
): () => void {
  const subscription = supabase
    .channel(`reactions:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wspr_reactions'
      },
      (payload) => {
        const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id
        if (messageId) {
          onReactionChange(messageId)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(subscription)
  }
}
