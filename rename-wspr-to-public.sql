-- Rename existing WSPR workspaces to Public
-- This migration renames the default WSPR workspace to Public and makes it truly public

-- Update existing WSPR workspace name to Public
UPDATE wspr_workspaces
SET 
  name = 'Public',
  description = 'Shared workspace for all users',
  is_public = true
WHERE name = 'WSPR';

-- Ensure all users are members of the Public workspace
-- This will add any users who aren't already members
INSERT INTO wspr_workspace_members (workspace_id, user_id, role)
SELECT 
  w.id as workspace_id,
  u.id as user_id,
  'member' as role
FROM wspr_workspaces w
CROSS JOIN auth.users u
WHERE w.name = 'Public'
AND NOT EXISTS (
  SELECT 1 FROM wspr_workspace_members wm
  WHERE wm.workspace_id = w.id
  AND wm.user_id = u.id
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Grant all users access to the Public workspace LDGR folder
-- Note: This requires the folder_access table from LDGR
INSERT INTO folder_access (folder_id, user_id, access_level)
SELECT 
  w.ldgr_folder_id as folder_id,
  u.id as user_id,
  'read' as access_level
FROM wspr_workspaces w
CROSS JOIN auth.users u
WHERE w.name = 'Public'
AND w.ldgr_folder_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM folder_access fa
  WHERE fa.folder_id = w.ldgr_folder_id
  AND fa.user_id = u.id
)
ON CONFLICT (folder_id, user_id) DO NOTHING;
