-- Fix workspace INSERT policy to allow creation
-- The current policy is blocking workspace creation

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create workspaces" ON wspr_workspaces;

-- Create new INSERT policy that allows authenticated users to create workspaces
CREATE POLICY "Users can create workspaces"
ON wspr_workspaces
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
);

-- Verify the policy
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
WHERE tablename = 'wspr_workspaces'
AND policyname = 'Users can create workspaces';
