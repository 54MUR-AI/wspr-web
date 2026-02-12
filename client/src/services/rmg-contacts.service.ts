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

/**
 * Get user's accepted contacts from RMG
 */
export async function getRMGContacts(userId: string): Promise<RMGContact[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_contacts', { user_id_param: userId })

    if (error) {
      console.error('Error fetching RMG contacts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('RMG contacts fetch error:', error)
    return []
  }
}

/**
 * Get pending contact requests from RMG
 */
export async function getRMGPendingRequests(userId: string): Promise<RMGPendingRequest[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_pending_contact_requests', { user_id_param: userId })

    if (error) {
      console.error('Error fetching RMG pending requests:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('RMG pending requests error:', error)
    return []
  }
}

/**
 * Send contact request via RMG
 */
export async function sendRMGContactRequest(userId: string, contactId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rmg_contacts')
      .insert({
        user_id: userId,
        contact_id: contactId,
        status: 'pending'
      })

    if (error) {
      console.error('Error sending RMG contact request:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('RMG contact request error:', error)
    return false
  }
}

/**
 * Accept contact request via RMG
 */
export async function acceptRMGContactRequest(requestId: string, userId: string, senderId: string): Promise<boolean> {
  try {
    // Update the original request to accepted
    const { error: updateError } = await supabase
      .from('rmg_contacts')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error accepting RMG request:', updateError)
      return false
    }

    // Create reciprocal contact
    const { error: insertError } = await supabase
      .from('rmg_contacts')
      .insert({
        user_id: userId,
        contact_id: senderId,
        status: 'accepted'
      })

    if (insertError) {
      console.error('Error creating reciprocal RMG contact:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Accept RMG request error:', error)
    return false
  }
}

/**
 * Decline contact request via RMG
 */
export async function declineRMGContactRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rmg_contacts')
      .delete()
      .eq('id', requestId)

    if (error) {
      console.error('Error declining RMG request:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Decline RMG request error:', error)
    return false
  }
}

/**
 * Search users via RMG function
 */
export async function searchRMGUsers(query: string, currentUserId: string): Promise<any[]> {
  try {
    if (!query.trim()) {
      return []
    }

    const { data, error } = await supabase
      .rpc('search_users_for_contacts', {
        search_query: query,
        current_user_id: currentUserId
      })

    if (error) {
      console.error('Error searching RMG users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('RMG user search error:', error)
    return []
  }
}
