-- Allow workspace owners to delete any message in their workspace
-- This updates the DELETE policy on wspr_messages

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "Users can delete their own messages" ON wspr_messages;

-- Create new DELETE policy that allows:
-- 1. Users to delete their own messages (anywhere)
-- 2. Admin/Mod users to delete any message in Public workspace
-- 3. Workspace owners to delete any message in their workspace
CREATE POLICY "Users can delete their own messages"
ON wspr_messages FOR DELETE TO authenticated
USING (
  -- User owns the message
  user_id = auth.uid()
  OR
  -- User is workspace owner
  EXISTS (
    SELECT 1 FROM wspr_channels
    INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
    WHERE wspr_channels.id = wspr_messages.channel_id
    AND wspr_workspaces.owner_id = auth.uid()
  )
  OR
  -- User is admin/mod AND message is in Public workspace
  (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND (is_admin = true OR is_moderator = true)
    )
    AND
    EXISTS (
      SELECT 1 FROM wspr_channels
      INNER JOIN wspr_workspaces ON wspr_channels.workspace_id = wspr_workspaces.id
      WHERE wspr_channels.id = wspr_messages.channel_id
      AND wspr_workspaces.name = 'Public'
    )
  )
);

-- Verify the policy
SELECT 
  'Updated DELETE policy:' as info,
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'wspr_messages'
AND cmd = 'DELETE';
