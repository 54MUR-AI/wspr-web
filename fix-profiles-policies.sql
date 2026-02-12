-- Fix wspr_profiles duplicate policies
-- Drop old duplicate policies and keep only the correct ones

-- Drop old duplicate policies
DROP POLICY IF EXISTS "profiles_insert" ON wspr_profiles;
DROP POLICY IF EXISTS "profiles_select" ON wspr_profiles;
DROP POLICY IF EXISTS "profiles_update" ON wspr_profiles;

-- Verify remaining policies
SELECT 
  'wspr_profiles policies (should be 3):' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'wspr_profiles'
ORDER BY cmd, policyname;

-- Expected policies:
-- 1. Users can insert own profile (INSERT)
-- 2. Users can view all profiles (SELECT)
-- 3. Users can update own profile (UPDATE)
