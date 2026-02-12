import { supabase } from '../lib/supabase'

export interface SearchResult {
  id: string
  type: 'channel' | 'dm'
  content: string
  created_at: string
  // Channel message fields
  channel_id?: string
  channel_name?: string
  user_display_name?: string
  // DM fields
  sender_id?: string
  recipient_id?: string
  contact_id?: string
  contact_display_name?: string
}

/**
 * Search channel messages and DMs using ilike pattern matching.
 * Returns up to 20 results sorted by recency.
 */
export async function searchMessages(
  query: string,
  userId: string,
  limit = 20
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const pattern = `%${query.trim()}%`
  const results: SearchResult[] = []

  // Search channel messages
  const { data: channelMsgs } = await supabase
    .from('wspr_messages')
    .select('id, content, created_at, channel_id, user:wspr_profiles!user_id(display_name)')
    .ilike('content', pattern)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (channelMsgs) {
    for (const msg of channelMsgs) {
      // Look up channel name
      const { data: ch } = await supabase
        .from('wspr_channels')
        .select('name')
        .eq('id', msg.channel_id)
        .single()

      results.push({
        id: msg.id,
        type: 'channel',
        content: msg.content,
        created_at: msg.created_at,
        channel_id: msg.channel_id,
        channel_name: ch?.name || 'unknown',
        user_display_name: (msg.user as any)?.display_name || 'Unknown'
      })
    }
  }

  // Search DMs (only messages the user sent or received)
  const { data: dmMsgs } = await supabase
    .from('wspr_direct_messages')
    .select('id, content, created_at, sender_id, recipient_id')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .ilike('content', pattern)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (dmMsgs) {
    for (const msg of dmMsgs) {
      const contactId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id
      const { data: profile } = await supabase
        .from('wspr_profiles')
        .select('display_name')
        .eq('id', contactId)
        .single()

      results.push({
        id: msg.id,
        type: 'dm',
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        contact_id: contactId,
        contact_display_name: profile?.display_name || 'Unknown'
      })
    }
  }

  // Sort all results by recency
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return results.slice(0, limit)
}
