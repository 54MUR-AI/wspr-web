-- Debug why Public folder isn't appearing in LDGR

-- 1. Check if Public workspace exists and has ldgr_folder_id
SELECT 
  id,
  name,
  ldgr_folder_id,
  owner_id,
  is_public,
  created_at
FROM wspr_workspaces
WHERE name = 'Public';

-- 2. Check if the Public folder exists in folders table
SELECT 
  f.id,
  f.name,
  f.user_id,
  f.parent_id,
  f.created_at
FROM folders f
WHERE f.id IN (
  SELECT ldgr_folder_id 
  FROM wspr_workspaces 
  WHERE name = 'Public' 
  AND ldgr_folder_id IS NOT NULL
);

-- 3. Check folder_access entries for Public folder
SELECT 
  fa.id,
  fa.folder_id,
  fa.user_id,
  fa.access_level,
  u.email,
  f.name as folder_name
FROM folder_access fa
JOIN auth.users u ON u.id = fa.user_id
JOIN folders f ON f.id = fa.folder_id
WHERE fa.folder_id IN (
  SELECT ldgr_folder_id 
  FROM wspr_workspaces 
  WHERE name = 'Public' 
  AND ldgr_folder_id IS NOT NULL
);

-- 4. Check workspace members for Public workspace
SELECT 
  wm.workspace_id,
  wm.user_id,
  wm.role,
  u.email,
  w.name as workspace_name
FROM wspr_workspace_members wm
JOIN auth.users u ON u.id = wm.user_id
JOIN wspr_workspaces w ON w.id = wm.workspace_id
WHERE w.name = 'Public';

-- 5. Test query that LDGR uses to get shared folders
-- Replace 'YOUR_USER_ID' with actual user ID
SELECT f.*
FROM folders f
WHERE f.id IN (
  SELECT folder_id 
  FROM folder_access 
  WHERE user_id = 'YOUR_USER_ID'
)
AND f.parent_id IS NULL;
