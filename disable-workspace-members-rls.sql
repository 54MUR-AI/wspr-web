-- Temporarily disable RLS on wspr_workspace_members to test if that's the issue
-- This will allow us to see if the data exists but RLS is blocking it

-- Disable RLS
ALTER TABLE wspr_workspace_members DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT 
  'Test with RLS disabled:' as info,
  workspace_id,
  user_id,
  role
FROM wspr_workspace_members
WHERE user_id = auth.uid();

-- If this returns rows, RLS is the problem
-- If this still returns no rows, the data doesn't exist or auth.uid() is wrong

-- Re-enable RLS after test
ALTER TABLE wspr_workspace_members ENABLE ROW LEVEL SECURITY;
