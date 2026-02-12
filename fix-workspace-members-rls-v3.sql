-- Fix wspr_workspace_members RLS policies (v3 - CORRECT visibility)
-- The v2 script made SELECT too permissive with USING (true)
-- This allows EVERYONE to see ALL memberships, exposing private workspaces

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

-- Create CORRECT policies

-- SELECT: Users can ONLY view memberships for workspaces they belong to
-- This prevents exposing private workspace memberships to everyone
CREATE POLICY "Users can view workspace members"
ON wspr_workspace_members FOR SELECT TO authenticated
USING (
  -- User can see memberships for workspaces they are a member of
  workspace_id IN (
    SELECT workspace_id 
    FROM wspr_workspace_members 
    WHERE user_id = auth.uid()
  )
);

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
