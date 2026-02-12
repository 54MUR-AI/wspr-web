import { supabase } from '../lib/supabase'

let currentUserId: string | null = null
let unsubscribe: (() => void) | null = null

/**
 * Request browser notification permission on first call.
 */
async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Show a browser notification for a new DM.
 */
function showNotification(senderName: string, content: string) {
  if (document.hasFocus()) return // Don't notify if tab is focused
  if (Notification.permission !== 'granted') return

  new Notification(`${senderName} — WSPR`, {
    body: content.length > 100 ? content.slice(0, 100) + '...' : content,
    icon: '/wspr-icon.png',
    tag: 'wspr-dm', // Collapse multiple notifications
    silent: false
  })
}

/**
 * Update the document title with unread count.
 */
export function updateTitleBadge(unreadCount: number) {
  const baseTitle = 'WSPR'
  document.title = unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle
}

/**
 * Start listening for new DMs and show browser notifications.
 * Also updates the document title badge with total unread count.
 */
export function startNotifications(userId: string): () => void {
  currentUserId = userId
  requestPermission()

  const subscription = supabase
    .channel('dm-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'wspr_direct_messages',
        filter: `recipient_id=eq.${userId}`
      },
      async (payload) => {
        const msg = payload.new as { sender_id: string; content: string }

        // Look up sender display name
        const { data: profile } = await supabase
          .from('wspr_profiles')
          .select('display_name')
          .eq('id', msg.sender_id)
          .single()

        const senderName = profile?.display_name || 'Someone'
        showNotification(senderName, msg.content)

        // Update title badge with total unread count
        const { count } = await supabase
          .from('wspr_direct_messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .is('read_at', null)

        updateTitleBadge(count || 0)
      }
    )
    .subscribe()

  // Initial unread count for title badge
  ;(async () => {
    const { count } = await supabase
      .from('wspr_direct_messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null)

    updateTitleBadge(count || 0)
  })()

  unsubscribe = () => {
    supabase.removeChannel(subscription)
    updateTitleBadge(0)
  }

  return unsubscribe
}
