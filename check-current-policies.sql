-- Check current state of all RLS policies

-- Check wspr_messages policies
SELECT 
  'wspr_messages policies:' as table_name,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'wspr_messages'
ORDER BY cmd, policyname;

-- Check wspr_profiles policies (might be blocking the SELECT join)
SELECT 
  'wspr_profiles policies:' as table_name,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'wspr_profiles'
ORDER BY cmd, policyname;

-- Check RLS status on both tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('wspr_messages', 'wspr_profiles')
AND schemaname = 'public';
