-- Complete fix for Public workspace LDGR folder
-- This creates the folder, links it, and grants access to all users

-- Step 1: Get the Public workspace owner (first user who created it)
-- We'll use this user as the folder owner
DO $$
DECLARE
  workspace_owner_id UUID;
  new_folder_id UUID;
  workspace_id_var UUID;
BEGIN
  -- Get Public workspace info
  SELECT id, owner_id INTO workspace_id_var, workspace_owner_id
  FROM wspr_workspaces
  WHERE name = 'Public'
  LIMIT 1;

  IF workspace_owner_id IS NULL THEN
    RAISE EXCEPTION 'Public workspace not found';
  END IF;

  -- Create the Public folder in LDGR
  INSERT INTO folders (user_id, name, parent_id, display_order)
  VALUES (workspace_owner_id, 'Public', NULL, 0)
  RETURNING id INTO new_folder_id;

  RAISE NOTICE 'Created Public folder with ID: %', new_folder_id;

  -- Link the folder to Public workspace
  UPDATE wspr_workspaces
  SET ldgr_folder_id = new_folder_id
  WHERE id = workspace_id_var;

  RAISE NOTICE 'Linked folder to Public workspace';

  -- Grant all users read access to the Public folder
  INSERT INTO folder_access (folder_id, user_id, access_level)
  SELECT 
    new_folder_id,
    u.id,
    'read'
  FROM auth.users u
  ON CONFLICT (folder_id, user_id) DO NOTHING;

  RAISE NOTICE 'Granted read access to all users';

END $$;

-- Verify the setup
SELECT 
  w.name as workspace_name,
  w.ldgr_folder_id,
  f.name as folder_name,
  f.user_id as folder_owner,
  COUNT(fa.user_id) as users_with_access
FROM wspr_workspaces w
LEFT JOIN folders f ON f.id = w.ldgr_folder_id
LEFT JOIN folder_access fa ON fa.folder_id = w.ldgr_folder_id
WHERE w.name = 'Public'
GROUP BY w.id, w.name, w.ldgr_folder_id, f.name, f.user_id;
