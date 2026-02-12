-- Check current RLS policies on wspr_workspaces

SELECT 
  'wspr_workspaces policies:' as info,
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'wspr_workspaces'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT 
  'RLS status:' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'wspr_workspaces'
AND schemaname = 'public';

-- Test if you can see workspaces directly (bypassing join)
SELECT 
  'Direct workspace query:' as info,
  id,
  name,
  owner_id
FROM wspr_workspaces
WHERE name = 'TestWorkspace';
