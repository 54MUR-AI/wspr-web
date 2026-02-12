-- Verify the specific INSERT that's failing
-- channel_id: db26d3e1-6347-491d-9f2e-9883ebcc4213
-- user_id: 2d0381c1-b3ce-483e-9bf3-b63fa8c5c96a

-- Check if this channel exists and which workspace it belongs to
SELECT 
  'Channel info:' as info,
  c.id as channel_id,
  c.name as channel_name,
  c.workspace_id,
  w.name as workspace_name
FROM wspr_channels c
INNER JOIN wspr_workspaces w ON c.workspace_id = w.id
WHERE c.id = 'db26d3e1-6347-491d-9f2e-9883ebcc4213';

-- Check if this user is a member of the workspace that owns this channel
SELECT 
  'User membership in channel workspace:' as info,
  EXISTS (
    SELECT 1 FROM wspr_channels c
    INNER JOIN wspr_workspace_members wm ON c.workspace_id = wm.workspace_id
    WHERE c.id = 'db26d3e1-6347-491d-9f2e-9883ebcc4213'
    AND wm.user_id = '2d0381c1-b3ce-483e-9bf3-b63fa8c5c96a'
  ) as is_member_of_workspace;

-- Check if this channel is in Public workspace
SELECT 
  'Is Public channel:' as info,
  EXISTS (
    SELECT 1 FROM wspr_channels c
    INNER JOIN wspr_workspaces w ON c.workspace_id = w.id
    WHERE c.id = 'db26d3e1-6347-491d-9f2e-9883ebcc4213'
    AND w.name = 'Public'
  ) as is_public_channel;

-- Check if user is member of Public workspace
SELECT 
  'User in Public workspace:' as info,
  EXISTS (
    SELECT 1 FROM wspr_workspace_members wm
    INNER JOIN wspr_workspaces w ON wm.workspace_id = w.id
    WHERE w.name = 'Public'
    AND wm.user_id = '2d0381c1-b3ce-483e-9bf3-b63fa8c5c96a'
  ) as is_public_member;

-- Test the exact INSERT policy condition
SELECT 
  'INSERT policy would pass:' as info,
  (
    EXISTS (
      SELECT 1 FROM wspr_channels
      INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
      WHERE wspr_channels.id = 'db26d3e1-6347-491d-9f2e-9883ebcc4213'
      AND wspr_workspace_members.user_id = '2d0381c1-b3ce-483e-9bf3-b63fa8c5c96a'
    )
    OR
    EXISTS (
      SELECT 1 FROM wspr_channels
      INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
      WHERE wspr_channels.id = 'db26d3e1-6347-491d-9f2e-9883ebcc4213'
      AND wspr_workspaces.name = 'Public'
    )
  ) as policy_check;
