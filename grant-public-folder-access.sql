-- Grant all existing users read access to Public workspace LDGR folder
-- Run this after creating the Public workspace

-- Grant read access to Public folder for all users
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

-- Verify the grants
SELECT 
  w.name as workspace_name,
  w.ldgr_folder_id,
  COUNT(fa.user_id) as users_with_access
FROM wspr_workspaces w
LEFT JOIN folder_access fa ON fa.folder_id = w.ldgr_folder_id
WHERE w.name = 'Public'
GROUP BY w.id, w.name, w.ldgr_folder_id;
