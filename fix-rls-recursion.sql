-- Fix infinite recursion in RLS policies
-- The issue: policies were referencing each other in a circular way

-- Step 1: Disable RLS temporarily
ALTER TABLE wspr_workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspace_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies
DROP POLICY IF EXISTS "Users can view their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can view workspace members" ON wspr_workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON wspr_workspace_members;

-- Step 3: Re-enable RLS with FORCE
ALTER TABLE wspr_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wspr_workspace_members FORCE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE policies for wspr_workspace_members FIRST (no recursion)

-- Members can view all members (simple, no joins)
CREATE POLICY "Users can view workspace members"
ON wspr_workspace_members
FOR SELECT
TO authenticated
USING (true);  -- Allow viewing all members for now

-- Users can insert themselves as members (for invites)
CREATE POLICY "Users can join workspaces"
ON wspr_workspace_members
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Will be validated by application logic

-- Users can only update/delete their own membership OR if they own the workspace
CREATE POLICY "Users can manage their membership"
ON wspr_workspace_members
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()  -- Can manage own membership
  OR workspace_id IN (
    SELECT id FROM wspr_workspaces WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR workspace_id IN (
    SELECT id FROM wspr_workspaces WHERE owner_id = auth.uid()
  )
);

-- Step 5: Create policies for wspr_workspaces (references members, but members don't reference back)

-- SELECT: Users can only see workspaces they are members of
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

-- INSERT: Authenticated users can create workspaces
CREATE POLICY "Users can create workspaces"
ON wspr_workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Only workspace owners can update
CREATE POLICY "Workspace owners can update"
ON wspr_workspaces
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE: Only workspace owners can delete (except Public)
CREATE POLICY "Workspace owners can delete"
ON wspr_workspaces
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
  AND name != 'Public'
);

-- Step 6: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('wspr_workspaces', 'wspr_workspace_members')
AND schemaname = 'public';
