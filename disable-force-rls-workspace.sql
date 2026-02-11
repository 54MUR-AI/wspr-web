-- Temporarily disable FORCE RLS to allow workspace creation
-- FORCE RLS applies policies even to table owners, which might be blocking inserts

-- Disable FORCE RLS (keep regular RLS enabled)
ALTER TABLE wspr_workspaces NO FORCE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'wspr_workspaces'
AND schemaname = 'public';

-- List policies to confirm they're still active
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'wspr_workspaces'
ORDER BY cmd, policyname;
