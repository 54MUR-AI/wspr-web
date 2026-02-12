-- Check TestWorkspace visibility and membership

-- Find TestWorkspace
SELECT 
  'TestWorkspace details:' as info,
  id,
  name,
  owner_id,
  ldgr_folder_id,
  created_at
FROM wspr_workspaces
WHERE name = 'TestWorkspace';

-- Check who is a member of TestWorkspace
SELECT 
  'TestWorkspace members:' as info,
  wm.user_id,
  wm.role,
  p.display_name,
  wm.joined_at
FROM wspr_workspace_members wm
LEFT JOIN wspr_profiles p ON wm.user_id = p.id
WHERE wm.workspace_id = (
  SELECT id FROM wspr_workspaces WHERE name = 'TestWorkspace'
);

-- Check your user ID (replace with actual admin user ID if known)
-- Get all workspaces you're a member of
SELECT 
  'Your workspace memberships:' as info,
  w.id,
  w.name,
  wm.role,
  w.owner_id
FROM wspr_workspace_members wm
INNER JOIN wspr_workspaces w ON wm.workspace_id = w.id
WHERE wm.user_id = auth.uid()
ORDER BY w.name;

-- If TestWorkspace exists but you're not a member, add yourself
-- Run this if needed (uncomment and replace workspace_id):
/*
INSERT INTO wspr_workspace_members (workspace_id, user_id, role)
SELECT 
  id,
  auth.uid(),
  'owner'
FROM wspr_workspaces
WHERE name = 'TestWorkspace'
AND NOT EXISTS (
  SELECT 1 FROM wspr_workspace_members
  WHERE workspace_id = wspr_workspaces.id
  AND user_id = auth.uid()
);
*/
