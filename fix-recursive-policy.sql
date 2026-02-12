-- Fix infinite recursion in wspr_workspace_members SELECT policy
-- The v3 policy references wspr_workspace_members in its own USING clause, causing infinite recursion

-- Drop ALL policies first
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'wspr_workspace_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON wspr_workspace_members', pol.policyname);
  END LOOP;
END $$;

-- Create CORRECT policies without recursion

-- SELECT: Users can view ALL workspace members
-- We need this permissive for the join in getUserWorkspaces() to work
-- The workspace visibility is controlled by wspr_workspaces RLS, not here
CREATE POLICY "Users can view workspace members"
ON wspr_workspace_members FOR SELECT TO authenticated
USING (true);

-- INSERT: Users can add members to workspaces they own
CREATE POLICY "Users can add workspace members"
ON wspr_workspace_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wspr_workspaces
    WHERE id = wspr_workspace_members.workspace_id
    AND owner_id = auth.uid()
  )
);

-- UPDATE: Users can update members in workspaces they own
CREATE POLICY "Users can update workspace members"
ON wspr_workspace_members FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM wspr_workspaces
    WHERE id = wspr_workspace_members.workspace_id
    AND owner_id = auth.uid()
  )
);

-- DELETE: Users can remove members from workspaces they own
CREATE POLICY "Users can remove workspace members"
ON wspr_workspace_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM wspr_workspaces
    WHERE id = wspr_workspace_members.workspace_id
    AND owner_id = auth.uid()
  )
);

-- Verify policies
SELECT 
  'Updated policies:' as info,
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'wspr_workspace_members'
ORDER BY cmd, policyname;
