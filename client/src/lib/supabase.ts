import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,  // Don't cache sessions - always get from RMG
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

// Database types
export type WsprProfile = {
  id: string
  display_name: string
  status: 'online' | 'away' | 'busy' | 'offline'
  status_message: string | null
  avatar_url: string | null
  avatar_color: string | null
  created_at: string
  updated_at: string
}

export type WsprContact = {
  id: string
  user_id: string
  contact_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

export type WsprWorkspace = {
  id: string
  name: string
  description: string | null
  owner_id: string
  ldgr_folder_id: string | null
  is_public: boolean
  created_at: string
}

export type WsprChannel = {
  id: string
  workspace_id: string
  name: string
  description: string | null
  is_private: boolean
  created_by: string | null
  created_at: string
}

export type WsprMessage = {
  id: string
  channel_id: string
  user_id: string | null
  content: string
  is_encrypted: boolean
  thread_id: string | null
  edited_at: string | null
  created_at: string
}

export type WsprDirectMessage = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_encrypted: boolean
  read_at: string | null
  created_at: string
}

export type WsprFileShare = {
  id: string
  file_id: string
  shared_by: string
  shared_with: string
  channel_id: string | null
  message_id: string | null
  share_type: 'send' | 'temporary'
  expires_at: string | null
  created_at: string
}
