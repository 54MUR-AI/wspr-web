-- Verify current workspace RLS policies

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'wspr_workspaces'
AND schemaname = 'public';

-- List all current policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'wspr_workspaces'
ORDER BY cmd, policyname;

-- Test INSERT with current user
-- This will show if the policy allows the insert
SELECT 
  auth.uid() as current_user_id,
  'Testing if INSERT would work' as test;
