-- Force RLS fix for workspace visibility
-- This ensures RLS is properly enabled and policies are correctly applied

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE wspr_workspaces DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON wspr_workspaces;

-- Step 3: Re-enable RLS
ALTER TABLE wspr_workspaces ENABLE ROW LEVEL SECURITY;

-- Step 4: Force RLS for table owner (important!)
ALTER TABLE wspr_workspaces FORCE ROW LEVEL SECURITY;

-- Step 5: Create new policies with correct logic

-- SELECT: Users can only see workspaces they are members of
CREATE POLICY "Users can view their workspaces"
ON wspr_workspaces
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM wspr_workspace_members
    WHERE wspr_workspace_members.workspace_id = wspr_workspaces.id
    AND wspr_workspace_members.user_id = auth.uid()
  )
);

-- INSERT: Authenticated users can create workspaces
CREATE POLICY "Users can create workspaces"
ON wspr_workspaces
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only workspace owners can update
CREATE POLICY "Workspace owners can update"
ON wspr_workspaces
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- DELETE: Only workspace owners can delete (except Public)
CREATE POLICY "Workspace owners can delete"
ON wspr_workspaces
FOR DELETE
TO authenticated
USING (
  auth.uid() = owner_id
  AND name != 'Public'
);

-- Step 6: Ensure wspr_workspace_members also has RLS
ALTER TABLE wspr_workspace_members ENABLE ROW LEVEL SECURITY;

-- Drop existing member policies
DROP POLICY IF EXISTS "Users can view workspace members" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON wspr_workspace_members;

-- Members can view other members in their workspaces
CREATE POLICY "Users can view workspace members"
ON wspr_workspace_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM wspr_workspace_members wm
    WHERE wm.workspace_id = wspr_workspace_members.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Workspace owners can manage members
CREATE POLICY "Workspace owners can manage members"
ON wspr_workspace_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM wspr_workspaces
    WHERE wspr_workspaces.id = wspr_workspace_members.workspace_id
    AND wspr_workspaces.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM wspr_workspaces
    WHERE wspr_workspaces.id = wspr_workspace_members.workspace_id
    AND wspr_workspaces.owner_id = auth.uid()
  )
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user 
ON wspr_workspace_members(workspace_id, user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user 
ON wspr_workspace_members(user_id);

-- Step 8: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('wspr_workspaces', 'wspr_workspace_members');
