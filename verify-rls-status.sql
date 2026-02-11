-- Verify RLS is enabled and check current policies

-- Check if RLS is enabled on wspr_workspaces
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'wspr_workspaces';

-- List all policies on wspr_workspaces
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'wspr_workspaces';

-- Check workspace memberships for current user
SELECT 
  w.id,
  w.name,
  w.owner_id,
  wm.user_id as member_user_id,
  wm.role
FROM wspr_workspaces w
LEFT JOIN wspr_workspace_members wm ON wm.workspace_id = w.id
ORDER BY w.created_at DESC;

-- Test the policy logic manually
-- This should only return workspaces where the current user is a member
SELECT 
  w.*
FROM wspr_workspaces w
WHERE EXISTS (
  SELECT 1 FROM wspr_workspace_members wm
  WHERE wm.workspace_id = w.id
  AND wm.user_id = auth.uid()
);
