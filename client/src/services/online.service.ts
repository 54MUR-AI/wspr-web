import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type OnlineCallback = (onlineUserIds: Set<string>) => void

let presenceChannel: RealtimeChannel | null = null
let onlineUsers = new Set<string>()
let callbacks = new Set<OnlineCallback>()

/**
 * Join the global presence channel and track who's online.
 * Uses Supabase Realtime Presence (ephemeral, no DB writes).
 */
export function joinPresence(userId: string, displayName: string): void {
  if (presenceChannel) return // Already joined

  presenceChannel = supabase.channel('wspr-presence', {
    config: { presence: { key: userId } }
  })

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel!.presenceState()
      onlineUsers = new Set(Object.keys(state))
      notifyCallbacks()
    })
    .on('presence', { event: 'join' }, ({ key }) => {
      if (key) {
        onlineUsers.add(key)
        notifyCallbacks()
      }
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      if (key) {
        onlineUsers.delete(key)
        notifyCallbacks()
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel!.track({
          user_id: userId,
          display_name: displayName,
          online_at: new Date().toISOString()
        })
      }
    })
}

/**
 * Leave the presence channel (on logout/unmount).
 */
export function leavePresence(): void {
  if (presenceChannel) {
    presenceChannel.untrack()
    presenceChannel.unsubscribe()
    presenceChannel = null
    onlineUsers.clear()
    notifyCallbacks()
  }
}

/**
 * Subscribe to online status changes. Returns unsubscribe function.
 */
export function subscribeToOnlineUsers(callback: OnlineCallback): () => void {
  callbacks.add(callback)
  // Immediately fire with current state
  callback(new Set(onlineUsers))

  return () => {
    callbacks.delete(callback)
  }
}

/**
 * Check if a specific user is online.
 */
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId)
}

function notifyCallbacks() {
  const snapshot = new Set(onlineUsers)
  callbacks.forEach(cb => cb(snapshot))
}
