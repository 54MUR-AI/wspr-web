-- Debug message posting issues
-- This script helps identify why message posting is failing

-- ============================================
-- STEP 1: Check your current user ID
-- ============================================
SELECT 
  'Your user ID:' as info,
  auth.uid() as user_id;

-- ============================================
-- STEP 2: Check Public workspace and channels
-- ============================================

-- Find Public workspace
SELECT 
  'Public workspace:' as info,
  id as workspace_id,
  name,
  owner_id
FROM wspr_workspaces
WHERE name = 'Public';

-- Find channels in Public workspace
SELECT 
  'Public channels:' as info,
  c.id as channel_id,
  c.name as channel_name,
  c.workspace_id,
  w.name as workspace_name
FROM wspr_channels c
INNER JOIN wspr_workspaces w ON c.workspace_id = w.id
WHERE w.name = 'Public';

-- ============================================
-- STEP 3: Check if you're a member of Public workspace
-- ============================================

-- Check your membership
SELECT 
  'Your Public workspace membership:' as info,
  wm.user_id,
  wm.role,
  w.name as workspace_name
FROM wspr_workspace_members wm
INNER JOIN wspr_workspaces w ON wm.workspace_id = w.id
WHERE w.name = 'Public'
AND wm.user_id = auth.uid();

-- ============================================
-- STEP 4: Show all users and their Public workspace membership
-- ============================================

-- Show all users and whether they're members of Public workspace
SELECT 
  'All users and Public membership:' as info,
  u.id as user_id,
  u.email,
  CASE 
    WHEN wm.user_id IS NOT NULL THEN 'YES - Member'
    ELSE 'NO - Not a member'
  END as is_public_member,
  wm.role
FROM auth.users u
LEFT JOIN wspr_workspace_members wm ON u.id = wm.user_id
  AND wm.workspace_id = (SELECT id FROM wspr_workspaces WHERE name = 'Public' LIMIT 1)
ORDER BY u.email;

-- ============================================
-- STEP 5: Check current message policies
-- ============================================

SELECT 
  'Current message policies:' as info,
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'wspr_messages'
ORDER BY cmd, policyname;
