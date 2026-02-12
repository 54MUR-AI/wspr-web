import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type TypingCallback = (userId: string, displayName: string) => void

const TYPING_TIMEOUT_MS = 3000
const activeChannels = new Map<string, RealtimeChannel>()
const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Subscribe to typing events for a channel or DM conversation.
 * Uses Supabase Realtime Broadcast (ephemeral, no DB writes).
 */
export function subscribeToTyping(
  roomId: string,
  currentUserId: string,
  onTypingStart: TypingCallback,
  onTypingStop: TypingCallback
): () => void {
  const channelName = `typing:${roomId}`

  // Reuse existing channel if already subscribed
  if (activeChannels.has(channelName)) {
    activeChannels.get(channelName)!.unsubscribe()
    activeChannels.delete(channelName)
  }

  const channel = supabase.channel(channelName)

  channel
    .on('broadcast', { event: 'typing' }, (payload) => {
      const { userId, displayName, isTyping } = payload.payload as {
        userId: string
        displayName: string
        isTyping: boolean
      }

      // Ignore own typing events
      if (userId === currentUserId) return

      const timeoutKey = `${roomId}:${userId}`

      if (isTyping) {
        // Clear existing timeout for this user
        const existing = typingTimeouts.get(timeoutKey)
        if (existing) clearTimeout(existing)

        onTypingStart(userId, displayName)

        // Auto-clear after timeout (safety net)
        const timeout = setTimeout(() => {
          onTypingStop(userId, displayName)
          typingTimeouts.delete(timeoutKey)
        }, TYPING_TIMEOUT_MS + 1000)
        typingTimeouts.set(timeoutKey, timeout)
      } else {
        const existing = typingTimeouts.get(timeoutKey)
        if (existing) clearTimeout(existing)
        typingTimeouts.delete(timeoutKey)
        onTypingStop(userId, displayName)
      }
    })
    .subscribe()

  activeChannels.set(channelName, channel)

  return () => {
    channel.unsubscribe()
    activeChannels.delete(channelName)
    // Clear all timeouts for this room
    for (const [key, timeout] of typingTimeouts.entries()) {
      if (key.startsWith(`${roomId}:`)) {
        clearTimeout(timeout)
        typingTimeouts.delete(key)
      }
    }
  }
}

/**
 * Send a typing event to a channel or DM conversation.
 */
let sendTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export function sendTypingEvent(
  roomId: string,
  userId: string,
  displayName: string,
  isTyping: boolean
): void {
  const channelName = `typing:${roomId}`

  // Get or create channel
  let channel = activeChannels.get(channelName)
  if (!channel) {
    channel = supabase.channel(channelName)
    channel.subscribe()
    activeChannels.set(channelName, channel)
  }

  // Debounce: don't spam typing=true events
  const debounceKey = `send:${roomId}`
  if (isTyping) {
    const existing = sendTimeouts.get(debounceKey)
    if (existing) return // Already sent recently

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, displayName, isTyping: true }
    })

    // Set debounce timeout
    const timeout = setTimeout(() => {
      sendTimeouts.delete(debounceKey)
    }, 1000)
    sendTimeouts.set(debounceKey, timeout)

    // Auto-send stop after TYPING_TIMEOUT_MS
    const stopKey = `stop:${roomId}`
    const existingStop = sendTimeouts.get(stopKey)
    if (existingStop) clearTimeout(existingStop)
    const stopTimeout = setTimeout(() => {
      sendTypingEvent(roomId, userId, displayName, false)
      sendTimeouts.delete(stopKey)
    }, TYPING_TIMEOUT_MS)
    sendTimeouts.set(stopKey, stopTimeout)
  } else {
    // Clear debounce
    const existing = sendTimeouts.get(debounceKey)
    if (existing) {
      clearTimeout(existing)
      sendTimeouts.delete(debounceKey)
    }
    const stopKey = `stop:${roomId}`
    const existingStop = sendTimeouts.get(stopKey)
    if (existingStop) {
      clearTimeout(existingStop)
      sendTimeouts.delete(stopKey)
    }

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, displayName, isTyping: false }
    })
  }
}
