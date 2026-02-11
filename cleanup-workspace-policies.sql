-- Cleanup duplicate and conflicting workspace policies
-- There are multiple SELECT, UPDATE, and DELETE policies causing conflicts

-- Drop ALL existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can view their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they own or are members of" ON wspr_workspaces;
DROP POLICY IF EXISTS "workspaces_select" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON wspr_workspaces;

-- Ensure RLS is enabled
ALTER TABLE wspr_workspaces ENABLE ROW LEVEL SECURITY;

-- Create ONLY the correct policies (no duplicates)

-- SELECT: Only show workspaces where user is a member
CREATE POLICY "Users can view their workspaces"
ON wspr_workspaces
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT workspace_id 
    FROM wspr_workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Users can create workspaces they own
CREATE POLICY "Users can create workspaces"
ON wspr_workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Only owners can update their workspaces
CREATE POLICY "Workspace owners can update"
ON wspr_workspaces
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE: Only owners can delete (except Public workspace)
CREATE POLICY "Workspace owners can delete"
ON wspr_workspaces
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
  AND name != 'Public'
);

-- Verify only 4 policies exist now (one for each operation)
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'wspr_workspaces'
ORDER BY cmd, policyname;

-- Should show exactly 4 policies:
-- 1. Users can create workspaces (INSERT)
-- 2. Workspace owners can delete (DELETE)
-- 3. Users can view their workspaces (SELECT)
-- 4. Workspace owners can update (UPDATE)
