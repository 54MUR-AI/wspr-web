import { supabase } from '../lib/supabase'

/**
 * Check if user is admin or moderator
 */
export async function isAdminOrModerator(userId: string): Promise<boolean> {
  try {
    const { data: role } = await supabase
      .from('user_roles')
      .select('is_admin, is_moderator')
      .eq('user_id', userId)
      .single()

    return role?.is_admin === true || role?.is_moderator === true
  } catch (error) {
    console.error('Error checking admin/moderator status:', error)
    return false
  }
}

/**
 * Check if user can create/delete channels in a workspace
 */
export async function canManageChannels(userId: string, workspaceId: string): Promise<boolean> {
  try {
    // Get workspace info
    const { data: workspace } = await supabase
      .from('wspr_workspaces')
      .select('name, owner_id')
      .eq('id', workspaceId)
      .single()

    if (!workspace) return false

    // If it's the Public workspace, only admins/mods can manage channels
    if (workspace.name === 'Public') {
      return await isAdminOrModerator(userId)
    }

    // For other workspaces, owner can manage channels
    return workspace.owner_id === userId
  } catch (error) {
    console.error('Error checking channel management permissions:', error)
    return false
  }
}

/**
 * Check if user can delete a workspace
 */
export async function canDeleteWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  try {
    const { data: workspace } = await supabase
      .from('wspr_workspaces')
      .select('name, owner_id')
      .eq('id', workspaceId)
      .single()

    if (!workspace) return false

    // Public workspace cannot be deleted
    if (workspace.name === 'Public') {
      return false
    }

    // Only owner can delete their workspace
    return workspace.owner_id === userId
  } catch (error) {
    console.error('Error checking workspace deletion permissions:', error)
    return false
  }
}
