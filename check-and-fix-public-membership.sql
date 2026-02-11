-- Check and fix Public workspace membership
-- The issue is likely that users aren't automatically members of Public workspace

-- ============================================
-- STEP 1: Check Public workspace and its members
-- ============================================

-- Find the Public workspace
SELECT id, name, owner_id, is_public, created_at
FROM wspr_workspaces
WHERE name = 'Public';

-- Check who is a member of Public workspace
SELECT 
  wm.user_id,
  wm.role,
  wm.created_at
FROM wspr_workspace_members wm
INNER JOIN wspr_workspaces w ON wm.workspace_id = w.id
WHERE w.name = 'Public'
ORDER BY wm.created_at;

-- ============================================
-- STEP 2: Add ALL authenticated users to Public workspace
-- ============================================

-- This ensures everyone can post in Public channels
-- Insert all users who aren't already members
INSERT INTO wspr_workspace_members (workspace_id, user_id, role)
SELECT 
  (SELECT id FROM wspr_workspaces WHERE name = 'Public' LIMIT 1) as workspace_id,
  id as user_id,
  'member' as role
FROM auth.users
WHERE id NOT IN (
  SELECT user_id 
  FROM wspr_workspace_members 
  WHERE workspace_id = (SELECT id FROM wspr_workspaces WHERE name = 'Public' LIMIT 1)
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- ============================================
-- STEP 3: Verify all users are now members
-- ============================================

-- Count total users
SELECT 'Total users:' as info, COUNT(*) as count FROM auth.users;

-- Count Public workspace members
SELECT 'Public workspace members:' as info, COUNT(*) as count
FROM wspr_workspace_members wm
INNER JOIN wspr_workspaces w ON wm.workspace_id = w.id
WHERE w.name = 'Public';

-- These numbers should match!
