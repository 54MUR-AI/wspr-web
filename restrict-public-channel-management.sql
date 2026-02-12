-- Restrict channel creation/deletion in Public workspace to admin/mod only
-- This updates the INSERT and DELETE policies on wspr_channels

-- Drop existing channel policies
DROP POLICY IF EXISTS "Users can create channels in their workspaces" ON wspr_channels;
DROP POLICY IF EXISTS "Users can delete channels in their workspaces" ON wspr_channels;

-- Create new INSERT policy for channels
-- Regular users can create channels in their own workspaces
-- Only admin/mod can create channels in Public workspace
CREATE POLICY "Users can create channels in their workspaces"
ON wspr_channels FOR INSERT TO authenticated
WITH CHECK (
  -- User is a workspace member
  EXISTS (
    SELECT 1 FROM wspr_workspace_members
    WHERE workspace_id = wspr_channels.workspace_id
    AND user_id = auth.uid()
  )
  AND
  (
    -- Either it's NOT the Public workspace (regular users can create)
    NOT EXISTS (
      SELECT 1 FROM wspr_workspaces
      WHERE id = wspr_channels.workspace_id
      AND name = 'Public'
    )
    OR
    -- OR user is admin/mod (can create in Public)
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND (is_admin = true OR is_moderator = true)
    )
  )
);

-- Create new DELETE policy for channels
-- Regular users can delete channels in their own workspaces
-- Only admin/mod can delete channels in Public workspace
CREATE POLICY "Users can delete channels in their workspaces"
ON wspr_channels FOR DELETE TO authenticated
USING (
  -- User is a workspace member
  EXISTS (
    SELECT 1 FROM wspr_workspace_members
    WHERE workspace_id = wspr_channels.workspace_id
    AND user_id = auth.uid()
  )
  AND
  (
    -- Either it's NOT the Public workspace (regular users can delete)
    NOT EXISTS (
      SELECT 1 FROM wspr_workspaces
      WHERE id = wspr_channels.workspace_id
      AND name = 'Public'
    )
    OR
    -- OR user is admin/mod (can delete in Public)
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND (is_admin = true OR is_moderator = true)
    )
  )
);

-- Verify the policies
SELECT 
  'Updated channel policies:' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'wspr_channels'
AND cmd IN ('INSERT', 'DELETE')
ORDER BY cmd, policyname;
