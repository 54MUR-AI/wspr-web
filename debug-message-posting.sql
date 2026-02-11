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
-- STEP 4: Test the INSERT policy conditions
-- ============================================

-- Test if the policy condition would pass for a specific channel
-- Replace 'CHANNEL_ID_HERE' with an actual channel ID from step 2
DO $$
DECLARE
  test_channel_id uuid;
  test_user_id uuid;
  is_member boolean;
  is_public_channel boolean;
BEGIN
  -- Get current user
  test_user_id := auth.uid();
  
  -- Get first Public channel
  SELECT id INTO test_channel_id
  FROM wspr_channels c
  INNER JOIN wspr_workspaces w ON c.workspace_id = w.id
  WHERE w.name = 'Public'
  LIMIT 1;
  
  -- Test membership condition
  SELECT EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspace_members ON wspr_channels.workspace_id = wspr_workspace_members.workspace_id
    WHERE wspr_channels.id = test_channel_id
    AND wspr_workspace_members.user_id = test_user_id
  ) INTO is_member;
  
  -- Test Public workspace condition
  SELECT EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
    WHERE wspr_channels.id = test_channel_id
    AND wspr_workspaces.name = 'Public'
  ) INTO is_public_channel;
  
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE 'Channel ID: %', test_channel_id;
  RAISE NOTICE 'Is member of workspace: %', is_member;
  RAISE NOTICE 'Is Public channel: %', is_public_channel;
  RAISE NOTICE 'Policy should allow: %', (is_member OR is_public_channel);
END $$;

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
