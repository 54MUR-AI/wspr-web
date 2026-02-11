-- Manually create Public LDGR folder if it doesn't exist
-- Run this if debug shows Public workspace has no ldgr_folder_id

-- Step 1: Create the Public folder in LDGR (replace 'FIRST_USER_ID' with actual user ID)
-- You can get the first user ID from: SELECT id FROM auth.users LIMIT 1;
INSERT INTO folders (user_id, name, parent_id, display_order)
VALUES (
  'FIRST_USER_ID', -- Replace with actual user ID
  'Public',
  NULL,
  0
)
RETURNING id;

-- Step 2: Link the folder to Public workspace
-- Replace 'FOLDER_ID' with the ID returned from step 1
UPDATE wspr_workspaces
SET ldgr_folder_id = 'FOLDER_ID' -- Replace with actual folder ID
WHERE name = 'Public';

-- Step 3: Grant all users read access to the Public folder
-- Replace 'FOLDER_ID' with the actual folder ID
INSERT INTO folder_access (folder_id, user_id, access_level)
SELECT 
  'FOLDER_ID' as folder_id, -- Replace with actual folder ID
  u.id as user_id,
  'read' as access_level
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM folder_access fa
  WHERE fa.folder_id = 'FOLDER_ID' -- Replace with actual folder ID
  AND fa.user_id = u.id
)
ON CONFLICT (folder_id, user_id) DO NOTHING;

-- Step 4: Verify
SELECT 
  w.name as workspace_name,
  w.ldgr_folder_id,
  f.name as folder_name,
  COUNT(fa.user_id) as users_with_access
FROM wspr_workspaces w
LEFT JOIN folders f ON f.id = w.ldgr_folder_id
LEFT JOIN folder_access fa ON fa.folder_id = w.ldgr_folder_id
WHERE w.name = 'Public'
GROUP BY w.id, w.name, w.ldgr_folder_id, f.name;
