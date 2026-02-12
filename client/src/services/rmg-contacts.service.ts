/**
 * RMG Contacts Service for WSPR
 * 
 * Mirrors RMG/src/lib/contacts.ts — uses the same Supabase RPCs and tables.
 * If the RPC names or table schema change in RMG, update this file to match.
 * 
 * Table: rmg_contacts
 * RPCs: get_user_contacts, get_pending_contact_requests, search_users_for_contacts
 */
import { supabase } from '../lib/supabase'

export interface RMGContact {
  contact_id: string
  contact_email: string
  contact_display_name: string
  contact_avatar_url: string | null
  contact_avatar_color: string | null
  contact_status: string
  relationship_status: string
  created_at: string
}

export interface RMGPendingRequest {
  request_id: string
  sender_id: string
  sender_email: string
  sender_display_name: string
  sender_avatar_url: string | null
  sender_avatar_color: string | null
  created_at: string
}

// Helper: call an RPC and return data or empty array
async function rpc<T>(name: string, params: Record<string, string>): Promise<T[]> {
  const { data, error } = await supabase.rpc(name, params)
  if (error) { console.error(`[contacts] ${name} failed:`, error); return [] }
  return data || []
}

// Helper: mutate rmg_contacts and return success boolean
async function mutate(fn: () => PromiseLike<{ error: any }>): Promise<boolean> {
  const { error } = await fn()
  if (error) { console.error('[contacts] mutation failed:', error); return false }
  return true
}

export const getRMGContacts = (userId: string): Promise<RMGContact[]> =>
  rpc('get_user_contacts', { user_id_param: userId })

export const getRMGPendingRequests = (userId: string): Promise<RMGPendingRequest[]> =>
  rpc('get_pending_contact_requests', { user_id_param: userId })

export async function sendRMGContactRequest(userId: string, contactId: string): Promise<boolean> {
  return mutate(() => supabase.from('rmg_contacts').insert({ user_id: userId, contact_id: contactId, status: 'pending' }))
}

export async function acceptRMGContactRequest(requestId: string, userId: string, senderId: string): Promise<boolean> {
  const updated = await mutate(() =>
    supabase.from('rmg_contacts').update({ status: 'accepted' }).eq('id', requestId)
  )
  if (!updated) return false
  return mutate(() =>
    supabase.from('rmg_contacts').insert({ user_id: userId, contact_id: senderId, status: 'accepted' })
  )
}

export async function declineRMGContactRequest(requestId: string): Promise<boolean> {
  return mutate(() => supabase.from('rmg_contacts').delete().eq('id', requestId))
}

export async function searchRMGUsers(query: string, currentUserId: string): Promise<any[]> {
  if (!query.trim()) return []
  return rpc('search_users_for_contacts', { search_query: query, current_user_id: currentUserId })
}
