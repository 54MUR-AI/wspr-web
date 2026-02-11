import { supabase, WsprChannel } from '../lib/supabase'

/**
 * Get channels for a workspace
 */
export async function getWorkspaceChannels(workspaceId: string): Promise<WsprChannel[]> {
  try {
    const { data, error } = await supabase
      .from('wspr_channels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching channels:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Channel fetch error:', error)
    return []
  }
}

/**
 * Create new channel
 */
export async function createChannel(
  workspaceId: string,
  userId: string,
  name: string,
  description?: string,
  isPrivate: boolean = false
): Promise<WsprChannel | null> {
  try {
    if (!name || !name.trim()) {
      console.error('Channel name is required')
      return null
    }

    // Check if user has permission to create channels in this workspace
    const { canManageChannels } = await import('./permissions.service')
    const hasPermission = await canManageChannels(userId, workspaceId)
    
    if (!hasPermission) {
      console.error('User does not have permission to create channels in this workspace')
      return null
    }

    const { data, error } = await supabase
      .from('wspr_channels')
      .insert({
        workspace_id: workspaceId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        is_private: isPrivate,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating channel:', error)
      return null
    }

    // If private, add creator as member
    if (isPrivate) {
      await addChannelMember(data.id, userId)
    }

    // Create LDGR subfolder for this channel
    // Get workspace LDGR folder first
    const { data: workspace, error: workspaceError } = await supabase
      .from('wspr_workspaces')
      .select('ldgr_folder_id')
      .eq('id', workspaceId)
      .single()

    console.log('📁 Channel created, checking workspace folder:', { workspace, workspaceError })

    if (workspace?.ldgr_folder_id) {
      console.log('📁 Sending channel folder creation message to RMG:', {
        channelId: data.id,
        channelName: name,
        workspaceFolderId: workspace.ldgr_folder_id,
        ownerId: userId
      })
      
      // Send message to parent RMG to create channel subfolder
      window.parent.postMessage({
        type: 'WSPR_CREATE_CHANNEL_FOLDER',
        channelId: data.id,
        channelName: name,
        workspaceFolderId: workspace.ldgr_folder_id,
        ownerId: userId
      }, '*')
    } else {
      console.warn('⚠️ Workspace has no LDGR folder ID, cannot create channel subfolder')
    }

    return data
  } catch (error) {
    console.error('Create channel error:', error)
    return null
  }
}

/**
 * Get or create default channels for workspace
 */
export async function getOrCreateDefaultChannels(
  workspaceId: string,
  userId: string
): Promise<WsprChannel[]> {
  try {
    const existingChannels = await getWorkspaceChannels(workspaceId)
    
    if (existingChannels.length > 0) {
      return existingChannels
    }

    // Create default channels
    const defaultChannels = [
      { name: 'general', description: 'General discussion', isPrivate: false },
      { name: 'random', description: 'Random chat', isPrivate: false }
    ]

    const channels: WsprChannel[] = []
    for (const channelData of defaultChannels) {
      const channel = await createChannel(
        workspaceId,
        userId,
        channelData.name,
        channelData.description,
        channelData.isPrivate
      )
      if (channel) {
        channels.push(channel)
      }
    }

    return channels
  } catch (error) {
    console.error('Get/create default channels error:', error)
    return []
  }
}

/**
 * Add member to private channel
 */
export async function addChannelMember(channelId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wspr_channel_members')
      .insert({
        channel_id: channelId,
        user_id: userId
      })

    if (error) {
      console.error('Error adding channel member:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Add channel member error:', error)
    return false
  }
}

/**
 * Check if user has access to channel
 */
export async function hasChannelAccess(channelId: string, userId: string): Promise<boolean> {
  try {
    // Get channel
    const { data: channel, error: channelError } = await supabase
      .from('wspr_channels')
      .select('*, workspace:wspr_workspaces(*)')
      .eq('id', channelId)
      .single()

    if (channelError || !channel) {
      return false
    }

    // If public channel, check workspace membership
    if (!channel.is_private) {
      const { data: member } = await supabase
        .from('wspr_workspace_members')
        .select('id')
        .eq('workspace_id', channel.workspace_id)
        .eq('user_id', userId)
        .single()

      return !!member
    }

    // If private channel, check channel membership
    const { data: channelMember } = await supabase
      .from('wspr_channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single()

    return !!channelMember
  } catch (error) {
    console.error('Channel access check error:', error)
    return false
  }
}

/**
 * Delete channel and its LDGR subfolder
 */
export async function deleteChannel(channelId: string, userId: string): Promise<boolean> {
  try {
    // Get channel info with workspace
    const { data: channel, error: channelError } = await supabase
      .from('wspr_channels')
      .select(`
        id,
        name,
        ldgr_folder_id,
        workspace:wspr_workspaces(id, owner_id, name)
      `)
      .eq('id', channelId)
      .single()

    if (channelError || !channel) {
      console.error('Error fetching channel:', channelError)
      return false
    }

    // Check if user has permission to delete channels in this workspace
    const { canManageChannels } = await import('./permissions.service')
    const hasPermission = await canManageChannels(userId, (channel.workspace as any)?.id)
    
    if (!hasPermission) {
      console.error('User does not have permission to delete channels in this workspace')
      return false
    }

    // Verify user is channel creator or workspace owner
    const workspaceOwnerId = (channel.workspace as any).owner_id
    if (channel.created_by !== userId && workspaceOwnerId !== userId) {
      console.error('Only channel creator or workspace owner can delete channel')
      return false
    }

    // Send message to RMG to delete LDGR subfolder
    if (channel.ldgr_folder_id) {
      window.parent.postMessage({
        type: 'WSPR_DELETE_LDGR_FOLDER',
        folderId: channel.ldgr_folder_id,
        channelId: channelId
      }, '*')
    }

    // Delete channel (cascades to messages, members)
    const { error: deleteError } = await supabase
      .from('wspr_channels')
      .delete()
      .eq('id', channelId)

    if (deleteError) {
      console.error('Error deleting channel:', deleteError)
      return false
    }

    console.log(`✅ Channel ${channelId} deleted`)
    return true
  } catch (error) {
    console.error('Delete channel error:', error)
    return false
  }
}
