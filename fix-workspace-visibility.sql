-- Fix workspace visibility issues
-- Users should only see workspaces they are members of

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON wspr_workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON wspr_workspaces;

-- Policy: Users can only view workspaces they are members of
CREATE POLICY "Users can view their workspaces"
ON wspr_workspaces
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wspr_workspace_members
    WHERE wspr_workspace_members.workspace_id = wspr_workspaces.id
    AND wspr_workspace_members.user_id = auth.uid()
  )
);

-- Policy: Users can create workspaces
CREATE POLICY "Users can create workspaces"
ON wspr_workspaces
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Policy: Workspace owners can update their workspaces
CREATE POLICY "Workspace owners can update"
ON wspr_workspaces
FOR UPDATE
USING (auth.uid() = owner_id);

-- Policy: Workspace owners can delete their workspaces (except Public)
CREATE POLICY "Workspace owners can delete"
ON wspr_workspaces
FOR DELETE
USING (
  auth.uid() = owner_id
  AND name != 'Public'
);

-- Ensure Public workspace exists and is marked as public
UPDATE wspr_workspaces
SET is_public = true
WHERE name = 'Public';

-- Remove duplicate Public workspaces (keep oldest one)
DELETE FROM wspr_workspaces
WHERE name = 'Public'
AND id NOT IN (
  SELECT id FROM wspr_workspaces
  WHERE name = 'Public'
  ORDER BY created_at ASC
  LIMIT 1
);
