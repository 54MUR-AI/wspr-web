import { supabase, WsprWorkspace } from '../lib/supabase'

/**
 * Get user's workspaces
 */
export async function getUserWorkspaces(userId: string): Promise<WsprWorkspace[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_workspaces')
      .select(`
        *,
        wspr_workspace_members!inner(user_id)
      `)
      .eq('wspr_workspace_members.user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspaces:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Workspace fetch error:', error)
    return []
  }
}

/**
 * Create new workspace (creates LDGR folder too)
 */
export async function createWorkspace(
  userId: string,
  name: string,
  description?: string,
  isPublic: boolean = false
): Promise<WsprWorkspace | null> {
  try {
    const { data: workspace, error: workspaceError } = await supabase
      .from('wspr_workspaces')
      .insert({
        name,
        description,
        owner_id: userId,
        is_public: isPublic
      })
      .select()
      .single()

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError)
      return null
    }

    // Add creator as member
    const { error: memberError } = await supabase
      .from('wspr_workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner'
      })

    if (memberError) {
      console.error('Error adding workspace member:', memberError)
      return null
    }

    // Request LDGR folder creation from RMG
    console.log('📁 Sending workspace folder creation request to RMG:', {
      workspaceId: workspace.id,
      workspaceName: name,
      ownerId: userId
    })
    
    window.parent.postMessage({
      type: 'WSPR_CREATE_LDGR_FOLDER',
      workspaceId: workspace.id,
      workspaceName: name,
      ownerId: userId
    }, '*')

    return workspace
  } catch (error) {
    console.error('Create workspace error:', error)
    return null
  }
}

/**
 * Get or create default "WSPR" workspace
 */
export async function getOrCreateDefaultWorkspace(userId: string): Promise<WsprWorkspace | null> {
  try {
    // Check if user already has WSPR workspace
    const workspaces = await getUserWorkspaces(userId)
    const wsprWorkspace = workspaces.find(w => w.name === 'WSPR')
    
    if (wsprWorkspace) {
      return wsprWorkspace
    }

    // Create default WSPR workspace
    return await createWorkspace(userId, 'WSPR', 'Your personal WSPR workspace', false)
  } catch (error) {
    console.error('Get/create default workspace error:', error)
    return null
  }
}

/**
 * Add member to workspace
 */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role
      })

    if (error) {
      console.error('Error adding workspace member:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Add member error:', error)
    return false
  }
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspaceId: string) {
  try {
    const { data, error } = await supabase
      .from('wspr_workspace_members')
      .select(`
        *,
        profile:wspr_profiles(*)
      `)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Error fetching workspace members:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Workspace members error:', error)
    return []
  }
}

/**
 * Delete workspace and its LDGR folder
 */
export async function deleteWorkspace(workspaceId: string, userId: string): Promise<boolean> {
  try {
    // Get workspace info
    const { data: workspace, error: workspaceError } = await supabase
      .from('wspr_workspaces')
      .select('ldgr_folder_id, owner_id')
      .eq('id', workspaceId)
      .single()

    if (workspaceError) {
      console.error('Error fetching workspace:', workspaceError)
      return false
    }

    if (!workspace) {
      console.error('Workspace not found')
      return false
    }

    // Verify user is owner
    if (workspace.owner_id !== userId) {
      console.error('Only workspace owner can delete workspace')
      return false
    }

    // Send message to RMG to delete LDGR folder
    if (workspace.ldgr_folder_id) {
      window.parent.postMessage({
        type: 'WSPR_DELETE_LDGR_FOLDER',
        folderId: workspace.ldgr_folder_id,
        workspaceId: workspaceId
      }, '*')
    }

    // Delete workspace (cascades to channels, members, messages)
    const { error: deleteError } = await supabase
      .from('wspr_workspaces')
      .delete()
      .eq('id', workspaceId)

    if (deleteError) {
      console.error('Error deleting workspace:', deleteError)
      return false
    }

    console.log(`✅ Workspace ${workspaceId} deleted`)
    return true
  } catch (error) {
    console.error('Delete workspace error:', error)
    return false
  }
}
