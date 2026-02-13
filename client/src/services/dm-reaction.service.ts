import { supabase } from '../lib/supabase'

export interface DMReaction {
  id: string
  dm_message_id: string
  user_id: string
  emoji: string
  created_at: string
}

/**
 * Get all reactions for a DM message
 */
export async function getDMMessageReactions(dmMessageId: string): Promise<DMReaction[]> {
  const { data, error } = await supabase
    .from('wspr_dm_reactions')
    .select('*')
    .eq('dm_message_id', dmMessageId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching DM reactions:', error)
    return []
  }
  return data || []
}

/**
 * Get reactions for multiple DM messages at once
 */
export async function getDMReactionsForMessages(messageIds: string[]): Promise<Map<string, DMReaction[]>> {
  if (messageIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('wspr_dm_reactions')
    .select('*')
    .in('dm_message_id', messageIds)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching DM reactions:', error)
    return new Map()
  }

  const map = new Map<string, DMReaction[]>()
  for (const reaction of data || []) {
    const existing = map.get(reaction.dm_message_id) || []
    existing.push(reaction)
    map.set(reaction.dm_message_id, existing)
  }
  return map
}

/**
 * Toggle a reaction on a DM message (add if not present, remove if already reacted)
 */
export async function toggleDMReaction(dmMessageId: string, userId: string, emoji: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('wspr_dm_reactions')
    .select('id')
    .eq('dm_message_id', dmMessageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('wspr_dm_reactions')
      .delete()
      .eq('id', existing.id)

    if (error) {
      console.error('Error removing DM reaction:', error)
      return false
    }
    return true
  } else {
    const { error } = await supabase
      .from('wspr_dm_reactions')
      .insert({
        dm_message_id: dmMessageId,
        user_id: userId,
        emoji: emoji
      })

    if (error) {
      console.error('Error adding DM reaction:', error)
      return false
    }
    return true
  }
}

/**
 * Subscribe to DM reaction changes for a conversation
 */
export function subscribeToDMReactions(
  conversationKey: string,
  onReactionChange: (dmMessageId: string) => void
): () => void {
  const subscription = supabase
    .channel(`dm-reactions:${conversationKey}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wspr_dm_reactions'
      },
      (payload) => {
        const dmMessageId = (payload.new as any)?.dm_message_id || (payload.old as any)?.dm_message_id
        if (dmMessageId) {
          onReactionChange(dmMessageId)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(subscription)
  }
}
