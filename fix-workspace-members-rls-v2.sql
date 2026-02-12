-- Fix wspr_workspace_members RLS policies (v2 - handles existing policies)
-- Drop ALL policies first to ensure clean slate

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

-- Create clean, simple policies

-- SELECT: Users can view all workspace members (needed for joins)
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
  cmd
FROM pg_policies
WHERE tablename = 'wspr_workspace_members'
ORDER BY cmd, policyname;

-- Test if you can now see your memberships
SELECT 
  'Test query:' as info,
  workspace_id,
  user_id,
  role
FROM wspr_workspace_members
WHERE user_id = auth.uid();
