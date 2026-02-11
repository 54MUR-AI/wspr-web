import { supabase, WsprContact, WsprProfile } from '../lib/supabase'

/**
 * Get user's contacts
 */
export async function getContacts(userId: string): Promise<(WsprContact & { profile: WsprProfile })[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_contacts')
      .select(`
        *,
        profile:wspr_profiles!wspr_contacts_contact_profile_fkey(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')

    if (error) {
      console.error('Error fetching contacts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Contact fetch error:', error)
    return []
  }
}

/**
 * Get pending contact requests
 */
export async function getPendingRequests(userId: string): Promise<(WsprContact & { profile: WsprProfile })[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_contacts')
      .select(`
        *,
        profile:wspr_profiles!wspr_contacts_user_id_fkey(*)
      `)
      .eq('contact_id', userId)
      .eq('status', 'pending')

    if (error) {
      console.error('Error fetching pending requests:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Pending requests error:', error)
    return []
  }
}

/**
 * Send contact request
 */
export async function sendContactRequest(userId: string, contactId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_contacts')
      .insert({
        user_id: userId,
        contact_id: contactId,
        status: 'pending'
      })

    if (error) {
      console.error('Error sending contact request:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Contact request error:', error)
    return false
  }
}

/**
 * Accept contact request
 */
export async function acceptContactRequest(requestId: string, userId: string, contactId: string): Promise<boolean> {
  try {
    // Update the original request to accepted
    const { error: updateError } = await supabase
      .from('wspr_contacts')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error accepting request:', updateError)
      return false
    }

    // Create reciprocal contact
    const { error: insertError } = await supabase
      .from('wspr_contacts')
      .insert({
        user_id: contactId,
        contact_id: userId,
        status: 'accepted'
      })

    if (insertError) {
      console.error('Error creating reciprocal contact:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Accept request error:', error)
    return false
  }
}

/**
 * Decline contact request
 */
export async function declineContactRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_contacts')
      .delete()
      .eq('id', requestId)

    if (error) {
      console.error('Error declining request:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Decline request error:', error)
    return false
  }
}

/**
 * Block contact
 */
export async function blockContact(userId: string, contactId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_contacts')
      .update({ status: 'blocked' })
      .eq('user_id', userId)
      .eq('contact_id', contactId)

    if (error) {
      console.error('Error blocking contact:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Block contact error:', error)
    return false
  }
}

/**
 * Remove contact
 */
export async function removeContact(userId: string, contactId: string): Promise<boolean> {
  try {
    // Remove both directions
    const { error } = await supabase
      .from('wspr_contacts')
      .delete()
      .or(`and(user_id.eq.${userId},contact_id.eq.${contactId}),and(user_id.eq.${contactId},contact_id.eq.${userId})`)

    if (error) {
      console.error('Error removing contact:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Remove contact error:', error)
    return false
  }
}
