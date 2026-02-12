-- Check RLS policies on wspr_workspace_members
-- This is likely blocking the join in getUserWorkspaces()

SELECT 
  'wspr_workspace_members policies:' as info,
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'wspr_workspace_members'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT 
  'RLS status:' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'wspr_workspace_members'
AND schemaname = 'public';

-- Test if you can see your membership directly
SELECT 
  'Your memberships:' as info,
  workspace_id,
  user_id,
  role
FROM wspr_workspace_members
WHERE user_id = auth.uid();
