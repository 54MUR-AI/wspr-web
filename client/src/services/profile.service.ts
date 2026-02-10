import { supabase, WsprProfile } from '../lib/supabase'

/**
 * Get or create user profile
 */
export async function getOrCreateProfile(userId: string, email: string): Promise<WsprProfile | null> {
  try {
    // Try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('wspr_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      return existingProfile
    }

    // Profile doesn't exist, create it (should be auto-created by trigger, but just in case)
    if (fetchError?.code === 'PGRST116') {
      const displayName = email.split('@')[0]
      const { data: newProfile, error: createError } = await supabase
        .from('wspr_profiles')
        .insert({
          id: userId,
          display_name: displayName,
          status: 'online'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        return null
      }

      return newProfile
    }

    console.error('Error fetching profile:', fetchError)
    return null
  } catch (error) {
    console.error('Profile service error:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: Partial<WsprProfile>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Profile update error:', error)
    return false
  }
}

/**
 * Update user status
 */
export async function updateStatus(
  userId: string, 
  status: 'online' | 'away' | 'busy' | 'offline',
  statusMessage?: string
): Promise<boolean> {
  return updateProfile(userId, { 
    status, 
    status_message: statusMessage || null,
    updated_at: new Date().toISOString()
  })
}

/**
 * Get profile by user ID
 */
export async function getProfile(userId: string): Promise<WsprProfile | null> {
  try {
    const { data, error } = await supabase
      .from('wspr_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Profile fetch error:', error)
    return null
  }
}

/**
 * Search all RMG users by email or display name
 */
export async function searchUsers(query: string): Promise<WsprProfile[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_profiles')
      .select('*')
      .or(`display_name.ilike.%${query}%,id.in.(select id from auth.users where email ilike '%${query}%')`)
      .limit(20)

    if (error) {
      console.error('Error searching users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('User search error:', error)
    return []
  }
}
