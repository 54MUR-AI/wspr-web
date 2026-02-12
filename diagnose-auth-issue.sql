-- Deep diagnostic for auth and profile sync issues
-- This will help identify why DenaliFox sees TestWorkspace and posts as 54MUR41

-- 1. Show ALL users in auth.users
SELECT 
  '1. All users in auth.users:' as info,
  id,
  email,
  raw_user_meta_data->>'display_name' as display_name,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Show ALL profiles in wspr_profiles
SELECT 
  '2. All profiles in wspr_profiles:' as info,
  id,
  display_name,
  updated_at
FROM wspr_profiles
ORDER BY updated_at DESC;

-- 3. Show ALL workspaces
SELECT 
  '3. All workspaces:' as info,
  id,
  name,
  owner_id,
  is_public,
  created_at
FROM wspr_workspaces
ORDER BY created_at DESC;

-- 4. Show ALL workspace memberships
SELECT 
  '4. All workspace memberships:' as info,
  wm.workspace_id,
  w.name as workspace_name,
  wm.user_id,
  p.display_name as member_display_name,
  wm.role,
  wm.joined_at
FROM wspr_workspace_members wm
LEFT JOIN wspr_workspaces w ON wm.workspace_id = w.id
LEFT JOIN wspr_profiles p ON wm.user_id = p.id
ORDER BY wm.joined_at DESC;

-- 5. Check if DenaliFox user exists
SELECT 
  '5. DenaliFox user check:' as info,
  id,
  email,
  raw_user_meta_data->>'display_name' as display_name
FROM auth.users
WHERE raw_user_meta_data->>'display_name' ILIKE '%denali%'
   OR email ILIKE '%denali%';

-- 6. Check if 54MUR41 user exists
SELECT 
  '6. 54MUR41 user check:' as info,
  id,
  email,
  raw_user_meta_data->>'display_name' as display_name
FROM auth.users
WHERE raw_user_meta_data->>'display_name' ILIKE '%54MUR41%'
   OR email ILIKE '%ronin%';

-- 7. Check TestWorkspace ownership and members
SELECT 
  '7. TestWorkspace details:' as info,
  w.id as workspace_id,
  w.name,
  w.owner_id,
  au.email as owner_email,
  au.raw_user_meta_data->>'display_name' as owner_display_name
FROM wspr_workspaces w
LEFT JOIN auth.users au ON w.owner_id = au.id
WHERE w.name = 'TestWorkspace';

-- 8. Check who can see TestWorkspace (based on membership)
SELECT 
  '8. Who can see TestWorkspace:' as info,
  wm.user_id,
  au.email,
  au.raw_user_meta_data->>'display_name' as display_name,
  wm.role
FROM wspr_workspace_members wm
LEFT JOIN auth.users au ON wm.user_id = au.id
WHERE wm.workspace_id = (SELECT id FROM wspr_workspaces WHERE name = 'TestWorkspace');
